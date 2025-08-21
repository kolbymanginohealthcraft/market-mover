import React, { useState, useEffect } from 'react'
import { 
  Coins, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Users,
  Mail
} from 'lucide-react'

const TokenUsageTracker = ({ 
  recipientCount = 0, 
  isABTest = false, 
  abTestGroups = 1,
  currentBalance = 15000,
  monthlyAllocation = 20000,
  tokensUsed = 12500,
  onTokenCheck = null 
}) => {
  const [tokenCost, setTokenCost] = useState(0)
  const [canSend, setCanSend] = useState(true)
  const [warningMessage, setWarningMessage] = useState('')

  // Token pricing (should come from settings/API)
  const tokenPricing = {
    emailPerRecipient: 1,
    abTestMultiplier: 1.5 // A/B tests cost more per recipient
  }

  useEffect(() => {
    calculateTokenCost()
  }, [recipientCount, isABTest, abTestGroups])

  const calculateTokenCost = () => {
    let cost = 0
    
    if (isABTest) {
      // A/B tests cost more per recipient and multiply by number of groups
      cost = recipientCount * tokenPricing.emailPerRecipient * tokenPricing.abTestMultiplier * abTestGroups
    } else {
      cost = recipientCount * tokenPricing.emailPerRecipient
    }
    
    setTokenCost(cost)
    
    // Check if user can afford this
    const remainingTokens = monthlyAllocation - tokensUsed
    const canAfford = cost <= remainingTokens
    setCanSend(canAfford)
    
    // Set warning message
    if (cost > remainingTokens) {
      setWarningMessage(`Insufficient tokens. You need ${cost} tokens but only have ${remainingTokens} remaining.`)
    } else if (cost > remainingTokens * 0.8) {
      setWarningMessage(`This will use ${((cost / remainingTokens) * 100).toFixed(1)}% of your remaining tokens.`)
    } else {
      setWarningMessage('')
    }
    
    // Call parent callback if provided
    if (onTokenCheck) {
      onTokenCheck({
        cost,
        canAfford,
        remainingTokens: remainingTokens - cost
      })
    }
  }

  const getUsagePercentage = () => {
    return ((tokensUsed + tokenCost) / monthlyAllocation) * 100
  }

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'var(--danger-color)'
    if (percentage >= 75) return 'var(--warning-color)'
    return 'var(--success-color)'
  }

  if (recipientCount === 0) {
    return null
  }

  return (
    <div style={{ 
      padding: '1rem', 
      border: '1px solid var(--gray-200)', 
      borderRadius: '0.5rem',
      backgroundColor: 'var(--white)',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Coins size={16} color="var(--primary-teal)" />
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)' }}>
          Token Usage Estimate
        </h4>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
            Campaign Cost
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
            {tokenCost.toLocaleString()} tokens
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            {isABTest ? `${abTestGroups} groups × ${recipientCount} recipients` : `${recipientCount} recipients`}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
            Remaining After Send
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: canSend ? 'var(--success-green)' : 'var(--error-red)' }}>
            {(monthlyAllocation - tokensUsed - tokenCost).toLocaleString()} tokens
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            {getUsagePercentage().toFixed(1)}% of monthly allocation
          </div>
        </div>
      </div>

      {/* Usage Progress Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
          <span>Monthly Usage</span>
          <span>{tokensUsed.toLocaleString()} / {monthlyAllocation.toLocaleString()}</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: 'var(--gray-200)', 
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${(tokensUsed / monthlyAllocation) * 100}%`, 
            height: '100%', 
            backgroundColor: getStatusColor((tokensUsed / monthlyAllocation) * 100),
            transition: 'width 0.3s ease'
          }} />
          {tokenCost > 0 && (
            <div style={{ 
              width: `${(tokenCost / monthlyAllocation) * 100}%`, 
              height: '100%', 
              backgroundColor: canSend ? 'var(--primary-teal)' : 'var(--error-red)',
              marginLeft: `${(tokensUsed / monthlyAllocation) * 100}%`,
              opacity: 0.7
            }} />
          )}
        </div>
      </div>

      {/* Status Message */}
      {warningMessage && (
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: canSend ? 'var(--warning-orange)' : 'var(--error-red)', 
          color: 'white', 
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {canSend ? <AlertTriangle size={16} /> : <AlertTriangle size={16} />}
          {warningMessage}
        </div>
      )}

      {canSend && !warningMessage && (
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: 'var(--success-green)', 
          color: 'white', 
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={16} />
          Sufficient tokens available for this campaign
        </div>
      )}

      {/* A/B Testing Recommendations */}
      {isABTest && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          backgroundColor: 'var(--gray-50)', 
          borderRadius: '0.25rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Info size={16} color="var(--primary-teal)" />
            <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>A/B Testing Tips</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--gray-700)' }}>
            <li>Start with smaller test groups (100-200 per variant)</li>
            <li>Test one variable at a time for clearer results</li>
            <li>Use results to optimize before full campaign send</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default TokenUsageTracker
