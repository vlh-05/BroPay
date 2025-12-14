import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import Navigation from '@/components/Navigation';
import { paymentAPI } from '@/services/api';
import { addPayment } from '@/store/slices/paymentSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import './Payment.css';

const Payment: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 🔹 Optional Zelle fields
  const [zelleBank, setZelleBank] = useState('');
  const [zelleTxn, setZelleTxn] = useState('');
  const [showZelleFields, setShowZelleFields] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!receiver || !amount || !method) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setIsLoading(true);

      // ✅ 1. Redirect logic for card/GPay
      if (['GPAY', 'DEBIT_CARD', 'CREDIT_CARD'].includes(method)) {
        const stripeResponse = await paymentAPI.createStripeSession({
          payer: user.email,
          receiver,
          amount: parseFloat(amount),
        });

        // Redirect to Stripe checkout
        window.location.href = stripeResponse.url;
        return;
      }

      // ✅ 2. Zelle — ask for optional details
      if (method === 'ZELLE' && !showZelleFields) {
        setShowZelleFields(true);
        setIsLoading(false);
        return;
      }

      // ✅ 3. Regular flow (cash or confirmed Zelle)
      const response = await paymentAPI.processPayment({
        payer: user.email,
        receiver,
        amount: parseFloat(amount),
        paymentMethod: method,
      });

      dispatch(
        addPayment({
          payer: user.email,
          receiver,
          amount: parseFloat(amount),
          paymentMethod: method,
        })
      );

      dispatch(
        addNotification({
          id: `payment-${Date.now()}`,
          type: 'payment',
          title: 'Payment Sent',
          message: `Successfully sent $${amount} to ${receiver} via ${method}`,
          data: {},
          read: false,
          timestamp: new Date().toISOString(),
        })
      );

      setSuccess(`✓ Payment of $${amount} sent via ${method} successfully!`);
      setReceiver('');
      setAmount('');
      setMethod('');
      setDescription('');
      setZelleBank('');
      setZelleTxn('');
      setShowZelleFields(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Payment failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
        <div className="page-header">
          <h1>Send Payment</h1>
          <p>Send money to your friends securely</p>
        </div>

        <div className="payment-layout">
          <div className="payment-form-card">
            <h2>New Payment</h2>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="receiver">Receiver Email</label>
                <input
                  id="receiver"
                  type="email"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder="friend@example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount ($)</label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00"
                  step="0.01"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="method">Payment Method</label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- Select Method --</option>
                  <option value="GPAY">GPay</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="ZELLE">Zelle</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              {showZelleFields && (
                <div className="zelle-extra">
                  <div className="form-group">
                    <label htmlFor="zelleBank">Bank Name (optional)</label>
                    <input
                      id="zelleBank"
                      type="text"
                      value={zelleBank}
                      onChange={(e) => setZelleBank(e.target.value)}
                      placeholder="Bank of America"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="zelleTxn">Transaction ID (optional)</label>
                    <input
                      id="zelleTxn"
                      type="text"
                      value={zelleTxn}
                      onChange={(e) => setZelleTxn(e.target.value)}
                      placeholder="e.g., 1234ABC"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="note">💡 These fields are optional. Submit to confirm payment.</p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Dinner, Movie tickets..."
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Processing...'
                  : showZelleFields
                  ? 'Confirm Zelle Payment'
                  : 'Send Payment'}
              </button>
            </form>
          </div>

          <div className="info-card">
            <h3>💡 Quick Tips</h3>
            <ul>
              <li>Ensure the receiver’s email is correct</li>
              <li>Select the correct payment method</li>
              <li>Stripe opens automatically for Card or GPay</li>
              <li>For Zelle, add optional bank and transaction details</li>
              <li>Cash payments record instantly</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;
