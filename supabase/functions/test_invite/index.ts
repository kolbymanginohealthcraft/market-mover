import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-invite-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Log the request for debugging
  console.log('Request received:', req.method, req.url)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  try {
    // Use service role key to bypass auth requirements
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await req.json()
    const { email } = body

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log("Testing minimal invitation for:", email)

    // First, let's test if we can even reach this point
    if (email === 'test@test.com') {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Function is working - reached test endpoint",
          email: email
        }),
        { status: 200, headers: corsHeaders }
      )
    }

    // Absolute minimal test
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email)

    if (error) {
      console.error("Invitation failed:", error)
      return new Response(
        JSON.stringify({ 
          error: "Invitation failed", 
          details: error,
          code: error.code,
          message: error.message,
          status: error.status
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log("Invitation successful:", data)
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation sent successfully",
        data: data
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (err) {
    console.error("Unexpected error:", err)
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error", 
        details: err.message || err.toString()
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
