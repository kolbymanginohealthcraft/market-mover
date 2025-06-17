// supabase/functions/join-team/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
  const { code } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // must be service key to bypass RLS
  )

  // Get current user
  const { data: { user }, error: userErr } = await supabase.auth.getUser(req.headers.get('Authorization') || '')
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Lookup team by code
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .select('*')
    .eq('access_code', code)
    .single()

  if (teamErr || !team) {
    return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 404 })
  }

  if (team.current_users >= team.max_users) {
    return new Response(JSON.stringify({ error: 'Team is full' }), { status: 400 })
  }

  // Add member
  const { error: insertErr } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'member',
    })

  if (insertErr) {
    return new Response(JSON.stringify({ error: 'Could not join team' }), { status: 500 })
  }

  // Update current_users count
  await supabase
    .from('teams')
    .update({ current_users: team.current_users + 1 })
    .eq('id', team.id)

  return new Response(JSON.stringify({ success: true }))
})
