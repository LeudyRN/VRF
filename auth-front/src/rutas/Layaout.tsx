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
    { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
    { name: "Unidad Interior", path: "/dashboard/unidad-interior", icon: "bi-building" },
    { name: "Unidad Exterior", path: "/dashboard/unidad-exterior", icon: "bi-house-door" },
    { name: "Tubería", path: "/dashboard/tuberia", icon: "bi-tools" },
    { name: "Alambrado", path: "/dashboard/alambrado", icon: "bi-lightning" },
    { name: "Control Central", path: "/dashboard/control-central", icon: "bi-gear" },
    { name: "Reportes", path: "/dashboard/reportes", icon: "bi-file-earmark-text" },
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
              className={item.name === "Dashboard" ? "dashboard-item py-4 d-flex align-items-center" : "menu-item py-2 d-flex align-items-center"}
            >
              <Link
                to={item.path}
                className={`text-decoration-none px-3 py-2 d-block d-flex align-items-center ${location.pathname === item.path ? "active-item bg-primary text-white" : "text-white"}`}
                style={{
                  borderRadius: "3vh",
               //   height: "6vh",
                  display: "flex",
                  alignItems: "center",
                  transition: "background-color 0.3s ease, color 0.3s ease", // Transición suave
                }}
              >
                <i className={`${item.icon} me-2`} style={{ fontSize: "2vh" }}></i>
                {item.name}
              </Link>
            </li>
          ))}
          <li
            className="py-4 d-flex align-items-center"
            style={{
              borderTop: "4px solid #0d6efd",
              paddingTop: "1vh",
            }}
          >
            <button
              onClick={handleLogout}
              className="text-decoration-none px-3 py-2 d-block text-white btn btn-link d-flex align-items-center"
              style={{
                borderRadius: "2vh",
                fontSize: "1.2vh",
               // height: "6vh", // Tamaño uniforme
                display: "flex",
                alignItems: "center",
                transition: "background-color 0.3s ease, color 0.9s ease", // Transición suave
              }}
            >
              <i className="bi-box-arrow-right me-2" style={{ fontSize: "1.5rem" }}></i>
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
