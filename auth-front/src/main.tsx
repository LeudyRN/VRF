import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Login from "./rutas/Login.tsx";
import Dashboard from "./rutas/Dashboard.tsx";
import Sing from "./rutas/Sing.tsx";
import RegisterCreditCard from "./rutas/RegisterCreditCard.tsx";
import ProtectedRoute from "./rutas/ProtectedRoute.tsx";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import EmailConfirmation from "./rutas/email-confirmation.tsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";


const router = createBrowserRouter([
  // Ruta de Login
  {
    path: "/login",
    element: <Login />,
  },
  // Ruta de Registro (Sing)
  {
    path: "/sing",
    element: <Sing />,
  },
  // Ruta de confirmación de email
  {
    path: "/email-confirmation",
    element: <EmailConfirmation />,
  },
  // Ruta de registro de tarjeta
  {
    path: "/register-card",
    element: <RegisterCreditCard />,
  },
  // Rutas protegidas
  {
    path: "/",
    element: <ProtectedRoute />, // Este componente protege las rutas
    children: [
      {
        path: "dashboard",
        element: <Dashboard />, // Dashboard solo accesible con sesión activa
      },
    ],
  },
  // Redirigir cualquier ruta no encontrada al login
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
