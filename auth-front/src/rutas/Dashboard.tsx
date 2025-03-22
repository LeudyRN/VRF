import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Cambiamos a useNavigate
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(true);
  const goTo = useNavigate();
  const recentFiles = [
    { name: "Informe_2025.docx", date: "16/03/2025" },
    { name: "Propuesta_Final.docx", date: "15/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },
    { name: "Plan_Estrategico.docx", date: "14/03/2025" },

  ];

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:3100/api/singout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error cerrando sesión");
      }

      localStorage.removeItem("token");
      alert("Sesión cerrada correctamente.");
      console.log("Redirigiendo al login...");
      goTo("/login")
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      alert("Hubo un problema cerrando sesión. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <div className="d-flex vh-100">
      {/* Botón del menú lateral */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="btn btn-primary btn-sm position-absolute m-3"
        style={{ zIndex: 1000 }}
      >
        {menuOpen ? "X" : "≡"}
      </button>

      {/* Menú lateral */}
      {menuOpen && (
        <div className="bg-primary text-white p-5" style={{ width: "250px" }}>
          <ul className="list-unstyled">
            <li className="py-5"><a href="#" className="text-white text-decoration-none">Dashboard</a></li>
            <li className="py-3"><a href="#" className="text-white text-decoration-none">Indoor unit</a></li>
            <li className="py-3"><a href="#" className="text-white text-decoration-none">Outdoor unit</a></li>
            <li className="py-3"><a href="#" className="text-white text-decoration-none">Piping</a></li>
            <li className="py-3"><a href="#" className="text-white text-decoration-none">Wiring</a></li>
            <li className="py-3"><a href="#" className="text-white text-decoration-none">Central control</a></li>
            <li className="py-3"><a href="#" className="text-white text-decoration-none">Reportes</a></li>
            <li className="py-3"><a href="#" className="text-white text-decoration-none" onClick={handleLogout}>Cerrar sesión</a></li>
          </ul>
        </div>
      )}

      {/* Contenido principal */}
      <div className={`flex-grow-1 p-4 bg-light ${menuOpen ? "ms-0" : "ms-5"}`} style={{ transition: "margin-left 0.3s" }}>
        <header className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3">Dashboard</h1>
          <div className="dropdown">
            <button
              className="btn btn-secondary dropdown-toggle"
              type="button"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              👤
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <li><a className="dropdown-item" href="#">Mi cuenta</a></li>
              <li><a className="dropdown-item" href="#">Cambiar contraseña</a></li>
              <li><button className="dropdown-item" onClick={handleLogout}>Cerrar sesión</button></li>
            </ul>
          </div>
        </header>

        {/* Archivos recientes */}
        <section>
          <h2 className="h5 mb-3">Archivos Recientes</h2>
          <div className="list-group">
            {recentFiles.map((file, index) => (
              <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <span>📄 {file.name}</span>
                <small className="text-muted">{file.date}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
