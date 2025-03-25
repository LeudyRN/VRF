import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Unidad Interior", path: "/dashboard/unidad-interior" },
    { name: "Unidad Exterior", path: "/dashboard/unidad-exterior" },
    { name: "Tubería", path: "/dashboard/tuberia" },
    { name: "Alambrado", path: "/dashboard/alambrado" },
    { name: "Control Central", path: "/dashboard/control-central" },
    { name: "Reportes", path: "/dashboard/reportes" },
  ];

  return (
    <div
      className="d-flex"
      style={{
        height: "100vh", // Asegura que el contenedor ocupe toda la pantalla
        overflow: "hidden", // Evita cualquier scroll externo
      }}
    >
      {/* Botón para ocultar/mostrar el menú */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="btn btn-primary btn-sm position-absolute m-3"
        style={{ zIndex: 1000 }}
      >
        {menuOpen ? "X" : "≡"}
      </button>

      {/* Menú lateral */}
      {menuOpen && (
        <div
          className="bg-dark text-white p-5"
          style={{
            width: "250px",
            height: "100%", // Ajusta la altura al padre (div principal)
            overflowY: "auto", // Permite scroll interno solo si es necesario
          }}
        >
          <ul className="list-unstyled">
            {menuItems.map((item, index) => (
              <li key={index} className="py-3">
                <Link
                  to={item.path}
                  className={`text-decoration-none px-3 py-2 d-block ${
                    location.pathname === item.path ? "bg-primary text-white" : "text-white"
                  }`}
                  style={{ borderRadius: "4px" }}
                >
                  {item.name}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <button
                onClick={handleLogout}
                className="text-decoration-none px-3 py-2 d-block text-white btn btn-link"
                style={{ borderRadius: "4px" }}
              >
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Contenido principal */}
      <div
        className={`flex-grow-1 p-4 bg-light ${menuOpen ? "ms-0" : "ms-5"}`}
        style={{
          transition: "margin-left 0.3s",
          overflowY: "auto", // Permite scroll interno para el contenido principal si es necesario
          height: "100%", // Ajusta la altura al padre
        }}
      >
        <header className="d-flex justify-content-between align-items-center mb-4">
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
              <li>
                <a className="dropdown-item" href="#">
                  Mi cuenta
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  Cambiar contraseña
                </a>
              </li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </div>
        </header>
        {/* Renderiza las subrutas */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;