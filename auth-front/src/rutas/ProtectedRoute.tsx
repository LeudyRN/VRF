import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute() {
  const { isAuthenticated, refreshToken, accessToken } = useAuth();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true); // Estado de carga para verificar autenticación

  // Verificar autenticación y renovar token si es necesario
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !accessToken) {
        console.log("Intentando renovar token en ProtectedRoute...");
        const newToken = await refreshToken();
        if (newToken) {
          console.log("Token renovado exitosamente en ProtectedRoute.");
        } else {
          console.log("No se pudo renovar el token. Redirigiendo al login...");
        }
      }
      setCheckingAuth(false); // Finaliza verificación
    };

    verifyAuth();
  }, [isAuthenticated, accessToken]);

  // Mostrar indicador de carga mientras se verifica autenticación
  if (checkingAuth) {
    return <p>Cargando...</p>; // Spinner u otro indicador visual
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