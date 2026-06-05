"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  token: string;
  profilePic?: string;
  followerCount?: number;
  followingCount?: number;
  role?: string;
  status?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bl_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem("bl_user", JSON.stringify(u));
    localStorage.setItem("bl_token", u.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bl_user");
    localStorage.removeItem("bl_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);