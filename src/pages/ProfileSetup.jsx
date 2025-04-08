// ProfileSetup.jsx
// src/pages/ProfileSetup.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ProfileSetup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [organization, setOrganization] = useState('')
  const [userId, setUserId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        navigate('/login')
      } else {
        setUserId(data.user.id)
      }
    }

    fetchUser()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      organization: organization,
    })

    if (error) {
      alert('Error saving profile: ' + error.message)
      return
    }

    // 👉 Redirect to Stripe checkout after profile is saved
    const res = await fetch(
      'https://<your-project-ref>.functions.supabase.co/create-checkout-session',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          price_id: 'starter_mock' // Replace with selected plan if needed
        }),
      }
    )

    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div style={{ maxWidth: '500px', margin: '80px auto' }}>
      <h2>Set Up Your Profile</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Organization</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>
          Continue to Checkout
        </button>
      </form>
    </div>
  )
}

export default ProfileSetup
