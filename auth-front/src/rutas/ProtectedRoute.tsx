import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute() {
  const { isAuthenticated, refreshToken, accessToken } = useAuth();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verificar autenticación y renovar token si es necesario
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (!isAuthenticated || !accessToken) {
          console.log("Intentando renovar token en ProtectedRoute...");
          const newToken = await refreshToken();
          if (newToken) {
            console.log("Token renovado exitosamente en ProtectedRoute.");
          } else {
            console.log("No se pudo renovar el token. Redirigiendo al login...");
            setCheckingAuth(false); // Finaliza la verificación
            return;
          }
        }
      } catch (error) {
        console.error("Error durante la verificación de autenticación:", error);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, accessToken, refreshToken]);

  // Mostrar indicador de carga mientras se verifica autenticación
  if (checkingAuth) {
    return <p>Cargando...</p>; // Spinner o mensaje de carga
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    console.log("Usuario no autenticado. Redirigiendo al login.");
    return (
      <Navigate
        to="/login"
        state={{ message: "Por favor, inicia sesión para continuar.", from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}