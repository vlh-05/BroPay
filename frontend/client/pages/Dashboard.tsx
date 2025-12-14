import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { analyticsAPI, paymentAPI } from "@/services/api";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Analytics {
  totalPayments: number;
  totalReceived: number;
  pendingPayments: number;
  totalSplits: number;
}

interface RecentTransaction {
  payer: string;
  receiver: string;
  amount: number;
  timestamp: string;
  status?: string;
}

const Dashboard: React.FC = () => {
  useWebSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [visibleCount, setVisibleCount] = useState(5); // 👈 show first 5 initially
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        if (user?.email) {
          // ✅ Fetch analytics summary
          const analyticsRes = await analyticsAPI.getSummary(user.email);
          setAnalytics(analyticsRes.data || analyticsRes);

          // ✅ Fetch payments
          const paymentsRes = await paymentAPI.getPaymentsByPayer(user.email);
          const allTransactions = Array.isArray(paymentsRes)
            ? paymentsRes
            : Array.isArray(paymentsRes.data)
            ? paymentsRes.data
            : [];

          setTransactions(allTransactions);
        }
      } catch (err) {
        console.error("❌ Dashboard error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email]);

  // ✅ Card navigation
  const handleCardClick = (type: string) => {
    switch (type) {
      case "sent":
        navigate("/payments");
        break;
      case "received":
        navigate("/received");
        break;
      case "pending":
        navigate("/pending");
        break;
      case "splits":
        navigate("/splits");
        break;
      default:
        break;
    }
  };

  // ✅ Handle Load More button
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.name || user?.email}! 👋</h1>
          <p>Here's your financial overview</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="flex-center" style={{ minHeight: "400px" }}>
            <div className="spinner spinner-lg"></div>
          </div>
        ) : (
          <>
            {/* ✅ Analytics Section */}
            <div className="analytics-grid">
              <div
                className="analytics-card clickable"
                onClick={() => handleCardClick("sent")}
              >
                <div className="analytics-label">Total Sent</div>
                <div className="analytics-amount">
                  {analytics?.totalPayments || 0}
                </div>
              </div>

              <div
                className="analytics-card clickable"
                onClick={() => handleCardClick("received")}
              >
                <div className="analytics-label">Total Received</div>
                <div className="analytics-amount">
                  {analytics?.totalReceived || 0}
                </div>
              </div>

              <div
                className="analytics-card clickable"
                onClick={() => handleCardClick("pending")}
              >
                <div className="analytics-label">Pending Payments</div>
                <div className="analytics-amount">
                  {analytics?.pendingPayments || 0}
                </div>
              </div>

              <div
                className="analytics-card clickable"
                onClick={() => handleCardClick("splits")}
              >
                <div className="analytics-label">Total Splits</div>
                <div className="analytics-amount">
                  {analytics?.totalSplits || 0}
                </div>
              </div>
            </div>

            {/* ✅ Recent Transactions */}
            <div className="transactions-section">
              <div className="section-header">
                <h2>Recent Transactions</h2>
              </div>

              {transactions.length > 0 ? (
                <div className="transactions-table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .slice(0, visibleCount)
                        .map((tx, idx) => (
                          <tr key={idx}>
                            <td>{tx.payer}</td>
                            <td>{tx.receiver}</td>
                            <td className="amount">{tx.amount}</td>
                            <td>
                              {tx.timestamp
                                ? new Date(tx.timestamp).toLocaleDateString()
                                : "--"}
                            </td>
                            <td>{tx.status || "SUCCESS"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {/* ✅ Load More Button */}
                  {visibleCount < transactions.length && (
                    <div className="load-more-container">
                      <button
                        onClick={handleLoadMore}
                        className="btn btn-outline-primary"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No transactions yet. Start by sending a payment!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
