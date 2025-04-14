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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!accessToken);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

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
      if (accessToken && !isTokenExpired(accessToken)) {
        console.log("Access token válido. Usuario autenticado.");
        setIsAuthenticated(true);
      } else if (refreshTokenValue) {
        console.log("Intentando renovar token al inicializar...");
        const newToken = await refreshToken();
        if (newToken) {
          console.log("Token renovado exitosamente:", newToken);
          setIsAuthenticated(true);
        } else {
          console.log("No se pudo renovar el token. Cerrando sesión...");
          logout();
        }
      } else {
        console.log("Sin tokens válidos. Cerrando sesión...");
        logout();
      }
      setAuthChecking(false);
    };

    verifyAuth();
  }, []);

  // Verificar si el token ha expirado
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      console.error("Error al verificar la expiración del token:", error);
      return true;
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    if (!refreshTokenValue) {
      console.error("No se encontró refreshToken en el cliente. Cerrando sesión...");
      logout(); // Cierra sesión si no hay refreshToken
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/refreshToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
        credentials: "include",
      });

      // Manejo de errores de respuesta
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error("Refresh token inválido o expirado. Cerrando sesión...");
          logout(); // Cierra la sesión si el token no es válido
        }
        throw new Error(`Error al renovar token: ${response.status} - ${response.statusText}`);
      }

      // Procesar respuesta exitosa
      const data = await response.json();

      // Actualizar los tokens en el estado y almacenamiento
      setAccessToken(data.accessToken);
      setRefreshTokenValue(data.refreshToken);
      localStorage.setItem("token", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);

      console.log("Nuevo accessToken obtenido:", data.accessToken);
      return data.accessToken;
    } catch (error) {
      console.error("Error al renovar el token:", error || error);
      logout();
      return null;
    }
  };

  // Iniciar sesión
  const login = (newAccessToken: string, newRefreshToken: string) => {
    setAccessToken(newAccessToken);
    setRefreshTokenValue(newRefreshToken);
    localStorage.setItem("token", newAccessToken); // Guardar en localStorage
    sessionStorage.setItem("refreshToken", newRefreshToken); // Guardar en sessionStorage
    setIsAuthenticated(true); // Actualiza inmediatamente el estado de autenticación
    console.log("Inicio de sesión completado. Usuario autenticado.");
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
      {!authChecking ? children : <p>Verificando autenticación...</p>}
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