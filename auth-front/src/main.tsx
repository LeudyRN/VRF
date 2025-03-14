import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./rutas/Login.tsx";
import Dashboard from "./rutas/Dashboard.tsx";
import Sing from "./rutas/Sing.tsx";
import RegisterCreditCard from "./rutas/RegisterCreditCard.tsx";
import ProtectedRoute from "./rutas/ProtectedRoute.tsx";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import EmailConfirmation from "./rutas/email-confirmation.tsx";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/sing",
    element: <Sing />,
  },
  {
    path: "/email-confirmation",
    element: <EmailConfirmation />
  },
  {
    path: "/register-card",
    element: <RegisterCreditCard/>,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
