import { useState, useEffect } from 'react';
import { supabase } from '../../../../app/supabaseClient';
import Spinner from '../../../../components/Buttons/Spinner';
import styles from './BillingHistory.module.css';

export default function BillingHistory() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) return;

      // Fetch invoices
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select(`
          *,
          subscriptions(
            billing_interval,
            license_quantity,
            plans(name)
          )
        `)
        .eq('subscriptions.team_id', profile.team_id)
        .order('issued_at', { ascending: false });

      setInvoices(invoiceData || []);

      // Fetch payments
      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceData?.map(inv => inv.id))
        .order('created_at', { ascending: false });

      setPayments(paymentData || []);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: '#059669',
      pending: '#d97706',
      overdue: '#dc2626',
      voided: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner />
        <p>Loading billing history...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Billing History</h1>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'invoices' ? styles.active : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            Invoices ({invoices.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'payments' ? styles.active : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments ({payments.length})
          </button>
        </div>
      </div>

      {activeTab === 'invoices' && (
        <div className={styles.content}>
          {invoices.length === 0 ? (
            <div className={styles.empty}>
              <h3>No Invoices Found</h3>
              <p>You don't have any invoices yet.</p>
            </div>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Invoice #</div>
                <div>Date</div>
                <div>Plan</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Due Date</div>
              </div>
              {invoices.map((invoice) => (
                <div key={invoice.id} className={styles.tableRow}>
                  <div className={styles.invoiceNumber}>
                    {invoice.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div>{formatDate(invoice.issued_at)}</div>
                  <div>
                    {invoice.subscriptions?.plans?.name || 'N/A'}
                    <span className={styles.detail}>
                      {invoice.subscriptions?.license_quantity} users
                    </span>
                  </div>
                  <div className={styles.amount}>
                    {formatCurrency(invoice.total_amount)}
                  </div>
                  <div>
                    <span 
                      className={styles.status}
                      style={{ color: getStatusColor(invoice.status) }}
                    >
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                  <div>{formatDate(invoice.due_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className={styles.content}>
          {payments.length === 0 ? (
            <div className={styles.empty}>
              <h3>No Payments Found</h3>
              <p>You don't have any payment records yet.</p>
            </div>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Payment ID</div>
                <div>Date</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Type</div>
                <div>Approval Code</div>
              </div>
              {payments.map((payment) => (
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
                      style={{ color: getStatusColor(payment.status) }}
                    >
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                  <div>{payment.type}</div>
                  <div>{payment.approval_code || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
