import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

interface File {
  name: string;
  date: string;
}

export default function Dashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const goTo = useNavigate();
  const { refreshToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

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
      goTo("/login");
    }
  }, [goTo]);

  const fetchFiles = async (page: number, search: string = ""): Promise<void> => {
    setLoading(true);
    try {
      let token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        console.log("Token expirado. Intentando renovarlo...");
        const newToken = await refreshToken();
        if (!newToken) {
          throw new Error("No autorizado. Redirigiendo al login...");
        }
        token = newToken;
      }

      const response = await fetch(`http://localhost:3100/api/files?page=${page}&limit=10&search=${search}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log("Respuesta de la API:", data); // Agregado para depuración
      setFiles(data.files);
      setTotalPages(Math.ceil(data.total / data.limit));
      setCurrentPage(data.page);
    } catch (error) {
      console.error("Error al cargar archivos:", error);
      goTo("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Buscando archivos con:", searchTerm); // Agregado para depuración
    fetchFiles(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

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
    <div className="d-flex flex-column" style={{ height: "100vh", margin: 0, padding: 0, marginTop: "5vh", }}>
      <h1 className="container mt-5" style={{ margin: 0, padding: "1vh", marginTop: "5vh", fontWeight: "bold" }}>
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

      <div className="container ">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar archivos..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <section className="d-flex flex-column align-items-center justify-content-center px-3 py-4" style={{ minHeight: "50vh", overflowX: "auto" }}>
        <h2 className="h5 mb-3 text-start fw-bold w-100">Archivos Recientes</h2>
        <div className="card w-100 w-md-75 shadow">
          <div className="card-body">
            {loading ? (
              <p className="text-center">Cargando archivos...</p>
            ) : (
              <>
                <div className="list-group fs-5 text-dark" style={{ fontFamily: "Arial, sans-serif" }}>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="list-group-item d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light transition"
                      style={{ transition: "all 0.3s ease-in-out" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                        e.currentTarget.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <span>
                        <i className="bi-file-earmark text-primary me-2" style={{ fontSize: "1.3rem" }}></i>
                        {file.name}
                      </span>
                      <small className="text-muted">{file.date}</small>
                    </div>
                  ))}
                </div>
                <div className="d-flex flex-column align-items-center mt-4">
                  <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
                    <button
                      className="btn btn-primary px-3 py-2 rounded"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                    >
                      Página Anterior
                    </button>
                    <button
                      className="btn btn-primary px-3 py-2 rounded"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                    >
                      Página Siguiente
                    </button>
                  </div>
                  <span className="text-muted fs-6 ">Página {currentPage} de {totalPages}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}