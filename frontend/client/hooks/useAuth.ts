import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  loginSuccess,
  loginFailure,
  logout,
  setLoading,
} from "@/store/slices/authSlice";
import { authAPI } from "@/services/api";

/**
 * Custom hook for handling authentication logic
 * - Handles login, register, logout
 * - Returns user, token, isAuthenticated and loading state
 */
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  // ✅ LOGIN
  const login = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      console.log("🟦 Attempting login with:", email);

      const response = await authAPI.login({ email, password });

      // Backend expected response: { token, name, email, role }
      const { token, name, email: userEmail, role } = response.data;

      if (!token) {
        throw new Error("No token received from backend");
      }

      // ✅ Persist session in localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", name);
      localStorage.setItem("userRole", role || "USER");

      // ✅ Update Redux
      dispatch(
        loginSuccess({
          token,
          user: {
            name,
            email: userEmail,
            role: role || "USER",
          },
        })
      );

      return response.data;
    } catch (err: any) {
      console.error("🔴 Login Error:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed. Please try again.";
      dispatch(loginFailure(message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ✅ REGISTER
  const register = async (name: string, email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      await authAPI.register({ name, email, password });
      return true;
    } catch (err: any) {
      console.error("Registration error:", err.response?.data || err.message);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Registration failed. Please check if this email is already registered.";
      dispatch(loginFailure(message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ✅ LOGOUT
  const logoutUser = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    dispatch(logout());
  };

  // ✅ AUTO-RESTORE SESSION (on page reload)
  const restoreSession = () => {
    const storedToken = localStorage.getItem("authToken");
    const storedEmail = localStorage.getItem("userEmail");
    const storedName = localStorage.getItem("userName");
    const storedRole = localStorage.getItem("userRole") || "USER";

    if (storedToken && storedEmail && storedName) {
      dispatch(
        loginSuccess({
          token: storedToken,
          user: {
            name: storedName,
            email: storedEmail,
            role: storedRole,
          },
        })
      );
    }
  };

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout: logoutUser,
    restoreSession,
  };
};
