import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { recurringAPI } from "@/services/api";
import "./Recurring.css";

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
type EndType = "FOREVER" | "ON_DATE" | "AFTER_COUNT";
type TabType = "OUTGOING" | "INCOMING";
type ModeType = "PAY_FRIEND" | "RECEIVE_FROM_FRIEND";

interface RecurringEntry {
  id: string;
  payerEmail: string;
  receiverEmail: string;
  amount: number;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  nextRun: string;
  status: string;
}

const Recurring: React.FC = () => {
  const { user } = useAuth();

  // ── Mode: who is paying whom ────────────────────────────────
  const [mode, setMode] = useState<ModeType>("PAY_FRIEND");

  // ── Form state ──────────────────────────────────────────────
  const [friendEmail, setFriendEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().substring(0, 10),
  );

  const [endType, setEndType] = useState<EndType>("FOREVER");
  const [endDate, setEndDate] = useState("");
  const [count, setCount] = useState("3"); // for AFTER_COUNT

  // ── Lists (right side) ─────────────────────────────────────
  const [outgoing, setOutgoing] = useState<RecurringEntry[]>([]);
  const [incoming, setIncoming] = useState<RecurringEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("OUTGOING");

  // ── UI state ────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  // ────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────

  const addFrequencyOnce = (date: Date, freq: Frequency) => {
    const d = new Date(date.getTime());
    switch (freq) {
      case "DAILY":
        d.setDate(d.getDate() + 1);
        break;
      case "WEEKLY":
        d.setDate(d.getDate() + 7);
        break;
      case "MONTHLY":
        d.setMonth(d.getMonth() + 1);
        break;
      case "QUARTERLY":
        d.setMonth(d.getMonth() + 3);
        break;
      case "YEARLY":
        d.setFullYear(d.getFullYear() + 1);
        break;
    }
    return d;
  };

  // Auto-compute endDate when “after N payments” is chosen
  useEffect(() => {
    if (endType !== "AFTER_COUNT") return;
    const n = parseInt(count || "0", 10);
    if (!n || !startDate) return;

    let d = new Date(startDate);
    for (let i = 0; i < n; i++) {
      d = addFrequencyOnce(d, frequency);
    }
    setEndDate(d.toISOString().substring(0, 10));
  }, [endType, count, startDate, frequency]);

  const loadRecurring = async () => {
    if (!user?.email) return;
    try {
      setLoadingList(true);
      const [outRes, inRes] = await Promise.all([
        recurringAPI.getOutgoing(user.email),
        recurringAPI.getIncoming(user.email),
      ]);
      setOutgoing(outRes.data || []);
      setIncoming(inRes.data || []);
    } catch (err) {
      console.error("Failed to load recurring entries:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadRecurring();
  }, [user]);

  const formatMoney = (value: number) =>
    `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const humanFreq = (f: Frequency) => {
    switch (f) {
      case "DAILY":
        return "day";
      case "WEEKLY":
        return "week";
      case "MONTHLY":
        return "month";
      case "QUARTERLY":
        return "quarter";
      case "YEARLY":
        return "year";
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const activeList = activeTab === "OUTGOING" ? outgoing : incoming;

  // ────────────────────────────────────────────────────────────
  // Create new recurring schedule
  // ────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user?.email) {
      setError("User not authenticated.");
      return;
    }

    if (!friendEmail || !amount) {
      setError("Please fill all required fields.");
      return;
    }

    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    // Decide payer / receiver based on mode
    let payerEmail = "";
    let receiverEmail = "";

    if (mode === "PAY_FRIEND") {
      // You pay them
      payerEmail = user.email;
      receiverEmail = friendEmail;
    } else {
      // Friend pays you
      payerEmail = friendEmail;
      receiverEmail = user.email;
    }

    // Basic self-check
    if (payerEmail === receiverEmail) {
      setError("Payer and receiver cannot be the same.");
      return;
    }

    let finalEndDate = "9999-12-31";

    if (endType === "ON_DATE") {
      if (!endDate) {
        setError("Please select an end date.");
        return;
      }
      finalEndDate = endDate;
    } else if (endType === "AFTER_COUNT") {
      if (!endDate) {
        setError("Unable to compute end date. Please check payment count.");
        return;
      }
      finalEndDate = endDate;
    }

    try {
      setCreating(true);

      await recurringAPI.create({
        payerEmail,
        receiverEmail,
        amount: amt,
        frequency,
        startDate,
        endDate: finalEndDate,
      });

      setSuccess("Recurring payment created successfully.");
      setFriendEmail("");
      setAmount("");
      setFrequency("MONTHLY");
      setEndType("FOREVER");
      setEndDate("");
      setCount("3");

      await loadRecurring();
    } catch (err: any) {
      console.error("Create recurring error:", err);
      setError(
        err?.response?.data?.message || "Failed to create recurring payment.",
      );
    } finally {
      setCreating(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  // Row actions
  // ────────────────────────────────────────────────────────────

  const handlePause = async (id: string) => {
    await recurringAPI.pause(id);
    await loadRecurring();
  };

  const handleResume = async (id: string) => {
    await recurringAPI.resume(id);
    await loadRecurring();
  };

  const handleDelete = async (id: string) => {
    await recurringAPI.remove(id);
    await loadRecurring();
  };

  // ────────────────────────────────────────────────────────────
  // Skeleton item
  // ────────────────────────────────────────────────────────────

  const SkeletonItem: React.FC = () => (
    <div className="rec-item skeleton">
      <div className="rec-main">
        <div className="skeleton-line short" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line long" />
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────

  return (
    <>
      <Navigation />
      <div className="container recurring-page">
        <div className="recurring-header">
          <h1>Recurring Payments</h1>
          <p>Automate your regular payments & keep track like a pro.</p>
        </div>

        <div className="recurring-grid">
          {/* LEFT: create schedule */}
          <div className="form-card">
            <h2>Create Recurring Schedule</h2>

            {/* Mode toggle */}
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-btn ${mode === "PAY_FRIEND" ? "active" : ""}`}
                onClick={() => setMode("PAY_FRIEND")}
              >
                Pay a Friend
              </button>
              <button
                type="button"
                className={`mode-btn ${
                  mode === "RECEIVE_FROM_FRIEND" ? "active" : ""
                }`}
                onClick={() => setMode("RECEIVE_FROM_FRIEND")}
              >
                Receive from Friend
              </button>
            </div>

            

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleCreate}>
              <div className="field">
                <label>
                  {mode === "PAY_FRIEND" ? "Send to" : "Receive from"}
                </label>

                <input
                  type="email"
                  placeholder="friend@example.com"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                />


              </div>

              <div className="field">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="50.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div className="field">
                <label>Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End conditions */}
              <div className="end-condition">
                <div className="end-header">
                  <h4>Ends</h4>
                </div>

                <div className="end-options">
                  <label className="end-row">
                    <div className="end-row-main">
                      <input
                        type="radio"
                        checked={endType === "FOREVER"}
                        onChange={() => setEndType("FOREVER")}
                      />
                      <span>Never</span>
                    </div>
                  </label>

                  <label className="end-row">
                    <div className="end-row-main">
                      <input
                        type="radio"
                        checked={endType === "ON_DATE"}
                        onChange={() => setEndType("ON_DATE")}
                      />
                      <span>On a specific date</span>
                    </div>
                    {endType === "ON_DATE" && (
                      <input
                        className="end-input"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    )}
                  </label>

                  <label className="end-row">
                    <div className="end-row-main">
                      <input
                        type="radio"
                        checked={endType === "AFTER_COUNT"}
                        onChange={() => setEndType("AFTER_COUNT")}
                      />
                      <span>After N payments</span>
                    </div>
                    {endType === "AFTER_COUNT" && (
                      <input
                        className="end-input"
                        type="number"
                        min={1}
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                      />
                    )}
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? "Creating..." : "Create Recurring"}
              </button>
            </form>
          </div>

          {/* RIGHT: tabbed list */}
          <div className="list-card">
            <div className="tab-bar">
              <button
                className={`tab ${activeTab === "OUTGOING" ? "active" : ""}`}
                onClick={() => setActiveTab("OUTGOING")}
              >
                Outgoing
              </button>
              <button
                className={`tab ${activeTab === "INCOMING" ? "active" : ""}`}
                onClick={() => setActiveTab("INCOMING")}
              >
                Incoming
              </button>
            </div>

            <div className="tab-caption">
              {activeTab === "OUTGOING"
                ? "Payments you regularly send to others."
                : "Payments others should regularly send to you."}
            </div>

            <div className="rec-list-scroll">
              {loadingList && (
                <>
                  <SkeletonItem />
                  <SkeletonItem />
                  <SkeletonItem />
                </>
              )}

              {!loadingList && activeList.length === 0 && (
                <div className="empty-state">
                  <p>
                    {activeTab === "OUTGOING"
                      ? "No outgoing recurring schedules yet."
                      : "No incoming recurring schedules yet."}
                  </p>
                </div>
              )}

              {!loadingList &&
                activeList.map((rec) => {
                  const statusClass =
                    rec.status && `status-${rec.status.toLowerCase()}`;
                  return (
                    <div
                      key={rec.id}
                      className={`rec-item ${
                        activeTab === "INCOMING" ? "incoming" : ""
                      }`}
                    >
                      <div className="rec-main">
                        <div className="rec-title">
                          {activeTab === "OUTGOING"
                            ? rec.receiverEmail
                            : rec.payerEmail}
                        </div>
                        <div className="rec-subline">
                          {formatMoney(rec.amount)} every{" "}
                          {humanFreq(rec.frequency)}
                        </div>
                        <div className="rec-meta">
                          <span>Next run: {formatDate(rec.nextRun)}</span>
                          {rec.status && (
                            <span className={`status-pill ${statusClass}`}>
                              {rec.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="actions">
                        {rec.status === "ACTIVE" && (
                          <button onClick={() => handlePause(rec.id)}>
                            Pause
                          </button>
                        )}
                        {rec.status === "PAUSED" && (
                          <button onClick={() => handleResume(rec.id)}>
                            Resume
                          </button>
                        )}
                        <button onClick={() => handleDelete(rec.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Recurring;
