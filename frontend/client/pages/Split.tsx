import React, { useState, useMemo } from "react";
import { useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import Navigation from "@/components/Navigation";
import { splitAPI, receiptAPI } from "@/services/api";
import { addSplit } from "@/store/slices/paymentSlice";
import { addNotification } from "@/store/slices/notificationSlice";
import "./Split.css";
import { friendAPI } from "@/services/api";
import axios from "axios";

/* -----------------------------
 * Types
 * --------------------------- */

type SplitType = "EQUAL" | "PERCENTAGE" | "QUANTITY";

interface Participant {
  email: string;
  name: string;
  sharePercentage?: number;
}

interface QuantityDetail {
  participantId: string;
  participantName?: string;
  quantity: number;
}

interface LineItem {
  itemName: string;
  amount: number;
  quantity?: number;
  splitDetails?: QuantityDetail[];
}

interface ComputePayload {
  initiatorId: string;
  splitType: SplitType;
  lineItems: Array<{
    description: string;
    price: string;
    quantity: string;
    splitDetails?: QuantityDetail[];
  }>;
  participants: Array<{
    participantId: string;
    participantName: string;
    sharePercentage?: number;
  }>;
  tax?: string;
}

interface User {
  name: string;
  email: string;
  role?: string;
  token: string; // ✅ JWT token from backend
}

/* -----------------------------
 * Component
 * --------------------------- */

const Split: React.FC = () => {
  const { user, token } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  const { id } = useParams<{ id: string }>(); // 🔹 Get split ID if editing
  const navigate = useNavigate();
  const isEditMode = Boolean(id); // 🔹 true if editing an existing split

  const [totalAmount, setTotalAmount] = useState("");
  const [participants, setParticipants] = useState<Participant[]>(
    user ? [{ email: user.email, name: user.name }] : []
  );
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [newParticipantName, setNewParticipantName] = useState("");

  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { itemName: "", amount: 0 },
  ]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [taxAmount, setTaxAmount] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [splitResult, setSplitResult] = useState<
    Array<{
      participantEmail: string;
      participantName?: string;
      amountOwed: string;
    }>
  >([]);

  // 💬 Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchSplit = async () => {
      try {
        const res = await splitAPI.getSplitById(id);
        const s = res.data;

        setTotalAmount(s.amount || "");
        setSplitType(s.splitType || "EQUAL");

        setParticipants(
          Array.isArray(s.participants)
            ? s.participants.map((p: any) => ({
                email: p.email,
                name: p.name,
              }))
            : []
        );

        setLineItems(
          s.lineItems?.map((li: any) => ({
            itemName: li.description,
            amount: parseFloat(li.price || "0"),
            quantity: parseInt(li.quantity || "1"),
          })) || [{ itemName: "", amount: 0 }]
        );

        if (s.tax) setTaxAmount(s.tax);
      } catch (err) {
        console.error("❌ Failed to load split:", err);
        setError("Failed to load split for editing.");
      }
    };

    fetchSplit();
  }, [id, isEditMode]);

  // 🔹 Open modal when user clicks "Submit Split"
  const handleConfirmOpen = () => {
    if (!splitResult.length) {
      setError("Please process the split before submitting.");
      return;
    }
    setShowConfirmModal(true);
  };

  // 🔹 Close modal without saving
  const handleConfirmClose = () => setShowConfirmModal(false);

  // 🔹 Proceed to finalize after confirm
  const handleConfirmSubmit = async () => {
    setConfirming(true);
    try {
      await (isEditMode ? handleUpdateSplit() : handleFinalizeSplit()); // call your existing finalize logic
      setShowConfirmModal(false);
    } finally {
      setConfirming(false);
    }
  };

  /* -----------------------------
   * Derived Helpers
   * --------------------------- */

  const totalFromLineItems = useMemo(() => {
    // 🟢 Backend now treats price as already total (no multiplication by quantity)
    const baseTotal = lineItems.reduce((sum, li) => sum + (li.amount || 0), 0);

    const taxVal = parseFloat(taxAmount || "0");
    return (baseTotal + (isNaN(taxVal) ? 0 : taxVal)).toFixed(2);
  }, [lineItems, taxAmount]);

  const percentageTotal = useMemo(
    () =>
      splitType === "PERCENTAGE"
        ? participants.reduce((a, p) => a + Number(p.sharePercentage || 0), 0)
        : 0,
    [splitType, participants]
  );

  const showPercentageWarning =
    splitType === "PERCENTAGE" &&
    Math.abs(Math.round(percentageTotal) - 100) > 0;

  /* -----------------------------
   * Handlers
   * --------------------------- */

  const handleAddParticipant = async () => {
    if (!newParticipantEmail || !newParticipantName) {
      setError("Please enter participant details");
      return;
    }

    if (!user?.email) {
      setError("User not authenticated");
      return;
    }

    const email = newParticipantEmail.trim().toLowerCase();
    const name = newParticipantName.trim();

    // Avoid duplicates
    const exists = participants.some((p) => p.email.toLowerCase() === email);
    if (exists) {
      setError("Participant already added");
      return;
    }

    try {
      setError("");

      // ✅ CORRECT: goes to http://localhost:8080/api/friends/{email}
      const res = await friendAPI.getFriends(user.email);

      const friends = Array.isArray(res.data) ? res.data : [];

      const myEmail = user.email.toLowerCase();

      const friendEmails = friends
        .map((f: any) => {
          if (f?.email) return f.email.toLowerCase();

          const req = f?.requester?.email?.toLowerCase();
          const rec = f?.recipient?.email?.toLowerCase();

          if (req && rec) {
            return req === myEmail ? rec : rec === myEmail ? req : "";
          }

          return "";
        })
        .filter(Boolean);

      const isFriend = friendEmails.includes(email);

      if (!isFriend) {
        setError(
          "You can only split with friends. This user is not in your friend list."
        );
        return;
      }

      // ✅ Add participant
      setParticipants((prev) => [...prev, { email, name }]);
      setNewParticipantEmail("");
      setNewParticipantName("");
      setError("");
    } catch (err) {
      console.error("Friend check failed:", err);
      setError("Unable to verify friend status. Try again later.");
    }
  };

  const handleRemoveParticipant = (email: string) => {
    if (email === user?.email) {
      setError("Cannot remove yourself");
      return;
    }
    setParticipants(participants.filter((p) => p.email !== email));
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { itemName: "", amount: 0 }]);
  };

  const handleUpdateLineItem = (
    idx: number,
    field: keyof LineItem,
    value: any
  ) => {
    const updated = [...lineItems];
    if (field === "amount" || field === "quantity") value = Number(value) || 0;
    updated[idx] = { ...updated[idx], [field]: value };
    setLineItems(updated);
  };

  const handleRemoveLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleReceiptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await receiptAPI.uploadReceipt(file);
      const data = res.data || {};

      // Backend sends "items" not "lineItems"
      const items = Array.isArray(data.items) ? data.items : [];

      if (items.length) {
        const mapped = items.map((it: any) => ({
          itemName: String(it.description ?? ""),
          amount: Number(it.price ?? 0),
          quantity: Number(it.quantity ?? 1),
        }));

        setLineItems(mapped);

        // subtotal from items
        const subtotal = mapped.reduce(
          (sum, x) => sum + (Number(x.amount) || 0),
          0
        );

        // If backend gives totalAmount (includes tax), derive tax = total - subtotal
        if (data.totalAmount != null) {
          const total = Number(data.totalAmount) || 0;
          const derivedTax = +(total - subtotal).toFixed(2);

          if (derivedTax > 0) {
            setTaxAmount(derivedTax.toFixed(2));
          } else {
            setTaxAmount("");
          }
        }

        // You don't need setTotalAmount, UI uses totalFromLineItems anyway
      }

      setSuccess("✓ Receipt processed successfully!");
    } catch (err) {
      console.error("Receipt processing failed:", err);
      setError("Failed to process receipt. Please try manual entry.");
    } finally {
      setIsLoading(false);
    }
  };

  const buildComputePayload = (): ComputePayload => ({
    initiatorId: user?.email || "",
    splitType,
    lineItems: lineItems.map((item) => ({
      description: item.itemName,
      price: String(item.amount ?? 0),
      quantity: String(item.quantity ?? 1),
      splitDetails:
        splitType === "QUANTITY"
          ? item.splitDetails || []
          : participants.map((p) => ({
              participantId: p.email,
              participantName: p.name,
              quantity: 1,
            })),
    })),
    participants:
      splitType === "PERCENTAGE"
        ? participants.map((p) => ({
            participantId: p.email,
            participantName: p.name,
            sharePercentage: p.sharePercentage || 0,
          }))
        : participants.map((p) => ({
            participantId: p.email,
            participantName: p.name,
          })),
  });

  // 1️⃣ PROCESS SPLIT (compute only)

  const handleProcessSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSplitResult([]);

    if (!user) {
      setError("User not authenticated");
      return;
    }

    const total = parseFloat(totalFromLineItems || "0");
    if (!total || total <= 0) {
      setError("Please enter a valid total amount");
      return;
    }

    if (!participants.length) {
      setError("Add at least one participant to split");
      return;
    }

    // ✅ STEP 1: Handle percentage split correctly (new fix)
    let updatedParticipants = [...participants];

    if (splitType === "PERCENTAGE") {
      // derive percentages from UI lineItems if participants don't have them yet
      const percentMap = new Map(
        (lineItems[0]?.splitDetails || []).map((d) => [
          d.participantId,
          Number(d.quantity) || 0,
        ])
      );

      // merge into participants
      updatedParticipants = participants.map((p) => ({
        ...p,
        sharePercentage: Number(
          p.sharePercentage ?? percentMap.get(p.email) ?? 0
        ),
      }));

      // validate percentage total == 100
      const totalPercent = updatedParticipants.reduce(
        (sum, p) => sum + Number(p.sharePercentage || 0),
        0
      );
      if (Math.abs(totalPercent - 100) > 0.001) {
        setError("For percentage split, total must equal 100%.");
        return;
      }
    }

    try {
      setIsLoading(true);

      // ✅ STEP 2: Build lineItems (quantity split logic same as before)
      let updatedLineItems = lineItems;
      if (splitType === "QUANTITY") {
        updatedLineItems = lineItems.map((item) => {
          const splitDetails = participants.map((p) => {
            const qValue =
              item.splitDetails?.find((d) => d.participantId === p.email)
                ?.quantity ?? 0;
            return {
              participantId: p.email,
              participantName: p.name,
              quantity: Number(qValue) || 0,
            };
          });
          return { ...item, splitDetails };
        });
      }

      // ✅ STEP 3: Build payload cleanly
      const payload = {
        initiatorId: user?.email || "",
        splitType,
        lineItems: updatedLineItems.map((item) => ({
          description: item.itemName,
          price: String(item.amount ?? 0),
          quantity: String(item.quantity ?? 1),
          splitDetails:
            splitType === "QUANTITY" ? item.splitDetails : undefined,
        })),
        participants:
          splitType === "PERCENTAGE"
            ? updatedParticipants.map((p) => ({
                participantId: p.email,
                participantName: p.name,
                sharePercentage: Number(p.sharePercentage) || 0,
              }))
            : participants.map((p) => ({
                participantId: p.email,
                participantName: p.name,
              })),
        tax: taxAmount || "0",
      };

      console.log(
        "🚀 Final Payload Sent to Backend:",
        JSON.stringify(payload, null, 2)
      );

      // ✅ STEP 4: Call backend
      const response = await splitAPI.preview(payload);

      // ✅ STEP 5: Map backend response into local splitResult
      const merged = response.map((r: any) => {
        const email = r.participantEmail || r.participantId || "";
        const name =
          r.participantName ||
          participants.find((p) => p.email === email)?.name ||
          "";
        const owed = Number(r.amountOwed ?? r.amount ?? 0).toFixed(2);
        return {
          participantEmail: email,
          participantName: name,
          amountOwed: owed,
        };
      });

      const backendTotal = merged.reduce(
        (sum, x) => sum + parseFloat(x.amountOwed),
        0
      );
      console.log(
        "✅ Frontend Total:",
        totalFromLineItems,
        "| Backend Split Total:",
        backendTotal.toFixed(2)
      );

      setSplitResult(merged);
      setSuccess("✓ Split calculated successfully! Review before submitting.");
    } catch (err: any) {
      console.error("❌ Preview Split Error:", err);
      setError(err.response?.data?.message || "Failed to calculate split.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2️⃣ FINAL SUBMIT (save to DB)
  const handleFinalizeSplit = async () => {
    if (!splitResult.length) {
      setError("Please process the split first before submitting.");
      return;
    }

    try {
      setIsLoading(true);
      const total = parseFloat(totalFromLineItems || "0"); // ✅ use computed total (includes tax)

      const splitData = {
        initiatorEmail: user!.email,
        amount: total.toFixed(2),
        splitType,
        status: "PENDING",
        tax: taxAmount || "0", // ✅ include tax in save payload
        participants: splitResult.map((r) => ({
          name: r.participantName || r.participantEmail,
          email: r.participantEmail,
          amount: r.amountOwed,
        })),
        lineItems: lineItems.map((li) => ({
          description: li.itemName,
          price: String(li.amount),
          quantity: String(li.quantity ?? 1),
        })),
      };

      console.log("💾 Saving Split:", splitData);
      await splitAPI.save(splitData);

      dispatch(
        addNotification({
          id: `split-${Date.now()}`,
          type: "system",
          title: "Expense Split Saved",
          message: `Split of ${total.toFixed(2)} saved successfully.`,
          read: false,
          timestamp: new Date().toISOString(),
        })
      );

      setSuccess("✅ Split saved successfully!");
      setSplitResult([]);
      setLineItems([{ itemName: "", amount: 0 }]);
    } catch (err) {
      console.error("❌ Finalize Split Error:", err);
      setError("Failed to save split. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSplit = async () => {
    try {
      setIsLoading(true);
      const total = parseFloat(totalFromLineItems || "0");
      const updatedData = {
        amount: total.toFixed(2),
        splitType,
        participants,
        lineItems: lineItems.map((li) => ({
          description: li.itemName,
          price: String(li.amount),
          quantity: String(li.quantity ?? 1),
        })),
        tax: taxAmount || "0",
      };
      await splitAPI.updateSplit(id, updatedData);
      setSuccess("✅ Split updated successfully!");
      navigate("/splits");
    } catch (err) {
      console.error("❌ Update Split Error:", err);
      setError("Failed to update split.");
    } finally {
      setIsLoading(false);
    }
  };

  /* -----------------------------
   * Render
   * --------------------------- */

  return (
    <>
      <Navigation />
      <div className="container" style={{ paddingTop: "var(--spacing-lg)" }}>
        <div className="page-header">
          <h1>Split Expenses</h1>
          <p>Divide expenses easily</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="split-layout">
          {/* LEFT PANEL */}
          <div className="split-form-card">
            <h2>Create Split</h2>

            <form onSubmit={(e) => e.preventDefault()}>
              {/* Receipt Upload */}
              <div className="form-section">
                <h3>Receipt (Optional)</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  disabled={isLoading}
                />
              </div>

              {/* ✅ Auto-calculated Total & Tax */}
              <div className="form-section">
                <h3>Total Amount</h3>
                <input
                  type="number"
                  value={totalFromLineItems}
                  readOnly
                  placeholder="Auto-calculated"
                  step="0.01"
                  style={{ backgroundColor: "#f3f4f6" }}
                />
              </div>

              <div className="form-section">
                <h3>Tax (Optional)</h3>
                <input
                  type="number"
                  value={taxAmount || ""}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  placeholder="Enter tax amount"
                  step="0.01"
                />
              </div>

              {/* Line Items */}
              <div className="form-section">
                <h3>Line Items</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 80px 40px",
                    gap: "0.75rem",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span>Item Name</span>
                  <span>Price</span>
                  <span>Qty</span>
                  <span></span>
                </div>
                {lineItems.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: "1.5rem" }}>
                    {/* ✅ Core Row (Item, Amount, Qty, Delete) */}
                    <div
                      className="line-item-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 120px 80px 40px",
                        gap: "0.75rem",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, "itemName", e.target.value)
                        }
                        placeholder="Item name"
                      />
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, "amount", e.target.value)
                        }
                        placeholder="Amount"
                        step="0.01"
                        min="0.01"
                      />
                      <input
                        type="number"
                        value={item.quantity || 1}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, "quantity", e.target.value)
                        }
                        placeholder="Qty"
                        step="1"
                        min="0.01"
                      />

                      {/* ✅ Red delete button restored */}
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => handleRemoveLineItem(idx)}
                          style={{
                            width: "32px",
                            height: "32px",
                            lineHeight: "1",
                            borderRadius: "6px",
                            fontSize: "1rem",
                            textAlign: "center",
                            padding: 0,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* 👇 Additional participant split inputs */}
                    {(splitType === "PERCENTAGE" ||
                      splitType === "QUANTITY") && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "0.75rem",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            color: "#374151",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {splitType === "PERCENTAGE"
                            ? "Enter percentage for each participant"
                            : "Enter quantity for each participant"}
                        </h4>

                        {participants.map((p) => {
                          const details = item.splitDetails || [];
                          const existing = details.find(
                            (d) => d.participantId === p.email
                          );
                          const value =
                            splitType === "PERCENTAGE"
                              ? (existing?.quantity ?? "")
                              : (existing?.quantity ?? "");

                          return (
                            <div
                              key={p.email}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "0.5rem",
                                gap: "0.5rem",
                              }}
                            >
                              <span
                                style={{ fontSize: "0.9rem", width: "40%" }}
                              >
                                {p.name}
                              </span>
                              <input
                                type="number"
                                value={value}
                                placeholder={
                                  splitType === "PERCENTAGE" ? "%" : "Qty"
                                }
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setLineItems((prev) => {
                                    const copy = [...prev];
                                    const li = copy[idx];
                                    const existingDetails =
                                      li.splitDetails || [];
                                    const updated = existingDetails.filter(
                                      (d) => d.participantId !== p.email
                                    );
                                    updated.push({
                                      participantId: p.email,
                                      participantName: p.name,
                                      quantity: val,
                                    });
                                    li.splitDetails = updated;
                                    copy[idx] = { ...li };
                                    return copy;
                                  });
                                }}
                                style={{
                                  flex: "1",
                                  padding: "0.25rem 0.5rem",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "6px",
                                  fontSize: "0.85rem",
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddLineItem}
                >
                  + Add Item
                </button>
              </div>

              {/* Split Type */}
              <div className="form-section">
                <h3>Split Type</h3>
                <select
                  value={splitType}
                  onChange={(e) =>
                    setSplitType(e.target.value.toUpperCase() as SplitType)
                  }
                >
                  <option value="EQUAL">Equal Split</option>
                  <option value="PERCENTAGE">Percentage Split</option>
                  <option value="QUANTITY">Quantity Split</option>
                </select>
              </div>

              {/* Buttons for Process and Submit */}
              <div
                style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}
              >
                {/* Process Split Button */}
                <button
                  type="button"
                  className="btn btn-secondary btn-large"
                  onClick={handleProcessSplit}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Process Split"}
                </button>

                {/* Submit Split Button */}
                {/* Submit Split Button (opens confirmation modal) */}
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={handleConfirmOpen}
                  disabled={isLoading || splitResult.length === 0}
                >
                  {isLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Submitting..."
                    : isEditMode
                      ? "Update Split"
                      : "Submit Split"}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT PANEL */}
          <div className="split-sidebar">
            <h2>Participants</h2>
            {participants.map((p) => (
              <div key={p.email} className="participant-item">
                <div>
                  <div className="participant-name">{p.name}</div>
                  <div className="participant-email">{p.email}</div>
                </div>
                {p.email !== user?.email && (
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => handleRemoveParticipant(p.email)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <div className="add-participant">
              <input
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="Name"
              />
              <input
                type="email"
                value={newParticipantEmail}
                onChange={(e) => setNewParticipantEmail(e.target.value)}
                placeholder="Email"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddParticipant}
              >
                + Add Participant
              </button>
            </div>

            {/* 💡 Quick Tips */}
            {splitResult.length === 0 && (
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  💡 Quick Tips
                </h3>
                <ul
                  style={{
                    paddingLeft: "1.25rem",
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "#374151",
                  }}
                >
                  <li>
                    <strong>Equal Split</strong> — everyone pays the same.
                  </li>
                  <li>
                    <strong>Quantity Split</strong> — for shared items (e.g.,
                    food, drinks).
                  </li>
                  <li>
                    <strong>Percentage Split</strong> — when contributions
                    differ.
                  </li>
                  <li>
                    <strong>Calculate Split</strong> to preview before saving.
                  </li>
                </ul>
              </div>
            )}

            {/* ✅ Split Summary */}
            {splitResult.length > 0 && (
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #6ee7b7",
                  borderRadius: "8px",
                }}
              >
                <h3
                  style={{
                    color: "#065f46",
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                  }}
                >
                  Split Summary
                </h3>
                {splitResult.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                      borderBottom: "1px solid rgba(6,95,70,0.1)",
                      fontSize: "0.9rem",
                      color: "#065f46",
                    }}
                  >
                    <span>{item.participantName || item.participantEmail}</span>
                    <span>{parseFloat(item.amountOwed || "0").toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =======================
    💬 Confirmation Modal
======================= */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Confirm Split Submission</h3>
            <p className="modal-text">
              Are you sure you want to finalize and save this split? Once
              submitted, all participants will be notified.
            </p>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handleConfirmClose}
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmSubmit}
                disabled={confirming}
              >
                {confirming ? "Saving..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Split;
