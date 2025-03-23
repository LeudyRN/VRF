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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!accessToken); // Estado de autenticación
  const [authChecking, setAuthChecking] = useState<boolean>(true); // Verificación inicial de autenticación

  // Sincronizar tokens con almacenamiento persistente
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

    setIsAuthenticated(!!accessToken);
  }, [accessToken, refreshTokenValue]);

  // Verificar y renovar token al inicializar el contexto
  useEffect(() => {
    const verifyAuth = async () => {
      if (!accessToken && refreshTokenValue) {
        try {
          console.log("Intentando renovar token al inicializar...");
          const newToken = await refreshToken();
          if (newToken) {
            console.log("Token renovado exitosamente:", newToken);
            setIsAuthenticated(true);
          } else {
            console.log("No se pudo renovar el token.");
          }
        } catch (error) {
          console.error("Error al verificar autenticación:", error);
          logout();
        }
      }
      setAuthChecking(false); // Finaliza la verificación inicial
    };

    verifyAuth();
  }, []); // Ejecutar solo al cargar

  // Renovar token
  const refreshToken = async (): Promise<string | null> => {
    if (!refreshTokenValue) {
      console.error("No se encontró refreshToken. Cerrando sesión...");
      logout();
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/refreshToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
        credentials: "include",
      });

      if (!response.ok) throw new Error(`Error al renovar token: ${response.status}`);

      const data = await response.json();
      setAccessToken(data.accessToken);
      setRefreshTokenValue(data.refreshToken);

      return data.accessToken;
    } catch (error) {
      console.error("Error al renovar el token:", error);
      logout();
      return null;
    }
  };

  // Iniciar sesión
  const login = (newAccessToken: string, newRefreshToken: string) => {
    setAccessToken(newAccessToken);
    setRefreshTokenValue(newRefreshToken);
    setIsAuthenticated(true);
  };

  // Cerrar sesión
  const logout = () => {
    setAccessToken(null);
    setRefreshTokenValue(null);
    setIsAuthenticated(false);
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    console.log("Sesión cerrada correctamente.");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        refreshToken,
        login,
        logout,
      }}
    >
      {!authChecking && children} {/* Solo renderizar después de verificar autenticación */}
    </AuthContext.Provider>
  );
}

// Hook para usar autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};