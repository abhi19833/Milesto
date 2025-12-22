import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useTeam } from "./TeamContext";
import api from "../api/axiosInstance";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside  AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { triggerRefresh } = useTeam();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const res = await api.get("/auth/verify");
      setUser(res.data.user);
    } catch (err) {
      console.error("Token verification failed:", err);
      Cookies.remove("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;
      Cookies.set("token", token, { expires: 7 });
      setUser(user);

      toast.success("Login successful!");
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData, invitationToken) => {
    try {
      const res = await api.post("/auth/register", {
        ...userData,
        invitationToken,
      });

      const { token, user } = res.data;
      Cookies.set("token", token, { expires: 7 });
      setUser(user);

      toast.success("Registration successful!");
      if (invitationToken) triggerRefresh();

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    toast.success("Logged out successfully");
  };

  const value = { user, login, register, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
