/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { API_URL } from "../auth/constants";
import { useProyecto } from "../rutas/ProyectoContext.tsx";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Estilo necesario para las notificaciones

interface File {
  name: string;
  date: string;
}

interface Unidad {
  id: number;
  nombre: string;
  capacidad: number;
}

export interface Data {
  configuracion: string;
  parametros: { [key: string]: number | string };
}

export interface Proyecto {
  id: number;
  nombre: string;
  unidadesInterior: Unidad[];
  unidadesExterior: Unidad[];
  tuberias: string[];
  alambrado: string[];
  controlCentral: string[];
  reportes: { id: number; contenido: string }[];
  fechaCreacion: string;
  rutaArchivo: string;
  data: Data;
}

export default function Dashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const goTo = useNavigate();
  const { refreshToken } = useAuth();
  const usuarioId = Number(localStorage.getItem("usuarioId")) || null;
  const [searchTermProyectos, setSearchTermProyectos] = useState("");  // 🔹 Estado para búsqueda de proyectos
  const [searchTermArchivos, setSearchTermArchivos] = useState("");    // 🔹 Estado para búsqueda de archivos recientes
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [proyectosRecientes, setProyectosRecientes] = useState<Proyecto[]>([]);
  const [proyectosGuardados, setProyectosGuardados] = useState<Proyecto[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nombreProyecto, setNombreProyecto] = useState("");
  const { proyectoActivo, setProyectoActivo } = useProyecto();
  const [showModal1, setShowModal1] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [mensajeNotificacion, setMensajeNotificacion] = useState<string | null>(null);
  const [currentPageProyectos, setCurrentPageProyectos] = useState(1);
  const [totalPagesProyectos, setTotalPagesProyectos] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filteredProyectosGuardados, setFilteredProyectosGuardados] = useState<Proyecto[]>(proyectosGuardados);

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      console.error("Error al verificar la expiración del token:", error);
      return true;
    }
  };

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

      console.log("🚀 Solicitando archivos recientes a la API...");

      const response = await fetch(`${API_URL}/dashboard/Archivosrecientes?usuarioId=${usuarioId}&page=${page}&limit=10&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();

      if (!data.proyectos || data.proyectos.length === 0) {
        console.warn("⚠️ No se encontraron archivos recientes.");
        setProyectosRecientes([]); // 🔹 Ahora afecta solo a archivos recientes
      } else {
        setProyectosRecientes(data.proyectos); // 🔹 Actualiza archivos recientes, NO proyectos guardados
        console.log("✅ Estado actualizado con archivos recientes:", data.proyectos);
      }

      setTotalPages(Math.ceil(data.total / data.limit));
      setCurrentPage(page);
    } catch (error) {
      console.error("❌ Error al cargar archivos recientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProyectos = async (page: number, limit: number = 10, search: string = "") => {
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

      console.log("🚀 Solicitando proyectos a la API... Página:", page, "Búsqueda:", search);

      const response = await fetch(
        `${API_URL}/dashboard/proyectos/${usuarioId}?page=${page}&limit=${limit}&search=${search}`, // 🔹 Incluye el término de búsqueda
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
        setFilteredProyectosGuardados([]); // 🔥 Vaciar la lista filtrada si no hay proyectos
      } else {
        setProyectosGuardados(data.proyectos);

        // 🔥 Aplicar el filtro de búsqueda en la respuesta de la API
        const proyectosFiltrados = (data.proyectos as Proyecto[]).filter((proyecto: Proyecto) =>
          proyecto.nombre.toLowerCase().includes(search.toLowerCase())
        );

        setFilteredProyectosGuardados(proyectosFiltrados); // 🔹 Guardar los proyectos filtrados

        console.log("✅ Estado actualizado con proyectos:", proyectosFiltrados);
      }

      setTotalPagesProyectos(Math.max(1, Math.ceil(data.total / data.limit)));
      setCurrentPageProyectos(data.page);

    } catch (error) {
      console.error("❌ Error al cargar proyectos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      console.log("📡 Cambio en archivos recientes → Nueva página:", currentPage + 1);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermArchivos(e.target.value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  const handleNextPageProyectos = () => {
    if (currentPageProyectos < totalPagesProyectos) {
      console.log("📡 Cambio en proyectos → Nueva página:", currentPageProyectos + 1);
      setCurrentPageProyectos((prev) => prev + 1);
    }
  };

  const handlePrevPageProyectos = () => {
    if (currentPageProyectos > 1) {
      setCurrentPageProyectos((prev) => prev - 1);
    }
  };

  const handleSearchChangeProyectos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTermProyectos(searchTerm);
    setCurrentPageProyectos(1); // 🔹 Resetear paginación al buscar

    // 🔥 Filtrar proyectos guardados según el término de búsqueda
    const proyectosFiltrados = proyectosGuardados.filter((proyecto) =>
      proyecto.nombre.toLowerCase().includes(searchTerm)
    );

    setFilteredProyectosGuardados(proyectosFiltrados);
  };

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");

  const handleOpenModal = (content: string) => {
    setModalContent(content);
    setShowModal(true);
  };

  const eliminarProyecto = async (proyectoId: number) => {
    try {
      const response = await fetch(`${API_URL}/dashboard/proyectos/${proyectoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Error del servidor al eliminar proyecto:", errorData);
        toast.error(`❌ No se pudo eliminar el proyecto: ${errorData || "Error desconocido."}`, {
          position: "bottom-right",
          autoClose: 3000,
        });
        return;
      }

      // 🔥 Primero limpiar la selección antes de actualizar la lista
      if (proyectoSeleccionado?.id === proyectoId) {
        setProyectoSeleccionado(null);
        localStorage.removeItem("proyectoActivo"); // 🔥 Asegurar que `localStorage` también se limpia
      }

      setProyectosGuardados((prev) => prev.filter((p) => p.id !== proyectoId));

      // 🔥 Forzar una actualización de estado después de limpiar `proyectoSeleccionado`
      setTimeout(() => setProyectoSeleccionado(null), 0);

      toast.success("✅ Proyecto eliminado exitosamente!", {
        position: "bottom-right",
        autoClose: 3000,
      });

      console.log("✅ Proyecto eliminado correctamente:", proyectoId);
    } catch (error) {
      console.error("❌ Error al eliminar el proyecto:", error);
      toast.error("❌ Hubo un problema al conectar con el servidor.");
    }
  };

  const abrirModalProyectos = async () => {
    console.log("🚀 Intentando abrir el modal...");
    setShowModal1(true);  // ✅ Activa el modal
    await listarProyectos();  // ✅ Carga los proyectos antes de abrirlo
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalContent("");
  };

  const crearProyecto = async (nombreProyecto: string, usuarioId: number) => {
    console.log("🚀 Enviando datos al backend:", usuarioId, nombreProyecto);

    const dataInicial = {
      id: Date.now(),
      nombre: nombreProyecto,
      unidadesInterior: [],
      unidadesExterior: [],
      tuberias: [],
      alambrado: [],
      controlCentral: [],
      reportes: [],
      fechaCreacion: new Date().toISOString(),
      rutaArchivo: "default_path",
    };

    try {
      console.log("🔹 Enviando solicitud a la API...");
      console.log("🚀 API URL:", `${API_URL}/dashboard/crearProyectos`);
      console.log("🚀 Datos a enviar:", { usuarioId, nombre: nombreProyecto, data: dataInicial });

      const response = await fetch(`${API_URL}/dashboard/crearProyectos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, nombre: nombreProyecto, data: dataInicial }),
      });

      console.log("🧐 Estado de la respuesta:", response.status);

      if (!response.ok) {
        console.error("❌ Error en la respuesta del servidor:", response.status);
        toast.error("❌ Error al crear el proyecto.");
        console.log("🔥 Se ejecutó toast.error()");
        return;
      }

      const responseData = await response.json();
      console.log("✅ Datos recibidos del backend:", responseData);

      if (!responseData || !responseData.nombre) {
        console.error("❌ Error: `responseData` está vacío o mal formado.");
        toast.error("❌ Error al recibir la respuesta del backend.");
        console.log("🔥 Se ejecutó toast.error() por respuesta mal formada");
        return;
      }

      toast.success(`🚀 El proyecto "${responseData.nombre}" ha sido guardado exitosamente!`);
      console.log("🔥 Se ejecutó toast.success()");

    } catch (error) {
      console.error("❌ Error al procesar la solicitud:", error);
      toast.error("❌ Error al enviar la solicitud.");
    }
  };

  const abrirProyecto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) {
      toast.error("❌ No se seleccionó ningún archivo.", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const contenido = e.target?.result as string;
        const proyectoCargado = JSON.parse(contenido);

        // ✅ Si no tiene ID, asignarle uno
        if (!proyectoCargado.id) {
          proyectoCargado.id = Date.now();
        }

        setProyectoActivo(proyectoCargado);
        localStorage.setItem("proyectoActivo", JSON.stringify(proyectoCargado));

        console.log(`✅ Proyecto "${archivo.name}" cargado desde escritorio`);

        // 🚀 Agregar notificación visual de éxito
        toast.success(`🚀 Proyecto "${archivo.name}" cargado correctamente!`, {
          position: "bottom-right",
          autoClose: 3000,
        });
      } catch (error) {
        console.error("❌ Error al leer el archivo:", error);
        toast.error("❌ El archivo no es válido. Asegúrate de que sea un JSON correcto.", {
          position: "bottom-right",
          autoClose: 3000,
        });
      }
    };

    reader.readAsText(archivo);
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


  useEffect(() => {
    if (showModal1) {
      console.log("🔄 Cargando proyectos antes de abrir el modal...");
      fetchProyectos(currentPageProyectos, 10, searchTermProyectos);
    }
  }, [showModal1]);

  useEffect(() => {
    console.log("🚀 useEffect ejecutado! Buscando archivos...");
    console.log("Valor de proyectosGuardados antes del map:");
    fetchFiles(currentPage, searchTermArchivos);
  }, [currentPage, searchTermArchivos]);

  useEffect(() => {
    console.log("📡 Buscando proyectos para página:", currentPageProyectos);
    fetchProyectos(currentPageProyectos, 10, searchTermProyectos);
  }, [currentPageProyectos, searchTermProyectos]); // 🔹 Eliminamos `totalPagesProyectos`*/

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

  useEffect(() => {
    const storedProyecto = localStorage.getItem("proyectoActivo");

    if (storedProyecto) {
      setProyectoActivo(JSON.parse(storedProyecto));
      console.log("✅ Proyecto activo restaurado con unidades interiores:", storedProyecto);
    }
  }, []);

  // 🔹 Ahora depende también de `totalPagesProyectos`
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
                setNombreProyecto(""); // 🔥 Limpiar el campo de texto
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
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}>
          <div className="bg-white p-4 rounded shadow" style={{ maxWidth: "600px", width: "90vw", textAlign: "center" }}>
            <h3 className="mb-4" style={{ color: "#0d6efd", fontWeight: "bold" }}>
              Proyecto: {proyecto.nombre}
            </h3>
            <p>
              Tiene <strong>{proyecto.unidadesInterior.length}</strong> unidades interiores y
              <strong> {proyecto.unidadesExterior.length}</strong> unidades exteriores.
            </p>
            <p>
              Además, cuenta con <strong>{proyecto.tuberias.length}</strong> tuberías y
              <strong> {proyecto.reportes.length}</strong> reportes.
            </p>
            <button className="btn btn-secondary w-100 mt-3" style={{ borderRadius: "8px" }} onClick={handleCloseModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="container">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar archivos..."
          value={searchTermArchivos}
          onChange={handleSearchChange}
        />
      </div>

      {showModal1 && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
        >
          <div
            className="bg-white p-5 rounded shadow"
            style={{ maxWidth: "900px", width: "95vw", textAlign: "center", minHeight: "650px" }}
          >
            <h3 className="mb-4 text-primary fw-bold">Proyectos Guardados</h3>

            {/* ✅ Barra de búsqueda */}
            <input
              type="text"
              className="form-control mb-4"
              placeholder="Buscar proyecto..."
              value={searchTermProyectos}
              onChange={handleSearchChangeProyectos} // 🔥 Ahora filtra correctamente los proyectos
            />

            <div style={{ padding: "15px", maxHeight: "500px", overflowY: "auto" }}>
              {filteredProyectosGuardados.length === 0 ? (
                <p className="text-center text-muted">No se encontraron proyectos.</p>
              ) : (
                <ul className="list-group">
                  {filteredProyectosGuardados.map((proyecto) => (
                    <li
                      key={proyecto.id}
                      className={`list-group-item d-flex justify-content-between align-items-center ${proyectoSeleccionado?.id === proyecto.id ? "bg-info text-white" : ""}`}
                      style={{
                        cursor: "pointer",
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between", // 🔹 Distribuye mejor los elementos
                        gap: "10px",
                        flexWrap: "nowrap", // 🔥 Evita que el contenido desborde
                      }}
                      onClick={() => setProyectoSeleccionado(proyecto)}
                    >
                      {/* 🔹 Nombre truncado para evitar que se desborde */}
                      <span style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: "1",
                        maxWidth: "220px", // 🔥 Ajusta el ancho dinámicamente
                        fontWeight: "bold",
                      }}>
                        {proyecto.nombre}
                      </span>

                      {/* 🔹 Fecha con alineación uniforme */}
                      <small className="text-muted" style={{
                        minWidth: "130px", // 🔹 Mantiene un tamaño uniforme
                        textAlign: "right",
                        fontSize: "14px",
                        flexShrink: 0, // 🔥 Evita que la fecha se reduzca inesperadamente
                      }}>
                        {new Date(proyecto.fechaCreacion).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </small>

                      {/* 🔹 Botón de eliminar bien alineado */}
                      <button className="btn btn-danger btn-sm ms-3" style={{ flexShrink: 0 }} onClick={() => eliminarProyecto(proyecto.id)}>
                        <i className="bi bi-trash"></i> Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 🔹 Controles de paginación separados */}
            <div className="d-flex justify-content-between align-items-center mt-4">
              <button
                className="btn btn-outline-primary"
                disabled={currentPageProyectos === 1}
                onClick={handlePrevPageProyectos} // 🔹 Ahora usa la función directa
              >
                Anterior
              </button>

              <span className="fw-bold">Página {currentPageProyectos} de {totalPagesProyectos}</span>

              <button
                className="btn btn-outline-primary"
                disabled={currentPageProyectos === totalPagesProyectos}
                onClick={handleNextPageProyectos} // 🔹 Ahora usa la función directa

              >
                Siguiente
              </button>

            </div>

            {/* Botones de acción con mejor organización */}
            <div className="d-flex justify-content-center gap-4 mt-5">
              <button
                className={`btn btn-primary w-50 ${!proyectoSeleccionado ? "btn-outline-primary" : ""}`}
                disabled={!proyectoSeleccionado}
                onClick={() => {
                  if (proyectoSeleccionado) {
                    setProyectoActivo(proyectoSeleccionado);
                    localStorage.setItem("proyectoActivo", JSON.stringify(proyectoSeleccionado));

                    // 🔹 Limpiar el proyecto seleccionado después de activarlo
                    setProyectoSeleccionado(null);

                    setShowModal1(false);
                    console.log("✅ Proyecto activado:", proyectoSeleccionado);

                    // 🚀 Mostrar notificación de éxito
                    toast.success(`🚀 Proyecto "${proyectoSeleccionado.nombre}" activado correctamente!`, {
                      position: "bottom-right",
                      autoClose: 3000,
                    });
                  } else {
                    // ❌ Mostrar notificación de error si no hay proyecto seleccionado
                    toast.error("❌ No se pudo activar el proyecto. Selecciona uno primero.", {
                      position: "bottom-right",
                      autoClose: 3000,
                    });
                  }
                }}
              >
                Usar Proyecto
              </button>

              <button
                className="btn btn-secondary w-50"
                onClick={() => {
                  // 🔹 Limpiar el proyecto seleccionado al cerrar el modal
                  setProyectoSeleccionado(null);
                  localStorage.removeItem("proyectoActivo"); // 🔥 Asegurar que el almacenamiento también se limpie
                  setShowModal1(false);
                }}
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

        <div className="card shadow" style={{ width: "68vw", height: "400px", display: "flex", flexDirection: "column", left: "-220px" }}>
          <div className="card-body" style={{ flex: 1, overflowY: "auto" }}>  {/* ✅ Scroll solo en la lista */}
            {loading ? (
              <p className="text-center">Cargando proyectos...</p>
            ) : (
              <>
                <div className="list-group fs-5 text-dark" style={{ fontFamily: "Arial, sans-serif" }}>
                  {proyectosRecientes.length === 0 ? (
                    <p className="text-center text-muted">No se encontraron proyectos.</p>
                  ) : (
                    proyectosRecientes.map((proyecto, index) => (
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
                        <small className="text-muted">
                          {new Date(proyecto.fechaCreacion).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </small>
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
                onClick={handlePrevPage} // 🔹 Ahora usa `handlePrevPageRecientes`
                disabled={currentPage === 1} // 🔹 Ahora usa `currentPageRecientes`
                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
              >
                Página Anterior
              </button>
              <button
                className="btn btn-primary px-3 py-2 rounded"
                onClick={handleNextPage} // 🔹 Ahora usa `handleNextPageRecientes`
                disabled={currentPage === totalPages} // 🔹 Ahora usa `totalPagesRecientes`
                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
              >
                Página Siguiente
              </button>
            </div>
            <span className="text-muted fs-6">Página {currentPage} de {totalPages}</span> {/* 🔹 Ahora usa `currentPageRecientes` */}
          </div>
        </div>
      </section>

    </div>

  );
}