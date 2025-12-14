import "./styles/global.css";
import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from "./store";
import { useAuth } from "./hooks/useAuth";
import { useWebSocket } from "./hooks/useWebSocket";
import { loginSuccess } from "@/store/slices/authSlice";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Payment from "./pages/Payment";
import Recurring from "./pages/Recurring";
import Split from "./pages/Split";
import FriendRequest from "./pages/FriendRequest";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import PaymentHistory from "@/pages/PaymentHistory";
import ReceivedList from "@/pages/ReceivedList";
import PendingPayments from "@/pages/PendingPayments";
import SplitHistory from "@/pages/SplitHistory";

/* ✅ Protected Route Wrapper */
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return element;
};

/* ✅ Main App Content (Router + Session Restore) */
const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  // ✅ Restore JWT from localStorage on reload
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");

    if (token && email) {
      dispatch(
        loginSuccess({
          token,
          user: { name: name || "", email, role: "user" },
        })
      );
    }
  }, [dispatch]);
  useWebSocket();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/chat" element={<ProtectedRoute element={<Chat />} />} />
        <Route path="/payment" element={<ProtectedRoute element={<Payment />} />} />
        <Route path="/recurring" element={<ProtectedRoute element={<Recurring />} />} />
        <Route path="/split" element={<ProtectedRoute element={<Split />} />} />
        <Route path="/split/edit/:id" element={<ProtectedRoute element={<Split />} />} /> {/* ✅ fixed */}
        <Route path="/friends" element={<ProtectedRoute element={<FriendRequest />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
        <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} />} />
        <Route path="/payments" element={<PaymentHistory />} />
        <Route path="/received" element={<ReceivedList />} />
        <Route path="/pending" element={<PendingPayments />} />
        <Route path="/splits" element={<SplitHistory />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

    </BrowserRouter>
  );
};

/* ✅ Wrap App with Redux Provider */
const App = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);

export default App;
