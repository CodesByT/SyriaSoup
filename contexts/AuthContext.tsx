"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { User } from "../types";
import { login, register } from "../utils/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginUser: (phone: string, password: string) => Promise<void>;
  registerUser: (
    username: string,
    phone: string,
    password: string
  ) => Promise<void>;
  forgotPassword: (phone: string) => Promise<void>;
  resetPassword: (
    phone: string,
    otp: string,
    newPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        // console.error("AuthProvider: Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const loginUser = async (phone: string, password: string) => {
    try {
      const response = await login(phone, password);
      const { jwt, ...userData } = response.data;
      await AsyncStorage.setItem("token", jwt);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || t("loginFailed"));
    }
  };

  const registerUser = async (
    username: string,
    phone: string,
    password: string
  ) => {
    try {
      const response = await register(username, phone, password);
      const { jwt, ...userData } = response.data;
      await AsyncStorage.setItem("token", jwt);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || t("registrationFailed"));
    }
  };

  const forgotPassword = async (phone: string) => {
    try {
      await axios.post("/api/auth/forgotPassword", { phone });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || t("failedToSendOTP"));
    }
  };

  const resetPassword = async (
    phone: string,
    otp: string,
    newPassword: string
  ) => {
    try {
      await axios.post("/api/auth/resetPassword", { phone, otp, newPassword });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || t("failedToResetPassword")
      );
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      // console.error("AuthProvider: Error logging out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loginUser,
        registerUser,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
