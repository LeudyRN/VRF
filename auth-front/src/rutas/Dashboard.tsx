/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { API_URL } from "../auth/constants";
import { useProyecto } from "../rutas/ProyectoContext.tsx";

interface File {
  name: string;
  date: string;
}

interface Unidad {
  id: number;
  nombre: string;
  capacidad: number;
}

interface Proyecto {
  id: number;
  nombre: string;
  unidades: Unidad[];
  tuberias: string[];
  alambrado: string[];
  controlCentral: string[];
  reportes: { id: number; contenido: string }[];
  fechaCreacion: string; // ✅ Corrección: solo una fecha en lugar de un array
}

export default function Dashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const goTo = useNavigate();
  const { refreshToken } = useAuth();
  const usuarioId = Number(localStorage.getItem("usuarioId")) || null;
  const [searchTerm, setSearchTerm] = useState("");
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [proyectosGuardados, setProyectosGuardados] = useState<Proyecto[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nombreProyecto, setNombreProyecto] = useState("");
  const { proyectoActivo, setProyectoActivo } = useProyecto();
  const [showModal1, setShowModal1] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);

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
    const verificarSesion = async () => {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        console.log("⚠️ Token no encontrado o expirado. Intentando renovar...");

        const newToken = await refreshToken();
        if (!newToken) {
          console.log("❌ No se pudo renovar el token. Redirigiendo al login...");
          goTo("/login");
        } else {
          console.log("✅ Token renovado correctamente:", newToken);
          localStorage.setItem("token", newToken);
        }
      }
    };

    verificarSesion();
  }, [goTo]);

  const fetchFiles = async (page: number, search: string = "") => {
    setLoading(true);
    try {
      let token = localStorage.getItem("token");

      if (!token || isTokenExpired(token)) {
        const newToken = await refreshToken();
        if (!newToken) throw new Error("No autorizado.");
        token = newToken;
      }

      const usuarioId = localStorage.getItem("usuarioId");
      if (!usuarioId) throw new Error("usuarioId no está definido.");

      console.log("🚀 Solicitando datos a la API...");

      const response = await fetch(
        `${API_URL}/dashboard/Archivosrecientes?usuarioId=${usuarioId}&page=${page}&limit=10&search=${search}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();

      if (!data.proyectos || data.proyectos.length === 0) {
        console.warn("⚠️ No se encontraron proyectos.");
        setProyectosGuardados([]);

      } else {
        setProyectosGuardados(data.proyectos);
        console.log("✅ Estado actualizado con proyectos:", data.proyectos);
      }

      setTotalPages(Math.ceil(data.total / data.limit));
      setCurrentPage(data.page);
    } catch (error) {
      console.error("❌ Error al cargar proyectos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    //  console.log("🔄 Última revisión → Estado proyectosGuardados después de la actualización:", proyectosGuardados);
  }, [proyectosGuardados]);

  useEffect(() => {
    console.log("🚀 useEffect ejecutado! Buscando archivos...");
    console.log("Valor de proyectosGuardados antes del map:", proyectosGuardados);
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


  const abrirModalProyectos = async () => {
    console.log("🚀 Intentando abrir el modal...");
    setShowModal1(true);  // ✅ Activa el modal
    await listarProyectos();  // ✅ Carga los proyectos antes de abrirlo
  };

  useEffect(() => {
    console.log("🔍 Estado actual de showModal1:", showModal1);
  }, [showModal1]);

  const handleCloseModal = () => {
    setShowModal(false);
    setModalContent("");
  };

  const crearProyecto = async (nombreProyecto: string, usuarioId: number) => {
    if (!usuarioId) {
      console.error("❌ Error: usuarioId es obligatorio.");
      return;
    }

    const dataInicial: Proyecto = {
      id: Date.now(),
      nombre: nombreProyecto,
      unidades: [],
      tuberias: [],
      alambrado: [],
      controlCentral: [],
      reportes: [],
      fechaCreacion: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${API_URL}/dashboard/proyectos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuarioId, nombre: nombreProyecto, data: dataInicial }),
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("🚀 Respuesta del backend:", responseData);

      if (!responseData || !responseData.id || !responseData.nombre) {
        console.warn("⚠️ El backend no devolvió un proyecto válido.");
        return;
      }

      console.log(`✅ Proyecto "${responseData.nombre}" guardado en la base de datos`);

      // 🚀 Marcar el proyecto recién creado como activo
      setProyectoActivo(responseData);
      localStorage.setItem("proyectoActivo", JSON.stringify(responseData));
      console.log("✅ Proyecto activo actualizado:", responseData);

      handleOpenModal(`Proyecto "${responseData.nombre}" guardado`);
    } catch (error) {
      console.error("❌ Error al guardar el proyecto:", error);
    }
  };

  const abrirProyecto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (archivo) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const contenido = e.target?.result as string;
        const proyectoCargado = JSON.parse(contenido);

        // ✅ Si no tiene ID, asignarle uno
        if (!proyectoCargado.id) {
          proyectoCargado.id = Date.now();
        }

        setProyectoActivo(proyectoCargado);
        localStorage.setItem("proyectoActivo", JSON.stringify(proyectoCargado));

        console.log(`✅ Proyecto "${archivo.name}" cargado desde escritorio`);
      };
      reader.readAsText(archivo);
    }
  };

  const listarProyectos = async () => {
    const usuarioId = localStorage.getItem("usuarioId");

    if (!usuarioId) {
      console.error("❌ Error: usuarioId no está definido.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/dashboard/proyectos/${usuarioId}`);

      if (!response.ok) {
        throw new Error(`Error al obtener proyectos desde la DB: ${response.status}`);
      }

      const proyectos = await response.json();
      console.log("✅ Proyectos obtenidos:", proyectos);

      setProyectosGuardados(proyectos.length ? proyectos : []); // ✅ Aseguramos que se actualiza correctamente
    } catch (error) {
      console.error("❌ Error al listar proyectos:", error);
    }
  };

  // ✅ 4️⃣ Actualizar un proyecto y guardar cambios en JSON
  const actualizarProyecto = async (nuevaData: Proyecto) => {
    if (!proyecto) return;

    const jsonData = JSON.stringify(nuevaData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${nuevaData.nombre.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setProyecto(nuevaData);
    console.log("✅ Proyecto actualizado en JSON");
  };

  // ✅ Cargar proyectos guardados cuando se monte el componente
  useEffect(() => {
    listarProyectos();
  }, []);

  useEffect(() => {
    const storedProyecto = localStorage.getItem("proyectoActivo");
    console.log("📌 Proyecto en localStorage al iniciar:", storedProyecto);

    if (storedProyecto) {
      const parsedProyecto = JSON.parse(storedProyecto);
      setProyectoActivo(parsedProyecto);
      console.log("✅ Estado restaurado en ProyectoProvider:", parsedProyecto);
    }
  }, []);

  return (
    <div className="d-flex flex-column" style={{ height: "100vh", margin: 0, padding: 0, marginTop: "5vh", }}>
      <h1 className="container mt-5" style={{ margin: 0, padding: "1vh", marginTop: "5vh", fontWeight: "bold" }}>
        Dashboard
      </h1>
      <h4
          style={{
              marginTop: "2vh",
              padding: "1rem",
              fontSize: "1.8rem",
              fontWeight: "600", // ✅ Texto más definido
            }}
          >
            Proyecto en uso: {proyectoActivo ? proyectoActivo.nombre : "Ninguno"}
          </h4>


      {/* Cuadros de opciones directamente en el Dashboard */}
      <div
        className="d-flex justify-content-start align-items-stretch gap-4" // Cambié justify-content-center por justify-content-start
        style={{ margin: "3vh 0" }}
      >

        {/* Cuadro: Nuevo Proyecto */}
        <div className="border p-4 rounded shadow d-flex flex-column align-items-center" style={{
          width: "25vh",
          marginLeft: "1vh",
          height: "11vh",
          backgroundColor: "#f8f9fa",
        }}
        >
          <h3 style={{ color: "#0d6efd", fontWeight: "bold" }}>Nuevo Proyecto</h3>
          <button
            className="btn btn-primary w-100 mt-1"
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
            onClick={() => {
              setShowCreateModal(true); // ✅ Abre el modal

              // ✅ Obtener `usuarioId` desde `localStorage`
              const usuarioId = Number(localStorage.getItem("usuarioId"));

              if (!usuarioId || isNaN(usuarioId)) {
                console.error("❌ Error: usuarioId no está definido o no es válido.");
              } else {
                console.log("✅ Usuario ID obtenido correctamente:", usuarioId);
              }
            }}
          >
            Crear
          </button>
        </div>

        {/* Cuadro: Abrir Proyecto */}
        <div className="border p-4 rounded shadow d-flex flex-column align-items-center mb-3" style={{
          width: "25vh",
          height: "11vh",
          backgroundColor: "#f8f9fa",
        }}
        >
          <h3 style={{ color: "#0d6efd", fontWeight: "bold" }}>Abrir Proyecto</h3>
          <input
            type="file"
            accept=".json"
            style={{ display: "none" }}
            id="input-json"
            onChange={abrirProyecto} // ✅ Conecta la función de carga de JSON
          />
          <button
            className="btn btn-secondary w-100 mt-1"
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
            onClick={() => document.getElementById("input-json")?.click()} // ✅ Abre el explorador de archivos
          >
            Seleccionar
          </button>
        </div>

{/* Cuadro: Ver Mis Proyectos */}
<div className="border p-4 rounded shadow d-flex flex-column align-items-center" style={{
  maxWidth: "350px",
  width: "90%",
  minHeight: "100px",
  backgroundColor: "#f8f9fa",
}}>
  <h3 style={{ color: "#0d6efd", fontWeight: "bold", textAlign: "center" }}>Proyectos</h3>
  <button
    className="btn btn-primary w-100 mt-1"
    style={{
      borderRadius: "10px",
      backgroundColor: "#0d6efd",
      color: "#ffffff",
      padding: "10px",
      border: "none",
      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
      fontWeight: "bold",
      fontSize: "16px",
      transition: "all 0.3s ease-in-out",
      cursor: "pointer",
    }}
    onClick={abrirModalProyectos} // ✅ Ahora el botón abre el modal correctamente
  >
    Ver mis proyectos
  </button>
</div>

      </div>

      {/* Modal para crear un nuevo proyecto */}
      {showCreateModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}>
          <div className="bg-white p-4 rounded shadow" style={{ width: "35vh", textAlign: "center" }}>
            <h3 className="mb-4" style={{ color: "#0d6efd", fontWeight: "bold" }}>
              Crear Nuevo Proyecto
            </h3>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Nombre del proyecto"
              value={nombreProyecto}
              onChange={(e) => setNombreProyecto(e.target.value)}
            />
            <button className="btn btn-primary w-100 mb-2" onClick={() => {
              const usuarioId = Number(localStorage.getItem("usuarioId")); // ✅ Obtener `usuarioId`

              if (nombreProyecto.trim() && usuarioId) { // ✅ Validamos que `usuarioId` sea válido
                crearProyecto(nombreProyecto, usuarioId);
                setShowCreateModal(false);
              } else {
                console.error("❌ Error: usuarioId no está definido o no es válido.");
              }
            }}>
              Crear Proyecto
            </button>
            <button className="btn btn-secondary w-100" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Popup para funcionalidad */}
      {showModal && proyecto && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}>
          <div className="bg-white p-4 rounded shadow" style={{ width: "30vh", textAlign: "center" }}>
            <h3 className="mb-4" style={{ color: "#0d6efd", fontWeight: "bold" }}>
              Proyecto: {proyecto.nombre}
            </h3>
            <p>Tiene {proyecto.unidades.length} unidades, {proyecto.tuberias.length} tuberías y {proyecto.reportes.length} reportes.</p>
            <button className="btn btn-secondary w-100 mt-3" style={{ borderRadius: "8px" }} onClick={handleCloseModal}>
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


      {showModal1 && (
  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
    style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}>
    <div className="bg-white p-4 rounded shadow" style={{ maxWidth: "700px", width: "90vw", textAlign: "center" }}>
      <h3 className="mb-4" style={{ color: "#0d6efd", fontWeight: "bold" }}>
        Proyectos Guardados
      </h3>
      <div style={{ padding: "10px", maxHeight: "500px", overflowY: "auto" }}>
        {proyectosGuardados.length === 0 ? (
          <p className="text-center text-muted">No se encontraron proyectos.</p>
        ) : (
          <ul className="list-group">
            {proyectosGuardados.map((proyecto) => (
              <li
                key={proyecto.id}
                className={`list-group-item d-flex justify-content-between align-items-center ${proyectoSeleccionado?.id === proyecto.id ? "bg-info text-white" : ""}`}
                style={{ cursor: "pointer", transition: "all 0.3s ease-in-out", padding: "12px" }}
                onClick={() => setProyectoSeleccionado(proyecto)}  // ✅ Marcar el proyecto antes de confirmar
              >
                <span>{proyecto.nombre}</span>
                <small className="text-muted">{proyecto.fechaCreacion}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="d-flex justify-content-center gap-4 mt-4">
        <button
          className={`btn btn-primary w-50 ${!proyectoSeleccionado ? "btn-outline-primary" : ""}`}
          disabled={!proyectoSeleccionado}  // ✅ Solo se habilita si hay un proyecto seleccionado
          onClick={() => {
            if (proyectoSeleccionado) {
              setProyectoActivo(proyectoSeleccionado);
              localStorage.setItem("proyectoActivo", JSON.stringify(proyectoSeleccionado));
              setShowModal1(false);
              console.log("✅ Proyecto activado:", proyectoSeleccionado);
            }
          }}
        >
          Usar Proyecto
        </button>
        <button
          className="btn btn-secondary w-50"
          onClick={() => setShowModal1(false)}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

      <section className="d-flex flex-column align-items-center justify-content-center px-3 py-4" style={{ minHeight: "80px", overflowX: "auto" }}>
  {/* ✅ Título fijo */}
  <h2 className="h5 mb-3 text-start fw-bold w-100" style={{ position: "sticky", top: 0, padding: "10px", zIndex: 10 }}>
    Proyectos Recientes
  </h2>

  <div className="card shadow" style={{ width: "68vw", height: "400px", display: "flex", flexDirection: "column", left:"-220px" }}>
    <div className="card-body" style={{ flex: 1, overflowY: "auto" }}>  {/* ✅ Scroll solo en la lista */}
      {loading ? (
        <p className="text-center">Cargando proyectos...</p>
      ) : (
        <>
          <div className="list-group fs-5 text-dark" style={{ fontFamily: "Arial, sans-serif" }}>
            {proyectosGuardados.length === 0 ? (
              <p className="text-center text-muted">No se encontraron proyectos.</p>
            ) : (
              proyectosGuardados.map((proyecto, index) => (
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
                    <i className="bi-folder text-primary me-2" style={{ fontSize: "1.3rem" }}></i>
                    {proyecto.nombre}
                  </span>
                  <small className="text-muted">{proyecto.fechaCreacion}</small>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>

    {/* ✅ Botones fijos en la parte inferior */}
    <div className="d-flex flex-column align-items-center mt-4" style={{ position: "sticky", bottom: 0, backgroundColor: "#fff", padding: "10px", zIndex: 10 }}>
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
      <span className="text-muted fs-6">Página {currentPage} de {totalPages}</span>
    </div>
  </div>
</section>

    </div>
  );
}