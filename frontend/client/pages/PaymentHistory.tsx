import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { paymentAPI } from "@/services/api";

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        if (!userEmail) return;
        const res = await paymentAPI.getPaymentsByPayer(userEmail);
        setPayments(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching payments:", err);
        setError("Failed to load payment history.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [userEmail]);

  return (
    <>
      <Navigation />
      <div className="container">
        <h2>Payments Sent</h2>

        {loading && <p>Loading payments...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && payments.length === 0 && <p>No payments found.</p>}

        {payments.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i}>
                  <td>{p.receiver}</td>
                  <td>₹{p.amount}</td>
                  <td>{new Date(p.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default PaymentHistory;
