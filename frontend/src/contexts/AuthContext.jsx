import { createContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../services/authService";
import { connectSocket, disconnectSocket } from "../services/socketService";

export const AuthContext = createContext(null);

const getDashboardPath = (role) => {
  if (role === "admin") return "/admin";
  if (role === "developer") return "/developer";
  return "/tester";
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("testflow_token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("testflow_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(Boolean(token && !user));

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        setUser(response.user);
        localStorage.setItem("testflow_user", JSON.stringify(response.user));
      } catch (_error) {
        localStorage.removeItem("testflow_token");
        localStorage.removeItem("testflow_user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket(token);
    return () => {
      if (socket) {
        socket.off();
      }
    };
  }, [token]);

  const persistAuth = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem("testflow_token", payload.token);
    localStorage.setItem("testflow_user", JSON.stringify(payload.user));
  };

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    persistAuth(response);
    return getDashboardPath(response.user.role);
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    persistAuth(response);
    return getDashboardPath(response.user.role);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (_error) {
      // Ignore logout network failures and clear local session regardless.
    }

    disconnectSocket();
    localStorage.removeItem("testflow_token");
    localStorage.removeItem("testflow_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token),
        login,
        register,
        logout,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
