/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Login from "./rutas/Login.tsx";
import Dashboard from "./rutas/Dashboard.tsx";
import Sing from "./rutas/Sing.tsx";
import RegisterCreditCard from "./rutas/RegisterCreditCard.tsx";
import ProtectedRoute from "./rutas/ProtectedRoute.tsx";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import { ProyectoProvider } from "./rutas/ProyectoContext.tsx";

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

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../src/rutas/custom.css";

function App() {
  return (
    <ProyectoProvider>
      <AuthProvider>
        <ToastContainer />
        <RouterProvider router={router} />
      </AuthProvider>
    </ProyectoProvider>
  );
}

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/sing", element: <Sing /> },
  { path: "/email-confirmation", element: <EmailConfirmation /> },
  { path: "/email-confirmation-success", element: <EmailConfirmationSuccess /> },
  { path: "/email-confirmation-failed", element: <EmailConfirmationFailed /> },
  { path: "/register-card", element: <ProtectedRoute />, children: [{ path: "", element: <RegisterCreditCard /> }] },
  {
    path: "/dashboard",
    element: <ProtectedRoute />,
    children: [
      {
        path: "",
        element: <Layout />,
        children: [
          { path: "", element: <Dashboard /> },
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
  { path: "*", element: <Navigate to="/login" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ProyectoProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ProyectoProvider>
  </React.StrictMode>
);