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
import EmailConfirmationSuccess from "./rutas/EmailConfirmationSuccess.tsx";
import EmailConfirmationFailed from "./rutas/EmailConfirmationFailed.tsx";
import UnidadInterior from "./rutas/UnidadInterior.tsx";
import UnidadExterior from "./rutas/UnidadExterior.tsx";
import Tuberia from "./rutas/Tuberia.tsx";
import Alambrado from "./rutas/Alambrado.tsx";
import ControlCentral from "./rutas/ControlCentral.tsx";
import Reportes from "./rutas/Reportes.tsx";
import Layout from "./rutas/Layaout.tsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../src/rutas/custom.css";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  // Ruta de Registro (Signup)
  {
    path: "/sing",
    element: <Sing />,
  },
  // Ruta de confirmación de email
  {
    path: "/email-confirmation",
    element: <EmailConfirmation />,
  },
  // Rutas de éxito y fallo en la confirmación de email
  {
    path: "/email-confirmation-success",
    element: <EmailConfirmationSuccess />,
  },
  {
    path: "/email-confirmation-failed",
    element: <EmailConfirmationFailed />,
  },
  // Ruta de registro de tarjeta
  {
    path: "/register-card",
    element: <ProtectedRoute />,
    children: [
      {
        path: "",
        element: <RegisterCreditCard />,
      },
    ],
  },
  // Rutas protegidas bajo Dashboard
  {
    path: "/dashboard",
    element: <ProtectedRoute />, // Protege el Dashboard
    children: [
      {
        path: "",
        element: <Layout />, // Layout como contenedor principal
        children: [
          { path: "", element: <Dashboard /> }, // Página principal del Dashboard
          { path: "unidad-interior", element: <UnidadInterior /> },
          { path: "unidad-exterior", element: <UnidadExterior /> },
          { path: "tuberia", element: <Tuberia /> },
          { path: "alambrado", element: <Alambrado /> },
          { path: "control-central", element: <ControlCentral /> },
          { path: "reportes", element: <Reportes /> },
        ],
      },
    ],
  },
  // Ruta por defecto: redirige a Login si no coincide con ninguna ruta
  {
    path: "*",
    element: <Navigate to="/login" replace />,
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