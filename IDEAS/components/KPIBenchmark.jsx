import React, { useState } from 'react'
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Edit3,
  BarChart3,
  Calendar,
  Award,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

const KPIBenchmark = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('goals')
  const [showAddKPI, setShowAddKPI] = useState(false)
  const [editingKPI, setEditingKPI] = useState(null)

  // Sample KPI data
  const kpiData = [
    {
      id: 1,
      name: 'Social Media Followers',
      category: 'social',
      currentValue: 2847,
      baselineValue: 1200,
      goalValue: 5000,
      unit: 'followers',
      lastUpdated: '2024-01-15',
      trend: 'up',
      changePercent: 137.3,
      history: [
        { date: '2024-01-01', value: 1200 },
        { date: '2024-01-08', value: 1850 },
        { date: '2024-01-15', value: 2847 }
      ]
    },
    {
      id: 2,
      name: 'Website Traffic',
      category: 'analytics',
      currentValue: 15420,
      baselineValue: 8500,
      goalValue: 25000,
      unit: 'monthly visits',
      lastUpdated: '2024-01-15',
      trend: 'up',
      changePercent: 81.4,
      history: [
        { date: '2024-01-01', value: 8500 },
        { date: '2024-01-08', value: 12500 },
        { date: '2024-01-15', value: 15420 }
      ]
    },
    {
      id: 3,
      name: 'Google Reviews',
      category: 'reputation',
      currentValue: 4.8,
      baselineValue: 3.9,
      goalValue: 4.9,
      unit: 'stars',
      lastUpdated: '2024-01-15',
      trend: 'up',
      changePercent: 23.1,
      history: [
        { date: '2024-01-01', value: 3.9 },
        { date: '2024-01-08', value: 4.3 },
        { date: '2024-01-15', value: 4.8 }
      ]
    },
    {
      id: 4,
      name: 'Lead Generation',
      category: 'sales',
      currentValue: 45,
      baselineValue: 18,
      goalValue: 75,
      unit: 'leads/month',
      lastUpdated: '2024-01-15',
      trend: 'up',
      changePercent: 150.0,
      history: [
        { date: '2024-01-01', value: 18 },
        { date: '2024-01-08', value: 32 },
        { date: '2024-01-15', value: 45 }
      ]
    },
    {
      id: 5,
      name: 'Email Open Rate',
      category: 'email',
      currentValue: 28.5,
      baselineValue: 15.2,
      goalValue: 35.0,
      unit: '%',
      lastUpdated: '2024-01-15',
      trend: 'up',
      changePercent: 87.5,
      history: [
        { date: '2024-01-01', value: 15.2 },
        { date: '2024-01-08', value: 22.1 },
        { date: '2024-01-15', value: 28.5 }
      ]
    }
  ]

  const categories = [
    { id: 'social', name: 'Social Media', color: 'var(--secondary-blue)' },
    { id: 'analytics', name: 'Analytics', color: 'var(--primary-teal)' },
    { id: 'reputation', name: 'Reputation', color: 'var(--accent-yellow)' },
    { id: 'sales', name: 'Sales', color: 'var(--error-red)' },
    { id: 'email', name: 'Email Marketing', color: 'var(--dark-blue)' }
  ]

  const getCategoryColor = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.color || 'var(--gray-500)'
  }

  const getProgressPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100)
  }

  const getTrendIcon = (trend) => {
    return trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />
  }

  const getStatusIcon = (current, goal) => {
    const progress = (current / goal) * 100
    if (progress >= 100) return <Award size={16} style={{ color: 'var(--success-green)' }} />
    if (progress >= 75) return <CheckCircle size={16} style={{ color: 'var(--primary-teal)' }} />
    return <AlertCircle size={16} style={{ color: 'var(--accent-yellow)' }} />
  }

  const formatValue = (value, unit) => {
    if (unit === '%') return `${value.toFixed(1)}%`
    if (unit === 'stars') return `${value.toFixed(1)} ⭐`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K ${unit}`
    return `${value.toLocaleString()} ${unit}`
  }

  return (
    <div className="page-container">
      {/* Tabs */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          Goals Progress
        </button>
        <button 
          className={`nav-tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button 
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* Content */}
      <div className="page-content-area">
        {activeTab === 'goals' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Quick Stats Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem', 
              marginBottom: '1rem' 
            }}>
              <div className="widget">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '16px', 
                      backgroundColor: 'var(--primary-teal)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Target size={28} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--gray-900)', lineHeight: '1.2' }}>
                        {kpiData.length}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                        Active KPIs
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    textAlign: 'right',
                    lineHeight: '1.4'
                  }}>
                    Total tracked<br />metrics
                  </div>
                </div>
              </div>
              <div className="widget">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '16px', 
                      backgroundColor: 'var(--primary-teal)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <TrendingUp size={28} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--gray-900)', lineHeight: '1.2' }}>
                        {kpiData.filter(k => k.trend === 'up').length}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                        Improving
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    textAlign: 'right',
                    lineHeight: '1.4'
                  }}>
                    On track<br />to goals
                  </div>
                </div>
              </div>
              <div className="widget">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '16px', 
                      backgroundColor: 'var(--accent-yellow)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Award size={28} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--gray-900)', lineHeight: '1.2' }}>
                        {kpiData.filter(k => (k.currentValue / k.goalValue) * 100 >= 100).length}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                        Goals Met
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    textAlign: 'right',
                    lineHeight: '1.4'
                  }}>
                    Targets<br />achieved
                  </div>
                </div>
              </div>
              <div className="widget">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '16px', 
                      backgroundColor: 'var(--secondary-blue)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Calendar size={28} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--gray-900)', lineHeight: '1.2' }}>
                        15
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                        Days Tracked
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    textAlign: 'right',
                    lineHeight: '1.4'
                  }}>
                    Since<br />start
                  </div>
                </div>
              </div>
            </div>

            <div className="widget">
              <div className="widget-header">
                <div className="widget-title">
                  <Award size={20} />
                  Goal Progress Dashboard
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary">
                    <BarChart3 size={16} />
                    Export Report
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddKPI(true)}
                  >
                    <Plus size={16} />
                    Add KPI
                  </button>
                </div>
              </div>
              <div className="widget-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                  Track progress towards your key performance objectives
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {kpiData.map(kpi => {
                    const progress = getProgressPercentage(kpi.currentValue, kpi.goalValue)
                    const isComplete = progress >= 100
                    
                    return (
                      <div key={kpi.id} style={{
                        padding: '1.5rem',
                        border: '1px solid var(--gray-200)',
                        borderRadius: '0.75rem',
                        backgroundColor: 'white',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                              {kpi.name}
                            </h3>
                            <div style={{ 
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              backgroundColor: getCategoryColor(kpi.category),
                              color: 'white',
                              borderRadius: '1rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {categories.find(c => c.id === kpi.category)?.name}
                            </div>
                          </div>
                          {isComplete && <Award size={20} style={{ color: 'var(--success-green)' }} />}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <svg width="80" height="80" viewBox="0 0 80 80">
                              <circle
                                cx="40"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke="var(--gray-200)"
                                strokeWidth="6"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke={getCategoryColor(kpi.category)}
                                strokeWidth="6"
                                strokeDasharray={`${2 * Math.PI * 35}`}
                                strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress / 100)}`}
                                strokeLinecap="round"
                                transform="rotate(-90 40 40)"
                              />
                            </svg>
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              fontSize: '1rem',
                              fontWeight: '700',
                              color: 'var(--gray-900)'
                            }}>
                              {progress.toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Current:</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                              {formatValue(kpi.currentValue, kpi.unit)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Target:</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                              {formatValue(kpi.goalValue, kpi.unit)}
                            </span>
                          </div>
                          <div style={{ 
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: isComplete ? 'var(--success-green)' : 'var(--gray-100)',
                            borderRadius: '0.5rem',
                            textAlign: 'center'
                          }}>
                            {isComplete ? (
                              <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500' }}>
                                Goal achieved! 🎉
                              </span>
                            ) : (
                              <span style={{ color: 'var(--gray-700)', fontSize: '0.875rem' }}>
                                Need {formatValue(kpi.goalValue - kpi.currentValue, kpi.unit)} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="widget">
              <div className="widget-header">
                <div className="widget-title">
                  <TrendingUp size={20} />
                  Performance Trends
                </div>
              </div>
              <div className="widget-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                  Visualize how your KPIs are performing over time
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {kpiData.map(kpi => (
                    <div key={kpi.id} style={{
                      padding: '1.5rem',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '0.75rem',
                      backgroundColor: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                          {kpi.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {kpi.trend === 'up' ? (
                            <ArrowUp size={16} style={{ color: 'var(--success-green)' }} />
                          ) : (
                            <ArrowDown size={16} style={{ color: 'var(--error-red)' }} />
                          )}
                          <span style={{ 
                            color: kpi.trend === 'up' ? 'var(--success-green)' : 'var(--error-red)',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {kpi.changePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                                             <div style={{ marginBottom: '1rem' }}>
                         <div style={{ 
                           display: 'flex', 
                           alignItems: 'end', 
                           gap: '0.5rem', 
                           height: '120px',
                           marginBottom: '0.5rem'
                         }}>
                           {/* Baseline Bar */}
                           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                             <div 
                               style={{ 
                                 width: '100%',
                                 height: `${Math.max((kpi.baselineValue / kpi.goalValue) * 120, 12)}px`,
                                 backgroundColor: getCategoryColor(kpi.category),
                                 opacity: 0.6,
                                 borderRadius: '4px 4px 0 0',
                                 transition: 'height 0.3s ease'
                               }}
                             />
                           </div>
                           
                           {/* Current Bar */}
                           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                             <div 
                               style={{ 
                                 width: '100%',
                                 height: `${Math.max((kpi.currentValue / kpi.goalValue) * 120, 12)}px`,
                                 backgroundColor: getCategoryColor(kpi.category),
                                 borderRadius: '4px 4px 0 0',
                                 transition: 'height 0.3s ease'
                               }}
                             />
                           </div>
                           
                           {/* Goal Bar */}
                           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                             <div 
                               style={{ 
                                 width: '100%',
                                 height: '120px',
                                 backgroundColor: getCategoryColor(kpi.category),
                                 opacity: 0.3,
                                 borderRadius: '4px 4px 0 0',
                                 transition: 'height 0.3s ease'
                               }}
                             />
                           </div>
                         </div>
                       </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Baseline</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                            {formatValue(kpi.baselineValue, kpi.unit)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Current</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                            {formatValue(kpi.currentValue, kpi.unit)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Goal</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                            {formatValue(kpi.goalValue, kpi.unit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="widget">
              <div className="widget-header">
                <div className="widget-title">
                  <BarChart3 size={20} />
                  KPI History
                </div>
              </div>
              <div className="widget-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                  Complete historical data for all tracked metrics
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                          KPI Name
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                          Category
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                          Baseline
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                          Current
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                          Goal
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                          Progress
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                          Change
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpiData.map(kpi => (
                        <tr key={kpi.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div 
                                style={{ 
                                  width: '8px', 
                                  height: '8px', 
                                  borderRadius: '50%',
                                  backgroundColor: getCategoryColor(kpi.category)
                                }}
                              />
                              <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                                {kpi.name}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              backgroundColor: getCategoryColor(kpi.category),
                              color: 'white',
                              borderRadius: '1rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {categories.find(c => c.id === kpi.category)?.name}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                            {formatValue(kpi.baselineValue, kpi.unit)}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                              {formatValue(kpi.currentValue, kpi.unit)}
                            </strong>
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                            {formatValue(kpi.goalValue, kpi.unit)}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ 
                                width: '60px', 
                                height: '6px', 
                                backgroundColor: 'var(--gray-200)', 
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div 
                                  style={{ 
                                    height: '100%',
                                    width: `${getProgressPercentage(kpi.currentValue, kpi.goalValue)}%`,
                                    backgroundColor: getCategoryColor(kpi.category),
                                    borderRadius: '3px'
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                                {getProgressPercentage(kpi.currentValue, kpi.goalValue).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              {getTrendIcon(kpi.trend)}
                              <span style={{ 
                                fontSize: '0.875rem',
                                color: kpi.trend === 'up' ? 'var(--success-green)' : 'var(--error-red)',
                                fontWeight: '500'
                              }}>
                                {kpi.changePercent.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                            {new Date(kpi.lastUpdated).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add KPI Modal */}
      {showAddKPI && (
        <div className="modal-overlay" onClick={() => setShowAddKPI(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New KPI</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddKPI(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>KPI Name</label>
                <input type="text" className="form-input" placeholder="e.g., Social Media Followers" />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select className="form-select">
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Current Value</label>
                  <input type="number" className="form-input" placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input type="text" className="form-input" placeholder="e.g., followers, %, visits" />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Baseline Value</label>
                  <input type="number" className="form-input" placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Goal Value</label>
                  <input type="number" className="form-input" placeholder="0" />
                </div>
              </div>
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowAddKPI(false)}>
                  Cancel
                </button>
                <button className="btn-primary">
                  Add KPI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KPIBenchmark
