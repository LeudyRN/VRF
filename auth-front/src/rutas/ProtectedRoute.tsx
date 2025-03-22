import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  // Verificar si el usuario está autenticado
  if (!auth.isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ message: "Por favor, inicia sesión primero.", from: location }}
      />
    );
  }

  return <Outlet />;
}