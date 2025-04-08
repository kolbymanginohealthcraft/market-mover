import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Navbar from '../components/Navbar'
import styles from './PricingPage.module.css'

const PLANS = [
  { name: 'Starter', price: '$2,500/mo', priceId: 'starter_mock' },
  { name: 'Advanced', price: '$3,750/mo', priceId: 'advanced_mock' },
  { name: 'Pro', price: '$5,750/mo', priceId: 'pro_mock' },
]

const PricingPage = () => {
  const navigate = useNavigate()
  const [isTestUser, setIsTestUser] = useState(false)

  const handleSelect = async (priceId) => {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      alert('Please log in first.')
      navigate('/login')
      return
    }

    const user_id = data.user.id

    // 🧪 Test user: skip checkout, mark as subscribed
    if (isTestUser || !priceId) {
      await supabase.from('profiles').upsert({
        id: user_id,
        is_test_user: true,
        is_subscribed: true,
      })

      navigate('/profile-setup')
      return
    }

    // 💳 Real Stripe checkout
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
    <>
      <Navbar />
      <div className={styles.page}>
        <h1 className={styles.title}>Pricing Plans</h1>
        <p className={styles.subtitle}>Annual subscriptions receive a 20% discount.</p>

        <div className={styles.grid}>
          {PLANS.map((plan) => (
            <div key={plan.name} className={styles.card}>
              <h2>{plan.name}</h2>
              <p className={styles.price}>{plan.price}</p>
              <ul>
                {plan.name === 'Starter' && (
                  <>
                    <li>Includes 5 users</li>
                    <li>Basic provider search</li>
                    <li>Summary analytics</li>
                    <li>Email support</li>
                    <li>Extra 5 users: +$250/mo</li>
                  </>
                )}
                {plan.name === 'Advanced' && (
                  <>
                    <li>Includes 10 users</li>
                    <li>Full provider profiles</li>
                    <li>Save & export data</li>
                    <li>Priority support</li>
                    <li>Extra 5 users: +$250/mo</li>
                  </>
                )}
                {plan.name === 'Pro' && (
                  <>
                    <li>Includes 10 users</li>
                    <li>Custom analytics dashboard</li>
                    <li>Team collaboration tools</li>
                    <li>Dedicated account manager</li>
                    <li>Extra 5 users: +$250/mo</li>
                  </>
                )}
              </ul>
              <button
                className={styles.button}
                onClick={() => handleSelect(plan.priceId)}
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>

        {/* 🧪 Test account checkbox */}
        <div style={{ marginTop: '2rem' }}>
          <label>
            <input
              type="checkbox"
              checked={isTestUser}
              onChange={() => setIsTestUser(!isTestUser)}
            />{' '}
            This is a test account (bypass payment)
          </label>
        </div>

        {/* ✅ Continue button for test users */}
        {isTestUser && (
          <div style={{ marginTop: '1rem' }}>
            <button
              className={styles.button}
              onClick={() => handleSelect(null)}
            >
              Continue as Test User
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default PricingPage
