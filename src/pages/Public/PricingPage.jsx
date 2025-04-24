import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './PricingPage.module.css'

const PAID_PLANS = [
  { name: 'Starter', price: '$2,500/mo' },
  { name: 'Advanced', price: '$3,750/mo' },
  { name: 'Pro', price: '$5,750/mo' },
]

const FREE_PLAN = {
  name: 'Free',
  price: '$0/mo',
}

const PricingPage = () => {
  const navigate = useNavigate()

  const handleSelect = (planName) => {
    navigate(`/profile-setup?plan=${planName.toLowerCase()}`)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Pricing Plans</h1>
      <p className={styles.subtitle}>Annual subscriptions receive a 20% discount.</p>

      {/* Paid plans grid */}
      <div className={styles.grid}>
        {PAID_PLANS.map((plan) => (
          <div key={plan.name} className={styles.card}>
            {plan.name === 'Advanced' && (
              <div className={styles.badge}>Most Popular</div>
            )}
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
              onClick={() => handleSelect(plan.name)}
            >
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>

      {/* Minimal Free plan row */}
      <div className={styles.freeRowMinimal}>
        <p>
          Not ready to commit?{' '}
          <button
            className={styles.linkButton}
            onClick={() => handleSelect(FREE_PLAN.name)}
          >
            Start for Free
          </button>
        </p>
      </div>
    </div>
  )
}

export default PricingPage
