import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; // Reemplazamos <a> por <Link>
import { useAuth } from "../auth/AuthProvider";

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
  const { refreshToken } = useAuth();

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      console.error("Error al verificar la expiración del token:", error);
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      console.log("Token no encontrado o expirado. Redirigiendo al login...");
      goTo("/login"); // Redirigir al login si el token no está presente o ha expirado
    }
  }, [goTo]);

  const fetchFiles = async (page: number): Promise<void> => {
    setLoading(true); // Mostrar estado de carga
    try {
      let token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        console.log("Token expirado. Intentando renovarlo...");
        const newToken = await refreshToken(); // Llama a la lógica de renovación
        if (!newToken) {
          throw new Error("No autorizado. Redirigiendo al login...");
        }
        token = newToken;
      }

      const response = await fetch(`http://localhost:3100/api/files?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.files);
      setTotalPages(Math.ceil(data.total / data.limit));
      setCurrentPage(data.page);
    } catch (error) {
      console.error("Error al cargar archivos:", error);
      goTo("/login");
    } finally {
      setLoading(false); // Siempre oculta el estado de carga
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
      console.log("Redirigiendo al login...");
      goTo("/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      alert("Hubo un problema cerrando sesión. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <div className="d-flex flex-column" style={{ height: "100vh", margin: 0, padding: 0 }}>
    <h1 className="container" style={{ margin: 0, padding: "10px" }}>Dashboard</h1>

    <section
      className="d-flex flex-column"
      style={{
        flexGrow: 1,
        padding: "20px",
        margin: 0,
        overflowY: "auto", // Scroll solo dentro del contenido dinámico
      }}
    >
      <h2 className="h5 mb-5 text-center">Archivos Recientes</h2>
      {loading ? (
        <p className="text-center">Cargando archivos...</p>
      ) : (
        <div>
          <div
            className="list-group"
            style={{
             // Limita la altura máxima
              overflowY: "auto", // Scroll dentro de la lista si excede la altura
            }}
          >
            {files.map((file, index) => (
              <div
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>📄 {file.name}</span>
                <small className="text-muted">{file.date}</small>
              </div>
            ))}
          </div>
          <div className="d-flex flex-column align-items-center mt-4">
            <div className="d-flex justify-content-between w-50 mb-4">
              <button
                className="btn my-custom-blue"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Página Anterior
              </button>
              <button
                className="btn my-custom-blue"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Página Siguiente
              </button>
            </div>
            <span style={{ marginTop: "10px" }}>Página {currentPage} de {totalPages}</span>
          </div>
        </div>
      )}
    </section>
  </div>
  );

}