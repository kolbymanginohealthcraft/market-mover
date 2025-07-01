// src/components/SelectPlan.jsx
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from "../../app/supabaseClient"

const PLANS = [
  { name: 'Starter', price: '$2,500/mo', priceId: 'starter_mock' },
  { name: 'Advanced', price: '$3,750/mo', priceId: 'advanced_mock' },
  { name: 'Pro', price: '$5,750/mo', priceId: 'pro_mock' },
]

function SelectPlan() {
  const location = useLocation()
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    const incoming = location.state?.planName
    if (incoming) {
      setSelectedPlan(incoming)
    }
  }, [location.state])

  const handleSelect = async (priceId) => {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      alert('User not logged in')
      return
    }

    const user_id = data.user.id

    const res = await fetch(
      'https://ukuxibhujcozcwozljzf.supabase.co/functions/v1/create-checkout-session',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, price_id: priceId }),
      }
    )

    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div>
      <h2>Select a Subscription Plan</h2>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            style={{
              border: plan.name === selectedPlan ? '2px solid blue' : '1px solid #ccc',
              padding: '1rem',
              backgroundColor: plan.name === selectedPlan ? '#f0f8ff' : '#fff',
            }}
          >
            <h3>{plan.name}</h3>
            <p>{plan.price}</p>
            <button onClick={() => handleSelect(plan.priceId)}>
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SelectPlan
