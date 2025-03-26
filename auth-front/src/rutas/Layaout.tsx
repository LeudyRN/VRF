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
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Botón para mostrar/ocultar menú en pantallas pequeñas */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="btn btn-primary btn-sm position-absolute m-3"
        style={{
          zIndex: 1000,
          left: menuOpen ? "20vh" : "2vh",
          top: "2vh",
          transition: "left 0.3s ease-in-out",
        }}
      >
        {menuOpen ? "X" : "≡"}
     </button>


     <div
        className={`bg-dark text-white p-4 position-fixed d-flex flex-column transition ${
          menuOpen ? "menu-visible" : "menu-hidden"
        }`}
        style={{
          width: "20vh",
          height: "100vh",
          overflowY: "auto",
          left: menuOpen ? "0" : "-20vh",
          transition: "left 0.3s ease-in-out",
        //  fontWeight: "bold",
          fontSize: "1.2vh",
        }}
      >
        <ul className="list-unstyled" style={{ marginTop: "8vh" }}>
          {menuItems.map((item, index) => (
            <li
              key={index}
              style={{
                marginBottom: item.name === "Dashboard" ? "1vh" : "1vh",
                borderBottom: item.name === "Dashboard" ? "4px solid #0d6efd" : "none",
              }}

              className={item.name === "Dashboard" ? "dashboard-item py-4" : "menu-item py-2"}
            >
              <Link
                to={item.path}
                className={`text-decoration-none px-3 py-2 d-block ${
                  location.pathname === item.path ? "bg-primary text-white" : "text-white"
                }`}
                style={{ borderRadius: "2vh" }}
              >
                {item.name}
              </Link>
            </li>
          ))}
          <li
            className="py-4"
            style={{
              borderTop: "4px solid #0d6efd", // Línea divisoria encima de Cerrar sesión
              paddingTop: "1vh",
            }}
          >
            <button
              onClick={handleLogout}
              className="text-decoration-none px-3 py-2 d-block text-white btn btn-link"
              style={{
                borderRadius: "2vh",
              //  fontWeight: "bold",
                fontSize: "1.2vh",
              }}
            >
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>

      {/* Contenido principal */}
      <div
        className="flex-grow-1 p-4 bg-light"
        style={{
          marginLeft: menuOpen ? "20vh" : "0",
          transition: "margin-left 0.3s",
          width: "100%",
        }}
      >
        {/* Header con menú de perfil alineado a la derecha */}
        <header className="d-flex justify-content-between align-items-center mb-4 position-relative">
          <div className="position-absolute" style={{ right: "3vh", top: "2vh", }}>
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
          </div>
        </header>

        {/* Renderiza las subrutas */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
