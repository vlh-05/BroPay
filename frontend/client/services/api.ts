import axios, { AxiosInstance } from "axios";

// ✅ Base URL — already includes /api
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// ✅ Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Automatically attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle expired / invalid token globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

//
// -----------------------------
// 🔐 Auth endpoints
// -----------------------------
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
};

//
// -----------------------------
// 💬 Chat endpoints
// -----------------------------
export const chatAPI = {
  sendMessage: (data) => api.post("/chat/send", data),
  getRecentMessages: () => api.get("/chat/history"),
  getConversation: (user1: string, user2: string) =>
    api.get(`/chat/conversation/${user1}/${user2}`),
  getOfflineMessages(email) {
  return api.get(`/chat/offline/${email}`);
}

};

//
// -----------------------------
// 💳 Payment endpoints
// -----------------------------
export const paymentAPI = {
  // ✅ Create Stripe checkout session (for GPay / Debit / Credit)
  createStripeSession: async (payload: {
    payer: string;
    receiver: string;
    amount: number;
  }) => {
    const res = await api.post("/payment/stripe-session", payload);
    return res.data as { url: string };
  },

  // ✅ Process a manual payment (Cash / Zelle)
  processPayment: async (paymentData: {
    payer: string;
    receiver: string;
    amount: number;
    paymentMethod: string;
  }) => {
    const res = await api.post("/payment/process", paymentData);
    return res.data;
  },

  // ✅ Fetch all payments made by payer
  getPaymentsByPayer: async (payerEmail: string) => {
    const res = await api.get(`/payment/payer/${payerEmail}`);
    return res.data;
  },

  // ✅ Fetch all payments received by receiver
  getPaymentsByReceiver: async (receiverEmail: string) => {
    const res = await api.get(`/payment/receiver/${receiverEmail}`);
    return res.data;
  },

  // ✅ Fetch all pending payments for a user
  getPendingPayments: async (userEmail: string) => {
    const res = await api.get(`/payment/pending/${userEmail}`);
    return res.data;
  },
};

//
// -----------------------------
// 🔁 Recurring endpoints
// -----------------------------

export const recurringAPI = {
  /**
   * Create a new recurring entry
   */
  create: (data: {
    payerEmail: string;
    receiverEmail: string;
    amount: number;
    frequency: string;      // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
    startDate: string;      // ISO string "2025-01-01"
    endDate: string;        // ISO string "2025-12-01"
  }) => api.post("/recurring/create", data),

  /**
   * Get all OUTGOING recurring payments (user pays others)
   */
  getOutgoing: (email: string) =>
    api.get(`/recurring/outgoing/${email}`),

  /**
   * Get all INCOMING recurring payments (others pay user)
   */
  getIncoming: (email: string) =>
    api.get(`/recurring/incoming/${email}`),

  /**
   * Pause recurring payment
   */
  pause: (id: string) =>
    api.put(`/recurring/pause/${id}`),

  /**
   * Resume recurring payment
   */
  resume: (id: string) =>
    api.put(`/recurring/resume/${id}`),

  /**
   * Delete recurring entry
   * (cannot use keyword "delete" → using remove() instead)
   */
  remove: (id: string) =>
    api.delete(`/recurring/${id}`),
};


// -----------------------------
// 💰 Split endpoints
// -----------------------------
export const splitAPI = {
  // 🔹 Preview a split (compute only)
  preview: async (payload) => {
    const res = await api.post("/split/preview", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return Array.isArray(res.data) ? res.data : res.data?.result || [];
  },

  // 🔹 Save confirmed split to DB
  save: async (splitData) => {
    const res = await api.post("/split/save", splitData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return res.data;
  },

  // 🔹 Fetch splits created by user
  getByMe: (userEmail) =>
    api.get(`/split/by-me/${userEmail}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    }),

  // 🔹 Fetch splits where user is a participant
  getForMe: (userEmail) =>
    api.get(`/split/for-me/${userEmail}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    }),

  // 🔹 Fetch single split by ID
  getSplitById: (id) =>
    api.get(`/split/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    }),

  // 🔹 Update an existing split
  updateSplit: (id, updatedData) =>
    api.put(`/split/update/${id}`, updatedData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    }),
};




//
// -----------------------------
// 🧾 Receipt / OCR endpoints
// -----------------------------
export const receiptAPI = {
  uploadReceipt: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/receipts/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  parseBase64: (data: { base64Image: string; filename?: string }) =>
    api.post("/ocr/parseBase64", data),
};

//
// -----------------------------
// 🤝 Friend endpoints
// -----------------------------
export const friendAPI = {
  sendRequest: (data: { senderEmail: string; receiverEmail: string }) =>
    api.post("/friends/send", data),

  respondRequest: (
    data: { senderEmail: string; receiverEmail: string },
    accept: boolean
  ) => api.post(`/friends/respond?accept=${accept}`, data),

  getFriends: (userEmail: string) => api.get(`/friends/${userEmail}`),

  getReceivedRequests: (userEmail: string) =>
    api.get(`/friends/received/${userEmail}`),
};

//
// -----------------------------
// 📊 Analytics endpoints
// -----------------------------
export const analyticsAPI = {
  getSummary: (userEmail: string) => api.get(`/analytics/summary/${userEmail}`),
};

//
// -----------------------------
// 🔔 Notification endpoints
// -----------------------------
export const notificationAPI = {
  getUserNotifications: (email: string, token: string) =>
    api.get(`/notifications/${email}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),

  markAsRead: (id: string, token: string) =>
    api.put(`/notifications/read/${id}`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

//
// ✅ Default export
//
export default api;
