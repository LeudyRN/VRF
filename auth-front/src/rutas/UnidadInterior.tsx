/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useProyecto } from "../rutas/ProyectoContext.tsx";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";  // ✅ Asegúrate de importar correctamente
import { Proyecto } from "../rutas/Dashboard.tsx";

interface UnidadInterior {
  id: number;
  unitName: string;
  remark: string | null;
  model: string;
  dbt_rh_cooling: string;
  dbt_heating: number;
  reqTC: number;
  reqSC: number;
  reqH: number;
  rtTC: number;
  rtH: number;
  noise: string;
  airflow: string;
  design_static_pressure: number;
  static_pressure_range: string;
  weight: number;
  image_url: string;
  cantidad?: number;
  dryBulbTempCooling?: number;
  wetBulbTempCooling?: number;
  relativeHumCooling?: number;
  dryBulbTempHeating?: number;
  totalCooling?: number;
  heating?: number;
  heightDifferenceToODU?: number;
  visto?: boolean;
}

const UnidadInterior = () => {
  const [equiposDisponibles, setEquiposDisponibles] = useState<UnidadInterior[]>([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<UnidadInterior[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipoDetalles, setEquipoDetalles] = useState<UnidadInterior | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [datosEditados, setDatosEditados] = useState<UnidadInterior | null>(null);
  const [equiposRestantes, setEquiposRestantes] = useState<UnidadInterior[]>([]);
  const [showEquiposRestantesModal, setShowEquiposRestantesModal] = useState(false);
  const [equiposRelacionados, setEquiposRelacionados] = useState<UnidadInterior[]>([]);
  const { proyectoActivo, setProyectoActivo } = useProyecto();
  const goTo = useNavigate();
  const navigate = useNavigate()


  const actualizarProyectoConUnidades = async () => {
    if (!proyectoActivo) {
      console.error("❌ No hay un proyecto activo para actualizar.");
      toast.error("❌ No hay un proyecto activo. Selecciona uno antes de actualizar.", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }

    // ✅ Obtener `usuario_id` desde localStorage
    const usuarioId = localStorage.getItem("usuarioId");
    const fechaCreacion = new Date().toISOString().slice(0, 19).replace("T", " ");

    // ✅ Asegurar que `unidadesInterior` tenga siempre un valor válido
    const unidadesInteriorActual = Array.isArray(proyectoActivo.unidadesInterior)
      ? proyectoActivo.unidadesInterior
      : [];

    // ✅ Fusionamos los nuevos equipos interiores con los existentes
    const unidadesInteriorActualizada = equiposSeleccionados.map(equipo => ({
      id: equipo.id,
      nombre: equipo.unitName,
      capacidad: equipo.reqH,
      model: equipo.model,
      dbt_rh_cooling: equipo.dbt_rh_cooling,
      dbt_heating: equipo.dbt_heating,
      reqTC: equipo.reqTC,
      reqSC: equipo.reqSC,
      reqH: equipo.reqH,
      rtTC: equipo.rtTC,
      rtH: equipo.rtH,
      noise: equipo.noise,
      airflow: equipo.airflow,
      design_static_pressure: equipo.design_static_pressure,
      static_pressure_range: equipo.static_pressure_range,
      weight: equipo.weight,
      image_url: equipo.image_url,
      cantidad: equipo.cantidad || 1,
      dryBulbTempCooling: equipo.dryBulbTempCooling || null,
      wetBulbTempCooling: equipo.wetBulbTempCooling || null,
      relativeHumCooling: equipo.relativeHumCooling || null,
      dryBulbTempHeating: equipo.dryBulbTempHeating || null,
      totalCooling: equipo.totalCooling || null,
      heating: equipo.heating || null,
      heightDifferenceToODU: equipo.heightDifferenceToODU || null,
      visto: equipo.visto || false,
    }));

    // ✅ Crear `proyectoActualizado` con `unidadesInteriorActualizada`
    const proyectoActualizado = {
      ...proyectoActivo,
      usuario_id: usuarioId,
      fechaCreacion,
      rutaArchivo: proyectoActivo.rutaArchivo ?? "default_path",
      unidadesInterior: unidadesInteriorActualizada,
    };

    console.log("📡 Datos enviados al backend:", JSON.stringify(proyectoActualizado, null, 2));

    try {
      // ✅ Enviar los datos al backend para guardarlos en la DB
      const response = await fetch(`${API_URL}/unidad-interior/guardar-proyecto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proyectoActualizado),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error en la DB: ${errorData.error || "Sin detalles"}`);
      }

      console.log("✅ Datos guardados correctamente en la DB:", await response.json());

      // 🚀 Mostrar notificación de éxito con el nombre del proyecto
      toast.success(`🚀 Proyecto "${proyectoActivo.nombre}" actualizado en la base de datos!`, {
        position: "bottom-right",
        autoClose: 3000,
      });

      // ✅ Guardamos el proyecto en el estado global y localStorage
      setProyectoActivo(proyectoActualizado);
      localStorage.setItem("proyectoActivo", JSON.stringify(proyectoActualizado));

    } catch (error) {
      console.error("❌ Error al guardar en la DB:", error);

      // 🔹 Verificamos si `error` es una instancia de `Error`
      const mensajeError = error instanceof Error ? error.message : "Error desconocido";

      toast.error(`❌ No se pudo guardar en la base de datos: ${mensajeError}`, {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const response = await fetch("http://localhost:3100/api/unidad-interior");
        if (!response.ok) {
          throw new Error("Error al obtener los datos desde el servidor.");
        }
        const data: UnidadInterior[] = await response.json();
        setEquiposDisponibles(data);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error al cargar los datos:", error.message);
          setError(error.message);
        } else {
          console.error("Error desconocido:", error);
          setError("Ocurrió un error desconocido.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUnidades();
  }, []);

  const [modalTipo, setModalTipo] = useState<"detalle" | "edicion" | null>(null);


  const añadirEquipo = (equipo: UnidadInterior) => {
    try {
      setEquiposSeleccionados((prevEquipos) => {
        const existe = prevEquipos.some((e) => e.id === equipo.id);
        if (existe) {
          return prevEquipos.map((e) =>
            e.id === equipo.id ? { ...e, cantidad: (e.cantidad || 1) + 1 } : e
          );
        } else {
          return [...prevEquipos, { ...equipo, cantidad: 1 }];
        }
      });

      console.log("✅ Equipo agregado:", equipo);
      toast.success(`🚀 Equipo "${equipo.unitName}" agregado correctamente!`, {
        position: "bottom-right",
        autoClose: 3000,
      });

      setShowEquiposRestantesModal(false);
    } catch (error) {
      console.error("❌ Error al agregar el equipo:", error);
      toast.error("❌ Hubo un problema al agregar el equipo.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };

  const añadirEquipo1 = (equipo: UnidadInterior) => {
    try {
      setDatosEditados({ ...equipo, cantidad: 1 });
      setEquipoDetalles(null); // Limpiar por si acaso
      setModalTipo("edicion");
      setShowModal(true);

      console.log("✅ Equipo listo para edición:", equipo);
      toast.success(`🚀 Equipo "${equipo.unitName}" listo para edición!`, {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("❌ Error al preparar el equipo para edición:", error);
      toast.error("❌ Hubo un problema al preparar el equipo.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };

  const verDetalles = (equipo: UnidadInterior) => {
    setEquipoDetalles(equipo);
    setDatosEditados(null); // Limpiar por si acaso
    setModalTipo("detalle");
    setShowModal(true);
  };

  const verEquiposRestantes = (equipos: UnidadInterior[]) => {
    if (!equiposDisponibles || equiposDisponibles.length === 0) {
      console.error("No hay equipos disponibles.");
      return;
    }

    const equiposFiltrados = equiposDisponibles.filter(equipo => !equipo.visto);

    console.log("Equipos restantes:", equiposFiltrados); // Verifica si hay equipos antes de abrir el modal

    setEquiposRestantes(equiposFiltrados);
    setShowEquiposRestantesModal(true); // Esto asegurará que el pop-up se muestre
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalTipo(null);
    setEquipoDetalles(null);
    setDatosEditados(null);
  };

  const obtenerModelosRelacionados = (unitNameSeleccionado: string) => {
    return equiposDisponibles.filter(equipo =>
      equipo.unitName === unitNameSeleccionado
    );
  };

  const obtenerEquipoDetalles = async (id: number) => {
    const respuesta = await fetch(`/api/unidad_interior/${id}`);
    const datos = await respuesta.json();
    setEquipoDetalles(datos);
  };

  const ajustarCantidad = (id: number, incremento: number) => {
    setEquiposSeleccionados((prev) =>
      prev.map((equipo) =>
        equipo.id === id ? { ...equipo, cantidad: Math.max(1, (equipo.cantidad || 1) + incremento) } : equipo
      )
    );
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, key: keyof UnidadInterior) => {
    setDatosEditados((prevDatos) => {
      if (!prevDatos) return null;

      let value: any = event.target.value;

      if (
        key === "dbt_heating" ||
        key === "reqTC" ||
        key === "reqSC" ||
        key === "reqH" ||
        key === "rtTC" ||
        key === "rtH" ||
        key === "design_static_pressure" ||
        key === "weight" ||
        key === "cantidad"
      ) {
        const parsedValue = parseFloat(event.target.value);
        if (!isNaN(parsedValue)) {
          value = parsedValue;
        } else {
          value = 0;
        }
      }
      return {
        ...prevDatos,
        [key]: value,
      };
    });
  };

  const enviarReporte = () => {
    if (datosEditados) {
      setEquiposSeleccionados((prev) => [...prev, datosEditados]);
      setShowModal(false);
      setDatosEditados(null);
      toast.success("Equipo añadido a la tabla");
    }
  };


  return (<div className="container mt-5" style={{
    margin: 0,
    padding: "4vh",
    marginTop: "5vh",
    position: "relative"
  }}
  >
    <h1 style={{
      margin: 0,
      padding: "1vh",
      marginTop: "1vh",
      fontWeight: "bold",
      marginLeft: "-3vh"
    }}
    >
      Unidad Interior </h1> <p style={{
        fontSize: "1rem",
        color: "#6c757d",
        marginBottom: "6vh",
        marginLeft: "-1.6vh",
        fontWeight: "bold"
      }}
      >
      Explora las especificaciones y modelos de la Unidad Interior. </p>

      <div className="row gy-2 gx-2 justify-content-center" style={{ width: '130%' }}>
  <div className="col-md-12 w-100 mt-3" style={{ overflowY: 'auto', maxHeight: '400px' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '10px', paddingBottom: '5px' }}>
      {loading ? (
        <p>Cargando datos...</p>
      ) : error ? (
        <p className="text-danger">Error: {error}</p>
      ) : (
        equiposDisponibles.map((equipo) => (
          <div
            key={equipo.id}
            style={{
              flex: '1 1 calc(25% - 15px)', // Cada tarjeta ocupa el 25% del ancho menos el gap
              maxWidth: 'calc(25% - 15px)', // Limitar el ancho máximo de cada tarjeta
              boxSizing: 'border-box',      // Asegurar que los márgenes no afecten el cálculo del ancho
              height: '330px',              // Establecer una altura fija para todas las tarjetas
            }}
          >
            <div className="card shadow-sm h-100">
              <div className="card-body text-left d-flex flex-column justify-content-between"> {/* 🔹 Asegurar alineación uniforme */}
                <img
                  src={`http://localhost:3100${equipo.image_url}`}
                  alt={equipo.unitName}
                  className="img-fluid mb-3 shadow-sm"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "contain",
                  }}
                />
                <h5 className="card-title text-primary" style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' // 🔥 Limitar nombres largos
                }}>
                  {equipo.unitName}
                </h5>
                <p className="card-text text-secondary">{equipo.model}</p>
                <div className="d-flex justify-content-between mt-3">
                  <button
                    className="btn btn-primary"
                    style={{ flex: '1', marginRight: '5px', minWidth: '90px' }}
                    onClick={() => añadirEquipo1(equipo)}
                    disabled={equiposSeleccionados.some((e) => e.id === equipo.id)}
                  >
                    <i className="bi bi-plus-circle me-1"></i> Agregar
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    style={{ flex: '1', marginRight: '5px', minWidth: '90px' }}
                    onClick={() => verDetalles(equipo)}
                  >
                    <i className="bi bi-info-circle me-1"></i> Detalles
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: '1', minWidth: '90px' }}
                    onClick={() => {
                      fetch(`http://localhost:3100/api/unidad-interior/relacionados/${encodeURIComponent(equipo.unitName)}`)
                        .then((res) => res.json())
                        .then((data) => {
                          setEquiposRestantes(data); // Guarda los modelos relacionados en el estado
                          setShowEquiposRestantesModal(true); // Muestra el modal
                        })
                        .catch((err) => console.error("Error al obtener modelos relacionados:", err));
                    }}
                  >
                    <i className="bi bi-gear-fill me-1"></i> Equipos
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>

      {equipoDetalles && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setEquipoDetalles(null)}
        >
          <div
            className="card shadow-sm position-relative"
            style={{
              width: '50vh',
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cierre "X" en la esquina superior derecha */}
            <button
              type="button"
              className="btn-close position-absolute"
              style={{
                top: '10px',
                right: '10px',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
              onClick={() => setEquipoDetalles(null)}
              aria-label="Cerrar"
            ></button>

            <div className="card-body">
              <h4 className="text-primary mb-3 text-center text-md-start">
                <i className="bi bi-info-circle"></i> Detalles del Equipo
              </h4>

              <ul className="list-unstyled">
                {[
                  { label: 'Nombre', value: equipoDetalles.unitName },
                  { label: 'Modelo', value: equipoDetalles.model },
                  { label: 'Observación', value: equipoDetalles.remark },
                  { label: 'Presión Estática', value: equipoDetalles.design_static_pressure, suffix: ' Pa' },
                  { label: 'Rango de Presión Estática', value: equipoDetalles.static_pressure_range },
                  { label: 'Flujo de Aire', value: equipoDetalles.airflow },
                  { label: 'Ruido', value: equipoDetalles.noise, suffix: ' dB' },
                  { label: 'Peso', value: equipoDetalles.weight, suffix: ' kg' },
                ].map(
                  ({ label, value, suffix }) =>
                    value !== undefined && (
                      <li className="mb-2 d-flex flex-wrap" key={label}>
                        <strong className="me-2 text-sm">{label}:</strong>
                        <span className="text-sm">{value}{suffix || ''}</span>
                      </li>
                    )
                )}
              </ul>

              <button
                className="btn btn-sm btn-outline-secondary mt-3"
                onClick={() => setEquipoDetalles(null)}
              >
                <i className="bi bi-x-circle"></i> Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

    {showModal && datosEditados && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={handleCloseModal}
      >
        <div
          className="modal-dialog"
          style={{
            width: '60vw',
            maxWidth: '700px',
            background: '#fff',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con botón de cierre bien ubicado */}
          <div className="modal-header d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-primary" style={{ pointerEvents: 'none' }}>
              <i className="bi bi-info-circle"></i> Detalles del Equipo
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleCloseModal}
              aria-label="Cerrar"
            ></button>
          </div>

          <div className="modal-content">
            <div className="modal-body mt-5">
              {/* Campos del formulario con los nuevos datos agregados */}
              {[
                { label: 'Unit Name', id: 'unitName', type: 'text' },
                { label: 'Remark', id: 'remark', type: 'text' },
                { label: 'Model', id: 'model', type: 'text' },

                {
                  label: 'Dry Bulb Temp. (Cooling)',
                  id: 'dbt_rh_cooling',
                  type: 'text', // Cambia `number` a `text` para manejar la cadena completa
                  format: (value: string) => value.includes(' / ') ? value.split(' / ')[0] : value,
                },

                { label: 'Wet Bulb Temp. (Cooling)', id: 'rtTC', type: 'number' },
                { label: 'Relative HUM (Cooling)', id: 'reqH', type: 'number' },
                { label: 'Dry Bulb Temp. (Heating)', id: 'dbt_heating', type: 'number' },
                { label: 'Total Cooling', id: 'reqTC', type: 'number' },
                { label: 'Heating', id: 'reqSC', type: 'number' },
                { label: 'Height Difference to ODU', id: 'rtH', type: 'number' },
              ].map(({ label, id, type }) => (
                <div className="mb-3" key={id}>
                  <label htmlFor={id} className="form-label fw-bold">{label}:</label>
                  <input
                    type={type}
                    className="form-control"
                    id={id}
                    value={(datosEditados as Record<string, any>)[id] || (type === 'number' ? 0 : '')}
                    onChange={(e) => handleInputChange(e, id as keyof UnidadInterior)}
                  />
                </div>
              ))}
            </div>

            {/* Footer con botones estilizados */}
            <div className="modal-footer d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={handleCloseModal}
                style={{ marginRight: '10px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary px-4"
                onClick={enviarReporte}
              >
                <i className="bi bi-plus-circle"></i> Añadir
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {showEquiposRestantesModal && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={() => setShowEquiposRestantesModal(false)}
      >
        <div
          className="card shadow-lg position-relative"
          style={{
            width: '70vw',
            maxWidth: '900px',
            background: '#fff',
            borderRadius: '15px',
            padding: '30px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cierre "X" en la esquina superior derecha */}
          <button
            type="button"
            className="btn-close position-absolute"
            style={{
              top: '15px',
              right: '15px',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
            onClick={() => setShowEquiposRestantesModal(false)}
            aria-label="Cerrar"
          ></button>

          <div className="card-body">
            <h4 className="text-primary text-center mb-5">
              <i className="bi bi-grid-3x3-gap-fill"></i> Equipos Relacionados
            </h4>

            <div className="row">
              {equiposRestantes.length > 0 ? (
                equiposRestantes.map((equipo, index) => (
                  <div key={index} className="col-md-6 mb-3">
                    <div
                      className="card shadow-sm p-3"
                      style={{
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                        transition: '0.3s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <h5 className="text-primary fw-bold mb-2">
                        <i className="bi bi-box"></i> {equipo.unitName}
                      </h5>

                      <p className="text-muted mb-1">
                        <strong>Modelo:</strong> {equipo.model}
                      </p>

                      {equipo.design_static_pressure !== undefined && (
                        <p className="text-muted mb-1">
                          <strong>Presión Estática:</strong> {equipo.design_static_pressure} Pa
                        </p>
                      )}

                      {equipo.weight !== undefined && (
                        <p className="text-muted mb-1">
                          <strong>Peso:</strong> {equipo.weight} kg
                        </p>
                      )}

                      {equipo.noise !== undefined && (
                        <p className="text-muted mb-1">
                          <strong>Ruido:</strong> {equipo.noise} dB
                        </p>
                      )}

                      {equipo.airflow !== undefined && (
                        <p className="text-muted mb-1">
                          <strong>Flujo de Aire:</strong> {equipo.airflow} m³/h
                        </p>
                      )}

                      {equipo.rtTC !== undefined && (
                        <p className="text-muted mb-1">
                          <strong>Temperatura de retorno TC:</strong> {equipo.rtTC} °C
                        </p>
                      )}

                      {equipo.rtH !== undefined && (
                        <p className="text-muted mb-1">
                          <strong>Humedad de retorno:</strong> {equipo.rtH} %
                        </p>
                      )}

                      {equipo.static_pressure_range !== undefined && (
                        <p className="text-muted mb-1">
                          <strong>Rango de presión estática:</strong> {equipo.static_pressure_range}
                        </p>
                      )}

                      <button
                        type="button"
                        className="btn btn-primary w-100 mt-3"
                        onClick={() => añadirEquipo(equipo)}
                        disabled={equiposSeleccionados.some((e) => e.id === equipo.id)}
                        style={{ transition: '0.3s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      >
                        <i className="bi bi-plus-circle"></i> Añadir
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-danger">No hay equipos restantes.</p>
              )}
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary mt-2"
                onClick={() => setShowEquiposRestantesModal(false)}
              >
                <i className="bi bi-x-circle"></i> Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    <h2 className="mt-5 text-primary">Tabla de Unidades Seleccionadas</h2>
    <div
      className="table-responsive mt-1"
      style={{
        maxHeight: '270px',
        overflowY: 'auto',
        width: '130%',
        margin: '0 auto',

      }}
    >
      <table className="table table-bordered table-striped text-center"
        style={{
          width: '100%',
          backgroundColor: '#f8f9fa',
          borderCollapse: 'separate',
          borderSpacing: '0 10px',

        }}>
        <thead className="table-primary">
          <tr>
            <th>Unit name</th>
            <th>Model</th>
            <th>Cantidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equiposSeleccionados.map((equipo) => (
            <tr key={equipo.id}
              style={{
                backgroundColor: 'white',
                boxShadow: '0 2px 5px rgba(0, 45, 248, 0.1)',
                borderRadius: '5px',
              }}>
              <td>{equipo.unitName}</td>
              <td>{equipo.model}</td>
              <td>
                <div className="d-flex justify-content-center align-items-center">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => ajustarCantidad(equipo.id, -1)}
                  >
                    -
                  </button>
                  <span className="mx-2">{equipo.cantidad}</span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => ajustarCantidad(equipo.id, 1)}
                  >
                    +
                  </button>
                </div>
              </td>
              <td>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  try {
                    setEquiposSeleccionados((prev) => prev.filter((e) => e.id !== equipo.id));

                    // 🚀 Mostrar notificación de éxito
                    toast.success(`✅ Equipo "${equipo.unitName}" eliminado correctamente!`, {
                      position: "bottom-right",
                      autoClose: 3000,
                    });

                    console.log("✅ Equipo eliminado:", equipo);
                  } catch (error) {
                    console.error("❌ Error al eliminar el equipo:", error);
                    toast.error("❌ Hubo un problema al eliminar el equipo.", {
                      position: "bottom-right",
                      autoClose: 3000,
                    });
                  }
                }}
              >
                <i className="bi bi-trash me-1"></i> Eliminar
              </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="d-flex justify-content-center mt-5">
      <button
        className="btn"
        onClick={actualizarProyectoConUnidades}
        style={{
          backgroundColor: "blue",   /* 🔹 Fondo azul */
          color: "white",            /* 🔹 Texto blanco */
          fontWeight: "bold",        /* 🔹 Texto en negrita */
          padding: "10px 15px",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer",
          marginTop: "0",
          marginLeft: "20vh"
        }}
      >
        Aplicar cambios <i className="bi bi-check-circle ms-2"></i>
      </button>
    </div>

  </div>
  );
};

export default UnidadInterior;
