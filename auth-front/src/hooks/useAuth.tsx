import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient";
import { UserProfile } from "../types/auth";

type AuthContextType = {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchMe(currentToken: string): Promise<UserProfile> {
  return apiFetch<UserProfile>("/auth/me", {}, currentToken);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const me = await fetchMe(token);
      setUser(me);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshMe();
  }, [token]);

  const login = async (jwt: string) => {
    setLoading(true);
    localStorage.setItem("token", jwt);
    setToken(jwt);

    try {
      const me = await fetchMe(jwt);
      setUser(me);
    } catch (error) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return <AuthContext.Provider value={{ token, user, loading, login, logout, refreshMe }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be inside AuthProvider");
  }

  return context;
}
