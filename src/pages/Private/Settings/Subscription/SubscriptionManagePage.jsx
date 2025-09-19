import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, AlertTriangle, Calendar, Users, CreditCard, Trash2, Edit, Plus, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../../../../app/supabaseClient';
import Button from '../../../../components/Buttons/Button';
import Spinner from '../../../../components/Buttons/Spinner';
import SectionHeader from '../../../../components/Layouts/SectionHeader';
import styles from './SubscriptionManagePage.module.css';

export default function SubscriptionManagePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [billingHistory, setBillingHistory] = useState({ invoices: [], payments: [] });
  const [showHistory, setShowHistory] = useState(false);
  const [editingLicenses, setEditingLicenses] = useState(false);
  const [newLicenseCount, setNewLicenseCount] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchBillingHistory = async () => {
    if (!profile?.team_id) return;
    
    try {
      // Fetch invoices
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select(`
          *,
          subscriptions(
            license_quantity
          )
        `)
        .eq('subscriptions.team_id', profile.team_id)
        .order('issued_at', { ascending: false });

      // Fetch payments
      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .in('invoice_id', invoiceData?.map(inv => inv.id) || [])
        .order('created_at', { ascending: false });

      setBillingHistory({
        invoices: invoiceData || [],
        payments: paymentData || []
      });
    } catch (error) {
      console.error('Error fetching billing history:', error);
    }
  };

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("team_id, role")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      if (profileData.team_id) {
        // Fetch team data
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("name, max_users")
          .eq("id", profileData.team_id)
          .single();

        if (!teamError && team) {
          setTeamInfo({ id: profileData.team_id, ...team });
        }

        // Fetch subscription data
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("team_id", profileData.team_id)
          .single();

        if (!subError && subData) {
          setSubscription(subData);
        }
      }
    } catch (err) {
      console.error("Error fetching subscription data:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleAddLicenses = () => {
    navigate('/app/settings/subscription/add-licenses');
  };

  const handleChangeBilling = () => {
    // TODO: Implement billing interval change
    console.log('Change billing interval');
  };

  const handleCancelSubscription = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setProcessing(true);
    try {
      // TODO: Integrate with payment processor to cancel subscription
      console.log('Canceling subscription:', {
        subscriptionId: subscription.id,
        reason: cancellationReason
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update subscription status
      const { error } = await supabase
        .from("subscriptions")
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq("id", subscription.id);

      if (!error) {
        setShowCancelModal(false);
        setCancellationReason('');
        await fetchSubscriptionData();
        alert('Subscription canceled successfully');
      } else {
        console.error('Error canceling subscription:', error);
        alert('Error canceling subscription. Please try again.');
      }
    } catch (err) {
      console.error('Error canceling subscription:', err);
      alert('Error canceling subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "–";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'past_due': return '#ef4444';
      case 'canceled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'past_due': return 'Past Due';
      case 'canceled': return 'Canceled';
      default: return status;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getBillingStatusColor = (status) => {
    const colors = {
      paid: '#10b981',
      pending: '#f59e0b',
      overdue: '#ef4444',
      voided: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getBillingStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleLicenseUpdate = async () => {
    if (!subscription || newLicenseCount === subscription.license_quantity) {
      setEditingLicenses(false);
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          license_quantity: newLicenseCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Refresh subscription data
      await fetchSubscriptionData();
      setEditingLicenses(false);
    } catch (error) {
      console.error('Error updating licenses:', error);
      alert('Failed to update licenses. Please try again.');
    } finally {
      setProcessing(false);
    }
  };


  const startEditingLicenses = () => {
    setNewLicenseCount(subscription?.license_quantity || 0);
    setEditingLicenses(true);
  };


  const fetchPaymentMethods = async () => {
    if (!profile?.team_id) return;
    
    try {
      const { data: methodsData, error: methodsError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("team_id", profile.team_id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (!methodsError && methodsData) {
        setPaymentMethods(methodsData);
      }
    } catch (err) {
      console.error("Error fetching payment methods:", err);
    }
  };

  const handleSetDefaultPayment = async (methodId) => {
    try {
      // First, unset all other default methods
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("team_id", profile.team_id);

      // Then set the selected method as default
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", methodId);

      if (!error) {
        await fetchPaymentMethods();
      } else {
        console.error("Error setting default payment method:", error);
      }
    } catch (err) {
      console.error("Error setting default payment method:", err);
    }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", methodId);

      if (!error) {
        await fetchPaymentMethods();
      } else {
        console.error("Error deleting payment method:", error);
      }
    } catch (err) {
      console.error("Error deleting payment method:", err);
    }
  };

  const formatExpiryDate = (month, year) => {
    if (!month || !year) return "–";
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const getCardBrandIcon = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  const maskCardNumber = (last4) => {
    if (!last4) return "•••• •••• •••• ••••";
    return `•••• •••• •••• ${last4}`;
  };

  const canManageSubscription = profile?.role === 'Team Admin' || 
                               profile?.role === 'Platform Admin' || 
                               profile?.role === 'Platform Support';

  if (loading) return <Spinner message="Loading subscription management..." />;

  if (!profile?.team_id || !subscription) {
    return (
      <div className={styles.container}>
        <SectionHeader 
          title="Subscription Management" 
          icon={Settings} 
          showEditButton={false}
        />
        <div className={styles.noSubscription}>
          <h3>No Active Subscription</h3>
          <p>You don't have an active subscription to manage.</p>
          <Button 
            variant="gold" 
            size="md"
            onClick={() => navigate("/app/settings/subscription/checkout")}
          >
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Current Subscription Overview */}
      <div className={styles.sectionContainer}>
          <SectionHeader 
            title="Current Subscription" 
            icon={CreditCard} 
            showEditButton={false}
            customElement={
              <span 
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(subscription.status) }}
              >
                {getStatusLabel(subscription.status)}
              </span>
            }
          />
          <div className={styles.sectionContent}>
            
            <div className={styles.overviewDetails}>
            <div className={styles.detailRow}>
              <div className={styles.detailItem}>
                <Users size={20} style={{ width: 'var(--icon-size-lg)', height: 'var(--icon-size-lg)' }} />
                <div>
                  <span className={styles.detailLabel}>Team</span>
                  <span className={styles.detailValue}>{teamInfo?.name}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailItem}>
                <Users size={20} style={{ width: 'var(--icon-size-lg)', height: 'var(--icon-size-lg)' }} />
                <div>
                  <span className={styles.detailLabel}>Licenses</span>
                  <span className={styles.detailValue}>
                    {subscription.license_quantity} / {teamInfo?.max_users}
                  </span>
                </div>
              </div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailItem}>
                <div>
                  <span className={styles.detailLabel}>Started</span>
                  <span className={styles.detailValue}>{formatDate(subscription.started_at)}</span>
                </div>
              </div>
              <div className={styles.detailItem}>
                <div>
                  <span className={styles.detailLabel}>Last Renewed</span>
                  <span className={styles.detailValue}>{formatDate(subscription.renewed_at)}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailItem}>
                <div>
                  <span className={styles.detailLabel}>Expires</span>
                  <span className={styles.detailValue}>{formatDate(subscription.expires_at)}</span>
                </div>
              </div>
              {subscription.canceled_at && (
                <div className={styles.detailItem}>
                  <div>
                    <span className={styles.detailLabel}>Canceled</span>
                    <span className={styles.detailValue}>{formatDate(subscription.canceled_at)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {subscription.discount_percent > 0 && (
              <div className={styles.detailRow}>
                <div className={styles.detailItem}>
                  <div>
                    <span className={styles.detailLabel}>Discount</span>
                    <span className={styles.detailValue}>
                      {subscription.discount_percent}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Management Actions */}
        {canManageSubscription && subscription.status !== 'canceled' && (
          <div className={styles.sectionContainer}>
            <SectionHeader 
              title="Manage Subscription" 
              icon={Settings} 
              showEditButton={false}
            />
            <div className={styles.sectionContent}>
              <div className={styles.actionsGrid}>
              {/* License Management */}
              <div className={styles.actionItem}>
                <div className={styles.actionInfo}>
                  <h4>User Licenses</h4>
                  <p>Current: {subscription?.license_quantity || 0} licenses</p>
                </div>
                <div className={styles.actionControls}>
                  {editingLicenses ? (
                    <div className={styles.editSection}>
                      <div className={styles.editControls}>
                        <Button
                          variant="gray"
                          size="sm"
                          onClick={() => setNewLicenseCount(Math.max(5, newLicenseCount - 5))}
                          disabled={newLicenseCount <= 5}
                        >
                          -
                        </Button>
                        <span className={styles.editValue}>{newLicenseCount} licenses</span>
                        <Button
                          variant="gray"
                          size="sm"
                          onClick={() => setNewLicenseCount(newLicenseCount + 5)}
                        >
                          +
                        </Button>
                      </div>
                      <div className={styles.editActions}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleLicenseUpdate}
                          disabled={processing}
                        >
                          {processing ? 'Updating...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="gray"
                          size="sm"
                          onClick={() => setEditingLicenses(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="blue"
                      size="sm"
                      onClick={startEditingLicenses}
                    >
                      Edit Licenses
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Payment Management */}
              <div className={styles.actionItem}>
                <div className={styles.actionInfo}>
                  <h4>Payment Methods</h4>
                  <p>Manage your payment methods and billing information</p>
                </div>
                <div className={styles.actionControls}>
                  <div className={styles.actionButtons}>
                    <Button
                      variant="gray"
                      size="sm"
                      onClick={() => {
                        setShowPaymentMethods(!showPaymentMethods);
                        if (!showPaymentMethods) {
                          fetchPaymentMethods();
                        }
                      }}
                    >
                      {showPaymentMethods ? 'Hide' : 'Show'} Payment Methods
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Payment Methods Section - Full Width */}
              {showPaymentMethods && (
                <div className={styles.fullWidthPaymentMethods}>
                  <div className={styles.paymentMethodsHeader}>
                    <h5>Payment Methods</h5>
                    {canManageSubscription && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowAddPaymentForm(true)}
                      >
                        <Plus size={16} style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)' }} />
                        Add Payment Method
                      </Button>
                    )}
                  </div>

                  {/* Security Notice */}
                  <div className={styles.securityNotice}>
                    <Shield size={20} style={{ width: 'var(--icon-size-lg)', height: 'var(--icon-size-lg)' }} />
                    <div>
                      <h6>Secure Payment Storage</h6>
                      <p>Your payment information is securely tokenized and stored by our payment processor. We never store your full card details.</p>
                    </div>
                  </div>

                  {/* Payment Methods List */}
                  <div className={styles.paymentMethodsList}>
                    {paymentMethods.length === 0 ? (
                      <div className={styles.emptyState}>
                        <CreditCard size={32} style={{ width: '32px', height: '32px' }} />
                        <p>No payment methods on file</p>
                        {canManageSubscription && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowAddPaymentForm(true)}
                          >
                            Add Payment Method
                          </Button>
                        )}
                      </div>
                    ) : (
                      paymentMethods.map((method) => (
                        <div key={method.id} className={styles.paymentMethodCard}>
                          <div className={styles.paymentMethodInfo}>
                            <div className={styles.paymentMethodHeader}>
                              <div className={styles.cardDetails}>
                                <span className={styles.cardIcon}>
                                  {getCardBrandIcon(method.card_brand)}
                                </span>
                                <div className={styles.cardInfo}>
                                  <div className={styles.cardNumber}>
                                    {maskCardNumber(method.last_four_digits)}
                                  </div>
                                  <div className={styles.cardMeta}>
                                    <span className={styles.cardBrand}>
                                      {method.card_brand?.toUpperCase() || 'CARD'}
                                    </span>
                                    <span className={styles.cardExpiry}>
                                      Expires {formatExpiryDate(method.exp_month, method.exp_year)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {method.is_default && (
                                <span className={styles.defaultBadge}>Default</span>
                              )}
                            </div>
                            
                            {method.billing_address && (
                              <div className={styles.billingAddress}>
                                <strong>Billing Address:</strong>
                                <div>
                                  {method.billing_address.line1}
                                  {method.billing_address.line2 && `, ${method.billing_address.line2}`}
                                  <br />
                                  {method.billing_address.city}, {method.billing_address.state} {method.billing_address.postal_code}
                                </div>
                              </div>
                            )}
                          </div>

                          {canManageSubscription && (
                            <div className={styles.paymentMethodActions}>
                              {!method.is_default && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleSetDefaultPayment(method.id)}
                                >
                                  Set as Default
                                </Button>
                              )}
                              <Button
                                variant="gray"
                                size="sm"
                                onClick={() => setEditingPaymentMethod(method)}
                              >
                                <Edit size={14} style={{ width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)' }} />
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeletePaymentMethod(method.id)}
                              >
                                <Trash2 size={14} style={{ width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)' }} />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {/* Cancellation */}
              {subscription.status === 'active' && (
                <div className={styles.actionItem}>
                  <div className={styles.actionInfo}>
                    <h4>Cancel Subscription</h4>
                    <p>Cancel your subscription. You'll retain access until the end of your billing period.</p>
                  </div>
                  <div className={styles.actionControls}>
                    <Button
                      variant="red"
                      size="sm"
                      onClick={() => setShowCancelModal(true)}
                    >
                      <Trash2 size={14} style={{ width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)' }} />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}


        {/* Billing History */}
        <div className={styles.sectionContainer}>
          <SectionHeader 
            title="Billing & Subscription History" 
            icon={Calendar} 
            showEditButton={false}
            customElement={
              <Button
                variant="gray"
                size="sm"
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) {
                    fetchBillingHistory();
                  }
                }}
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </Button>
            }
          />
          <div className={styles.sectionContent}>
          
          {showHistory && (
            <div className={styles.historyContent}>
              {/* Subscription Events */}
              <div className={styles.historySection}>
                <h4>Subscription Events</h4>
                <div className={styles.eventsList}>
                  <div className={styles.eventItem}>
                    <div className={styles.eventIcon}>
                      <CreditCard size={16} style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)' }} />
                    </div>
                    <div className={styles.eventDetails}>
                      <div className={styles.eventTitle}>Subscription Started</div>
                      <div className={styles.eventDate}>{formatDate(subscription?.started_at)}</div>
                    </div>
                  </div>
                  
                  {subscription?.renewed_at && (
                    <div className={styles.eventItem}>
                      <div className={styles.eventIcon}>
                        <CreditCard size={16} style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)' }} />
                      </div>
                      <div className={styles.eventDetails}>
                        <div className={styles.eventTitle}>Last Renewed</div>
                        <div className={styles.eventDate}>{formatDate(subscription.renewed_at)}</div>
                      </div>
                    </div>
                  )}
                  
                  {subscription?.canceled_at && (
                    <div className={styles.eventItem}>
                      <div className={styles.eventIcon}>
                        <Trash2 size={16} style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)' }} />
                      </div>
                      <div className={styles.eventDetails}>
                        <div className={styles.eventTitle}>Subscription Canceled</div>
                        <div className={styles.eventDate}>{formatDate(subscription.canceled_at)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoices */}
              <div className={styles.historySection}>
                <h4>Invoices ({billingHistory.invoices.length})</h4>
                {billingHistory.invoices.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No invoices found</p>
                  </div>
                ) : (
                  <div className={styles.table}>
                    <div className={styles.tableHeader}>
                      <div>Invoice #</div>
                      <div>Date</div>
                      <div>Amount</div>
                      <div>Status</div>
                      <div>Due Date</div>
                    </div>
                    {billingHistory.invoices.map((invoice) => (
                      <div key={invoice.id} className={styles.tableRow}>
                        <div className={styles.invoiceNumber}>
                          {invoice.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div>{formatDate(invoice.issued_at)}</div>
                        <div className={styles.amount}>
                          {formatCurrency(invoice.total_amount)}
                        </div>
                        <div>
                          <span 
                            className={styles.status}
                            style={{ color: getBillingStatusColor(invoice.status) }}
                          >
                            {getBillingStatusLabel(invoice.status)}
                          </span>
                        </div>
                        <div>{formatDate(invoice.due_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments */}
              <div className={styles.historySection}>
                <h4>Payments ({billingHistory.payments.length})</h4>
                {billingHistory.payments.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No payment records found</p>
                  </div>
                ) : (
                  <div className={styles.table}>
                    <div className={styles.tableHeader}>
                      <div>Payment ID</div>
                      <div>Date</div>
                      <div>Amount</div>
                      <div>Status</div>
                      <div>Type</div>
                    </div>
                    {billingHistory.payments.map((payment) => (
                      <div key={payment.id} className={styles.tableRow}>
                        <div className={styles.paymentId}>
                          {payment.payment_id}
                        </div>
                        <div>{formatDate(payment.created_at)}</div>
                        <div className={styles.amount}>
                          {formatCurrency(payment.amount)}
                        </div>
                        <div>
                          <span 
                            className={styles.status}
                            style={{ color: getBillingStatusColor(payment.status) }}
                          >
                            {getBillingStatusLabel(payment.status)}
                          </span>
                        </div>
                        <div>{payment.type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.navigationActions}>
        </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={24} style={{ width: 'var(--icon-size-xl)', height: 'var(--icon-size-xl)' }} />
              <h3>Cancel Subscription</h3>
            </div>
            <div className={styles.modalContent}>
              <p>Are you sure you want to cancel your subscription? You'll retain access until the end of your billing period.</p>
              
              <div className={styles.reasonInput}>
                <label htmlFor="cancellationReason">Reason for cancellation (optional):</label>
                <textarea
                  id="cancellationReason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Help us improve by telling us why you're canceling..."
                  rows={3}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <Button
                variant="gray"
                size="md"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
                disabled={processing}
              >
                Keep Subscription
              </Button>
              <Button
                variant="red"
                size="md"
                onClick={handleCancelSubscription}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Spinner size="sm" />
                    Canceling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Payment Method Modal */}
      {(showAddPaymentForm || editingPaymentMethod) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h3>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowAddPaymentForm(false);
                  setEditingPaymentMethod(null);
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formNotice}>
                <AlertCircle size={20} style={{ width: 'var(--icon-size-lg)', height: 'var(--icon-size-lg)' }} />
                <p>Payment method management will be integrated with Cybersource payment processing.</p>
              </div>
              <div className={styles.modalActions}>
                <Button
                  variant="gray"
                  size="md"
                  onClick={() => {
                    setShowAddPaymentForm(false);
                    setEditingPaymentMethod(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    // TODO: Implement payment method creation/editing
                    console.log('Payment method form submission');
                  }}
                >
                  {editingPaymentMethod ? 'Update' : 'Add'} Payment Method
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
