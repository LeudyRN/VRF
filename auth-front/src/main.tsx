import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { DashboardPage } from "./vrf/pages/DashboardPage";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />

    <DashboardPage />

  </React.StrictMode>
);
