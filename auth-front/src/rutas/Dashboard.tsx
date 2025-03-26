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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");

  const handleOpenModal = (content: string) => {
    setModalContent(content);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalContent("");
  };

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "100vh", margin: 0, padding: 0 }}
    >
      <h1
        className="container mt-5"
        style={{
          margin: 0,
          padding: "1vh",
          marginTop: "5vh",
          fontWeight: "bold",
        }}
      >
        Dashboard
      </h1>

      {/* Cuadros de opciones directamente en el Dashboard */}
      <div
          className="d-flex justify-content-start align-items-stretch gap-4" // Cambié justify-content-center por justify-content-start
          style={{ margin: "3vh 0" }}
        >

          {/* Cuadro: Nuevo Proyecto */}
          <div
            className="border p-4 rounded shadow d-flex flex-column align-items-center"
            style={{
              width: "25vh",
              marginLeft: "1vh",
              height: "11vh",
              backgroundColor: "#f8f9fa",
            }}
          >
            <h3 style={{ color: "#0d6efd", fontWeight: "bold" }}>Nuevo Proyecto</h3>
            <button className="btn btn-primary w-100 mt-1"
                style={{
                  borderRadius: "1vh",
                  backgroundColor: "#0d6efd",
                  color: "#ffffff",
                  padding: "1vh 1vh",
                  border: "none",
                  boxShadow: "0vh 0.4vh 0.6vh rgba(0, 0, 0, 0.1)",
                  fontWeight: "bold",
                  fontSize: "1vh",
                  transition: "all 0.3s ease-in-out",
                }}
                onClick={() => handleOpenModal("Nuevo Proyecto")}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = "scale(1.05)";
                  target.style.boxShadow = "0vh 0.6vh 1vh rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = "scale(1)";
                  target.style.boxShadow = "0vh 0.4vh 0.6vh rgba(0, 0, 0, 0.1)";
                }}
              >
                Crear
              </button>

          </div>

          {/* Cuadro: Abrir Proyecto */}
          <div
            className="border p-4 rounded shadow d-flex flex-column align-items-center mb-3"
            style={{
              width: "25vh",
              height: "11vh",
              backgroundColor: "#f8f9fa",
            }}
          >
            <h3 style={{ color: "#0d6efd", fontWeight: "bold" }}>Abrir Proyecto</h3>
            <button className="btn btn-secondary w-100 mt-1"
                style={{
                  borderRadius: "1vh",
                  backgroundColor: "#0d6efd",
                  color: "#ffffff",
                  padding: "1vh 1vh",
                  border: "none",
                  boxShadow: "0vh 0.4vh 0.6vh rgba(0, 0, 0, 0.1)",
                  fontWeight: "bold",
                  fontSize: "1vh",
                  transition: "all 0.3s ease-in-out",
                }}
                onClick={() => handleOpenModal("Abrir Proyecto")}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = "scale(1.05)";
                  target.style.boxShadow = "0vh 0.6vh 1vh rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = "scale(1)";
                  target.style.boxShadow = "0vh 0.4vh 0.6vh rgba(0, 0, 0, 0.1)";
                }}
              >
                Seleccionar
              </button>
          </div>

          <div
            className="border p-4 rounded shadow d-flex flex-column align-items-center"
            style={{
              width: "25vh",
              height: "11vh",
              backgroundColor: "#f8f9fa",
            }}
          >
            <h3 style={{ color: "#0d6efd", fontWeight: "bold" }}>Proyectos</h3>
            <button className="btn btn-primary w-100 mt-1"
              style={{
                borderRadius: "1vh",
                backgroundColor: "#0d6efd",
                color: "#ffffff",
                padding: "1vh 1vh",
                border: "none",
                boxShadow: "0vh 0.4vh 0.6vh rgba(0, 0, 0, 0.1)",
                fontWeight: "bold",
                fontSize: "1vh",
                transition: "all 0.3s ease-in-out",
              }}
              onClick={() => handleOpenModal("Proyectos")}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = "scale(1.05)";
                target.style.boxShadow = "0vh 0.6vh 1vh rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = "scale(1)";
                target.style.boxShadow = "0vh 0.4vh 0.6vh rgba(0, 0, 0, 0.1)";
              }}
            >
              Ver mis proyectos
            </button>
          </div>

        </div>

      {/* Modal Popup para funcionalidad */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1050,
          }}
        >
          <div
            className="bg-white p-4 rounded shadow"
            style={{
              width: "30vh",
              textAlign: "center",
            }}
          >
            <h3 className="mb-4" style={{ color: "#0d6efd", fontWeight: "bold" }}>
              {modalContent}
            </h3>
            <p>Funcionalidad para "{modalContent}"</p>
            <button
              className="btn btn-secondary w-100 mt-3"
              style={{
                borderRadius: "8px",
              }}
              onClick={handleCloseModal}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <section
        className="d-flex flex-column align-items-center justify-content-center"
        style={{
          padding: "2vh",
          margin: 0,
          overflowX: "auto",
          minHeight: "50vh",
        }}
       >
        <h2 className="h5 mb-3 text-start fw-bold w-100"
        style={{
          fontWeight: "bold",
        }}
        >Archivos Recientes</h2>
        {loading ? (
          <p className="text-center">Cargando archivos...</p>
        ) : (
          <div className="w-100 w-md-75"
          style={{
          //  fontWeight: "bold",
            marginLeft: "-1vh",
          }}

          >
            <div className="list-group">
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
            <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
              <button
                className="btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                style={{
                  backgroundColor: currentPage === 1 ? "#d6d6d6" : "#0d6efd",
                  color: currentPage === 1 ? "#a1a1a1" : "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: currentPage === 1 ? "none" : "0px 4px 6px rgba(0, 0, 0, 0.1)",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontSize: "16px",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  if (currentPage !== 1) {
                    target.style.transform = "scale(1.05)";
                    target.style.boxShadow = "0px 6px 10px rgba(0, 0, 0, 0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  if (currentPage !== 1) {
                    target.style.transform = "scale(1)";
                    target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
                  }
                }}
              >
                Página Anterior
              </button>
              <button
                className="btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                style={{
                  backgroundColor: currentPage === totalPages ? "#d6d6d6" : "#0d6efd",
                  color: currentPage === totalPages ? "#a1a1a1" : "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: currentPage === totalPages ? "none" : "0px 4px 6px rgba(0, 0, 0, 0.1)",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontSize: "16px",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement; // Conversión explícita
                  if (currentPage !== totalPages) {
                    target.style.transform = "scale(1.05)";
                    target.style.boxShadow = "0px 6px 10px rgba(0, 0, 0, 0.2)";
                  }
                }}

                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement; // Conversión explícita
                  if (currentPage !== totalPages) {
                    target.style.transform = "scale(1)";
                    target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
                  }
                }}

              >
                Página Siguiente
              </button>
              </div>
             <span style={{ marginTop: "1vh", fontSize: "14px", color: "#6c757d" }}>
              Página {currentPage} de {totalPages}
            </span>
           </div>
          </div>
        )}
      </section>
    </div>

  );

}