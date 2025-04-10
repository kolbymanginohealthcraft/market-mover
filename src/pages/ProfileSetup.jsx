import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import styles from './ProfileSetup.module.css'

function ProfileSetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const selectedPlan = queryParams.get('plan') || 'free'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    company: '',
    title: '',
    acceptedTerms: false,
  })

  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    validateForm()
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email.'
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.'
    }

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.'
    if (!formData.company.trim()) newErrors.company = 'Company is required.'
    if (!formData.title.trim()) newErrors.title = 'Job title is required.'

    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = 'You must agree to the terms.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isValid = validateForm()
    setTouched({
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      company: true,
      title: true,
      acceptedTerms: true,
    })

    if (!isValid) return

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (error || !data?.user) {
      alert('Signup error: ' + (error?.message || 'Unknown error'))
      setLoading(false)
      return
    }

    const userId = data.user.id

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      organization: formData.company,
      title: formData.title,
      subscription_tier: selectedPlan,
      is_subscribed: selectedPlan === 'free',
      accepted_terms: true,
    })

    if (profileError) {
      alert('Error saving profile: ' + profileError.message)
      setLoading(false)
      return
    }

    if (selectedPlan === 'free') {
      navigate('/dashboard')
    } else {
      const res = await fetch(
        'https://<your-project-ref>.functions.supabase.co/create-checkout-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            price_id: `${selectedPlan}_mock`,
          }),
        }
      )

      const { url } = await res.json()
      window.location.href = url
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Sign Up & Set Up Your Profile</h2>
      <form onSubmit={handleSubmit} noValidate>
        {[
          ['email', 'Email'],
          ['password', 'Password', 'password'],
          ['firstName', 'First Name'],
          ['lastName', 'Last Name'],
          ['company', 'Company'],
          ['title', 'Job Title'],
        ].map(([name, label, type = 'text']) => (
          <div className={styles.formGroup} key={name}>
            <div className={styles.labelRow}>
              <label className={styles.label}>{label}</label>
              {touched[name] && errors[name] && (
                <span className={styles.errorInline}>{errors[name]}</span>
              )}
            </div>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.input}
              required
            />
          </div>
        ))}

        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Selected Plan</label>
          </div>
          <input
            type="text"
            value={selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
            disabled
            className={`${styles.input} ${styles.disabledInput}`}
          />
        </div>

        <div className={styles.termsRow}>
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.checkbox}
            required
          />
          <span
  onClick={() => window.open('/terms', 'termsWindow', 'width=600,height=700')}
  className={styles.link}
  style={{ cursor: 'pointer' }}
>
  Terms and Conditions
</span>

        </div>

        <button
          type="submit"
          disabled={!formData.acceptedTerms || loading}
          className={styles.button}
        >
          {loading
            ? 'Submitting...'
            : selectedPlan === 'free'
            ? 'Finish Setup'
            : 'Continue to Checkout'}
        </button>
      </form>
    </div>
  )
}

export default ProfileSetup
