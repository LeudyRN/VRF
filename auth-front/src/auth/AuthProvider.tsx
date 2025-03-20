import { useContext, createContext, useState, useEffect } from "react";

const API_URL = "http://localhost:3100/api";

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: () => Promise<string | null>;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(localStorage.getItem("refreshToken"));

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }

    if (refreshTokenValue) {
      localStorage.setItem("refreshToken", refreshTokenValue);
    } else {
      localStorage.removeItem("refreshToken");
    }
  }, [accessToken, refreshTokenValue]);

  // Método para refrescar el accessToken
  const refreshToken = async (): Promise<string | null> => {
    if (!refreshTokenValue) return null;

    try {
      const response = await fetch(`${API_URL}/refreshToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) throw new Error("Error al refrescar el token");

      const data = await response.json();
      setAccessToken(data.accessToken);
      setRefreshTokenValue(data.refreshToken); // Almacenar el nuevo refreshToken

      return data.accessToken;
    } catch (error) {
      console.error("Error refrescando el token:", error);
      logout();
      return null;
    }
  };

  const login = (newAccessToken: string, newRefreshToken: string) => {
    setAccessToken(newAccessToken);
    setRefreshTokenValue(newRefreshToken);
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshTokenValue(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!accessToken, accessToken, refreshToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
