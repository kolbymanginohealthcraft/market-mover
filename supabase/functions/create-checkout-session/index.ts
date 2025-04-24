// index.ts (still plain JavaScript)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { user_id, price_id } = await req.json()

  console.log('Mock checkout session for user:', user_id, 'with plan:', price_id)

  const mockStripeUrl = 'https://example.com/stripe-checkout?mock=true'

  return new Response(
    JSON.stringify({ url: mockStripeUrl }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
