import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { paymentAPI } from "@/services/api";

const PendingPayments: React.FC = () => {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchPending = async () => {
      try {
        if (!userEmail) return;
        const res = await paymentAPI.getPendingPayments(userEmail);
        setPending(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching pending payments:", err);
        setError("Failed to load pending payments.");
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [userEmail]);

  return (
    <>
      <Navigation />
      <div className="container">
        <h2>Pending Payments</h2>

        {loading && <p>Loading...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && pending.length === 0 && <p>No pending payments 🎉</p>}

        {pending.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Payer</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p, i) => (
                <tr key={i}>
                  <td>{p.payer}</td>
                  <td>{p.receiver}</td>
                  <td>₹{p.amount}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default PendingPayments;
