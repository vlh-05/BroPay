import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { splitAPI } from "@/services/api";
import { useNavigate } from "react-router-dom"; // ✅ added for navigation
import "./SplitHistory.css";

const SplitHistory: React.FC = () => {
  const [byMe, setByMe] = useState<any[]>([]);
  const [forMe, setForMe] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"BY_ME" | "FOR_ME">("BY_ME");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userEmail = localStorage.getItem("userEmail");
  const navigate = useNavigate(); // ✅ added

  useEffect(() => {
    const fetchData = async () => {
      if (!userEmail) return;
      try {
        setLoading(true);
        const [byMeRes, forMeRes] = await Promise.all([
          splitAPI.getByMe(userEmail),
          splitAPI.getForMe(userEmail),
        ]);
        setByMe(byMeRes.data || []);
        setForMe(forMeRes.data || []);
      } catch (err) {
        console.error("❌ Error fetching splits:", err);
        setError("Failed to load splits.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userEmail]);

  const handleEdit = (split: any) => {
    // ✅ Navigate with split data
    navigate(`/split/edit/${split.id}`, { state: { splitData: split } });
  };

  const renderTable = (splits: any[]) => (
    <table className="table">
      <thead>
        <tr>
          <th>Created By</th>
          <th>Shared With</th>
          <th>Total Amount</th>
          <th>Split Method</th>
          <th>Current Status</th>
          <th>Created On</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {splits.map((s, i) => (
          <tr key={s.id || i}>
            {/* Initiator */}
            <td>{s.initiatorEmail}</td>

            {/* Participants — show names, fallback to "--" */}
            <td>
              {Array.isArray(s.participants) && s.participants.length > 0
                ? s.participants
                    .map((p: any) => p.name?.trim() || "(Unnamed)")
                    .join(", ")
                : "--"}
            </td>

            {/* Amount */}
            <td>
              {(() => {
                const val = parseFloat(s.amount || "0");
                return isNaN(val) ? "0.00" : val.toFixed(2);
              })()}
            </td>

            {/* Type */}
            <td>{s.splitType}</td>

            {/* Status */}
            <td>{s.status || "PENDING"}</td>

            {/* Date + Timestamp */}
            <td>
              {s.createdAt
                ? new Date(s.createdAt).toLocaleString("en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "--"}
            </td>

            {/* Edit Button */}
            <td>
              <button className="edit-btn" onClick={() => handleEdit(s)}>
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <Navigation />
      <div className="container">
        <h2 className="page-title">Split History</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="tab-container">
          <button
            className={`tab ${activeTab === "BY_ME" ? "active" : ""}`}
            onClick={() => setActiveTab("BY_ME")}
          >
            Split I Get
          </button>
          <button
            className={`tab ${activeTab === "FOR_ME" ? "active" : ""}`}
            onClick={() => setActiveTab("FOR_ME")}
          >
            Split I Owe
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : activeTab === "BY_ME" ? (
          renderTable(byMe)
        ) : (
          renderTable(forMe)
        )}
      </div>
    </>
  );
};

export default SplitHistory;
