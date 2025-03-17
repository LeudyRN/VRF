import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <>
      {/* Barra de navegación */}
      <header className="bg-dark text-white">
        <nav className="navbar navbar-expand-lg navbar-dark container">
          <Link to="/login" className="navbar-brand fw-bold">
            <i className="bi bi-house-door-fill me-2"></i> VRF
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link to="/login" className="nav-link text-light">
                  <i className="bi bi-house-fill me-2"></i> Home
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Sing" className="nav-link text-light">
                  <i className="bi bi-person-plus-fill me-2"></i> Regístrate
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Contenido principal */}
      <main className="container my-4">{children}</main>
    </>
  );
}
