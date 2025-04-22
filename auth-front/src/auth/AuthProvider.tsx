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
    const storedToken = sessionStorage.getItem("refreshToken");

    if (!storedToken) {
      console.warn("⚠️ No hay refreshToken en sessionStorage. Cerrando sesión...");
      setRefreshTokenValue(null);
      logout();
      return null;
    }

    console.log("🚀 Intentando renovar token con refreshToken:", storedToken);

    try {
      const response = await fetch(`${API_URL}/refreshToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedToken }),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error("❌ Refresh token inválido o expirado. Eliminándolo y cerrando sesión...");

          sessionStorage.removeItem("refreshToken");
          setRefreshTokenValue(null);
          logout();
          return null;
        }

        throw new Error(`Error al renovar token: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      // 🔥 Asegurar que el nuevo `refreshToken` se guarda correctamente
      setRefreshTokenValue(data.refreshToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("accessToken", data.accessToken);
      setAccessToken(data.accessToken);

      console.log("✅ Nuevo accessToken y refreshToken guardados correctamente.");

      // 🔥 Verificar inmediatamente después si `sessionStorage` tiene el nuevo `refreshToken`
      console.log("📌 Refresh token en sessionStorage después de renovación:", sessionStorage.getItem("refreshToken"));

      return data.accessToken;
    } catch (error) {
      console.error("❌ Error al renovar el token:", error);
      return null;
    }
  };

  // Iniciar sesión
  const login = (newAccessToken: string, newRefreshToken: string) => {
    if (!newAccessToken || !newRefreshToken) {
      console.error("❌ Error: AccessToken o RefreshToken no proporcionados.");
      return;
    }

    console.log("🚀 Iniciando sesión con tokens recibidos:", { newAccessToken, newRefreshToken });

    setAccessToken(newAccessToken);
    setRefreshTokenValue(newRefreshToken);

    try {
      // 🔥 Extraer usuarioId desde el JWT (accessToken)
      const [, payloadBase64] = newAccessToken.split(".");
      if (!payloadBase64) throw new Error("Formato de token inválido.");

      const payload = JSON.parse(atob(payloadBase64)); // Decodificar el payload

      if (payload?.id) {
        localStorage.setItem("usuarioId", payload.id.toString());
        console.log("✅ Usuario ID extraído y guardado:", payload.id);
      } else {
        console.warn("⚠️ usuarioId no está presente en el token. Puede haber un problema en el backend.");
      }
    } catch (error) {
      console.error("❌ Error al obtener usuarioId desde el token:", error);
    }

    try {
      // 🔥 Guardar tokens en localStorage y sessionStorage con verificaciones
      localStorage.setItem("accessToken", newAccessToken);

      if (newRefreshToken) {
        sessionStorage.setItem("refreshToken", newRefreshToken);
        console.log("✅ RefreshToken guardado correctamente.");
      } else {
        console.warn("⚠️ No se proporcionó un RefreshToken válido.");
      }

      console.log("📌 Refresh token en sessionStorage después de guardarlo:", sessionStorage.getItem("refreshToken"));
    } catch (error) {
      console.error("❌ Error al guardar tokens en almacenamiento:", error);
    }

    setIsAuthenticated(true);
    console.log("✅ Inicio de sesión completado.");
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      const usuarioId = localStorage.getItem("usuarioId"); // 🔥 Obtiene el usuarioId almacenado

      if (usuarioId) {
        console.log("🚪 Enviando solicitud de cierre de sesión al backend...");

        const response = await fetch(`${API_URL}/singout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: usuarioId }),
        });

        if (!response.ok) {
          console.error(`❌ Error al cerrar sesión en el backend: ${response.status} - ${response.statusText}`);
          return; // 🔥 Evitamos limpiar el frontend si hay un error en el backend
        }

        const data = await response.json();
        console.log("✅ Sesión cerrada correctamente en el backend:", data.message);
      }

      // 🔥 Eliminamos el `refreshToken` localmente después de confirmar el cierre en el backend
      sessionStorage.removeItem("refreshToken");
      console.log("🔄 Eliminado refreshToken antes de cerrar sesión.");

      // 🔥 Limpieza final de los tokens y autenticación local
      setAccessToken(null);
      setRefreshTokenValue(null);
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("usuarioId");

      console.log("✅ Sesión cerrada correctamente en el frontend.");
    } catch (error) {
      console.error("❌ Error al procesar la solicitud de cierre de sesión:", error);
    }
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