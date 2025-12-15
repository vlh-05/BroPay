import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { paymentAPI } from "@/services/api";
import "./PaymentSent.css";

interface Payment {
  payer: string;
  receiver: string;
  amount: number;
  timestamp: string;
  status?: string;
}

const PaymentSent: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.email) return;

    let isMounted = true;

    const fetchSentPayments = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await paymentAPI.getPaymentsByPayer(user.email);

        const data: Payment[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        // sort latest first
        data.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        );

        if (isMounted) {
          setPayments(data);
        }
      } catch (err) {
        console.error("Failed to fetch sent payments:", err);
        if (isMounted) {
          setError("Unable to load sent payments. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSentPayments();

    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  return (
    <>
      <Navigation />
      <div className="payment-history-container">
        <h1>Payments Sent</h1>

        {loading && <div className="spinner"></div>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && payments.length === 0 && (
          <p className="empty">No payments sent yet.</p>
        )}

        {!loading && payments.length > 0 && (
          <table className="payment-table">
            <thead>
              <tr>
                <th>To</th>
                <th>Amount ($)</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={`${p.receiver}-${p.timestamp}`}>
                  <td>{p.receiver}</td>
                  <td className="amount">{p.amount.toFixed(2)}</td>
                  <td>
                    {p.timestamp
                      ? new Date(p.timestamp).toLocaleDateString()
                      : "--"}
                  </td>
                  <td className={`status ${(p.status || "SUCCESS").toLowerCase()}`}>
                    {p.status || "SUCCESS"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default PaymentSent;
