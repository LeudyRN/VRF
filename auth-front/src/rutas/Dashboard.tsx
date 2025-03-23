import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; // Reemplazamos <a> por <Link>
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Definimos el tipo para los archivos
interface File {
  name: string;
  date: string;
}

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [files, setFiles] = useState<File[]>([]); // Estado para los archivos
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const [totalPages, setTotalPages] = useState(0); // Total de páginas
  const [loading, setLoading] = useState(true); // Estado de carga
  const goTo = useNavigate();
  const location = useLocation(); // Obtener la ruta actual

  // Opciones del menú
  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Unidad interior", path: "/unidad-interior" }, // Indoor unit
    { name: "Unidad exterior", path: "/unidad-exterior" }, // Outdoor unit
    { name: "Tubería", path: "/tubería" }, // Piping
    { name: "Alambrado", path: "/alambrado" }, // Wiring
    { name: "Control central", path: "/control-central" }, // Central control
    { name: "Reportes", path: "/reportes" },
  ];

  // Función para obtener archivos del backend
  const fetchFiles = async (page: number): Promise<void> => {
    setLoading(true); // Mostrar estado de carga
    try {
      // Llamada a la API
      const response = await fetch(`http://localhost:3100/api/files?page=${page}&limit=10`);

      // Verifica si la respuesta del servidor es exitosa
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
      }

      // Intentar parsear el JSON de la respuesta
      const data = await response.json();

      // Validar estructura de datos del JSON esperado
      if (!data.files || !Array.isArray(data.files) || typeof data.total !== "number") {
        throw new Error("La respuesta del servidor tiene un formato inesperado");
      }

      // Actualizar estados
      setFiles(data.files); // Actualizamos archivos
      setTotalPages(Math.ceil(data.total / data.limit)); // Calculamos total de páginas
      setCurrentPage(data.page); // Actualizamos la página actual
    } catch (error: any) {
      // Muestra un mensaje de error más específico en consola
      console.error("Error al cargar archivos:", error.message || error);
    } finally {
      // Siempre oculta el estado de carga al final
      setLoading(false);
    }
  };

  // Efecto para cargar los datos iniciales y cuando cambie la página
  useEffect(() => {
    fetchFiles(currentPage);
  }, [currentPage]);

  // Funciones para manejo de paginación
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

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
      //alert("Sesión cerrada correctamente.");
      console.log("Redirigiendo al login...");
      goTo("/login");
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
        <div className="bg-dark text-white p-5" style={{ width: "250px" }}> {/* Fondo gris oscuro */}
          <ul className="list-unstyled">
            {menuItems.map((item, index) => (
              <li key={index} className="py-3">
                <Link
                  to={item.path} // Cambié <a href={}> por <Link to={}>
                  className={`text-decoration-none px-3 py-2 d-block ${
                    location.pathname === item.path ? "bg-primary text-white" : "text-white"
                  }`} // Clase activa
                  style={{
                    borderRadius: "4px",
                  }}
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
        style={{ transition: "margin-left 0.3s" }}
      >
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
              <li>
                <a className="dropdown-item" href="#">Mi cuenta</a>
              </li>
              <li>
                <a className="dropdown-item" href="#">Cambiar contraseña</a>
              </li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>Cerrar sesión</button>
              </li>
            </ul>
          </div>
        </header>

        {/* Archivos recientes con paginación */}
        <section>
          <h2 className="h5 mb-3">Archivos Recientes</h2>
          {loading ? (
            <p>Cargando archivos...</p>
          ) : (
            <div>
              <div className="list-group">
                {files.map((file, index) => (
                  <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>📄 {file.name}</span>
                    <small className="text-muted">{file.date}</small>
                  </div>
                ))}
              </div>
              <div className="d-flex flex-column align-items-center mt-5">
                <div className="d-flex justify-content-between w-50 mb-5">
                  <button
                    className="btn btn-secondary"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    Página Anterior
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Página Siguiente
                  </button>
                </div>
                <span className="mt-3">
                  Página {currentPage} de {totalPages}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}