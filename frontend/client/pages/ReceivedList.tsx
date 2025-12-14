import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { paymentAPI } from "@/services/api";

const ReceivedList: React.FC = () => {
  const [received, setReceived] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchReceived = async () => {
      try {
        if (!userEmail) return;
        const res = await paymentAPI.getPaymentsByReceiver(userEmail);
        setReceived(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching received payments:", err);
        setError("Failed to load received payments.");
      } finally {
        setLoading(false);
      }
    };
    fetchReceived();
  }, [userEmail]);

  return (
    <>
      <Navigation />
      <div className="container">
        <h2>Payments Received</h2>

        {loading && <p>Loading...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && received.length === 0 && <p>No received payments found.</p>}

        {received.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Payer</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {received.map((r, i) => (
                <tr key={i}>
                  <td>{r.payer}</td>
                  <td>₹{r.amount}</td>
                  <td>{new Date(r.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default ReceivedList;
