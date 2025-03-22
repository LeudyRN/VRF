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
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(sessionStorage.getItem("refreshToken"));

  // Sincronizar tokens en almacenamiento persistente
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }

    if (refreshTokenValue) {
      sessionStorage.setItem("refreshToken", refreshTokenValue);
    } else {
      sessionStorage.removeItem("refreshToken");
    }
  }, [accessToken, refreshTokenValue]);

  // Renovar el token de acceso
  const refreshToken = async (): Promise<string | null> => {
    if (!refreshTokenValue) {
      logout(); // Salir si no hay refreshToken
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/refreshToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
        credentials: "include", // Si usas cookies httpOnly
      });

      if (!response.ok) throw new Error("No se pudo refrescar el token");

      const data = await response.json();
      setAccessToken(data.accessToken);
      setRefreshTokenValue(data.refreshToken);

      return data.accessToken;
    } catch (error) {
      console.error("Error al refrescar el token:", error);
      logout();
      return null;
    }
  };

  // Iniciar sesión
  const login = (newAccessToken: string, newRefreshToken: string) => {
    setAccessToken(newAccessToken);
    setRefreshTokenValue(newRefreshToken);
  };

  // Cerrar sesión
  const logout = () => {
    setAccessToken(null);
    setRefreshTokenValue(null);
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    // Aquí puedes redirigir al usuario o manejar estados adicionales
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!accessToken, accessToken, refreshToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar la autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};