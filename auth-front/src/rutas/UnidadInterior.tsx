/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";


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
}

const UnidadInterior = () => {
  const [equiposDisponibles, setEquiposDisponibles] = useState<UnidadInterior[]>([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<UnidadInterior[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipoDetalles, setEquipoDetalles] = useState<UnidadInterior | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [datosEditados, setDatosEditados] = useState<UnidadInterior | null>(null);

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
        setDatosEditados({ ...equipo, cantidad: 1 });
        setEquipoDetalles(null); // Limpiar por si acaso
        setModalTipo("edicion");
        setShowModal(true);
      };

      const verDetalles = (equipo: UnidadInterior) => {
        setEquipoDetalles(equipo);
        setDatosEditados(null); // Limpiar por si acaso
        setModalTipo("detalle");
        setShowModal(true);
      };

      const handleCloseModal = () => {
        setShowModal(false);
        setModalTipo(null);
        setEquipoDetalles(null);
        setDatosEditados(null);
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



  return ( <div className="container mt-5" style={{
  margin: 0,
  padding: "4vh",
  marginTop: "5vh",
  position: "relative" }}
  >


      <h1 style={{
        margin: 0,
        padding: "1vh",
        marginTop: "1vh",
        fontWeight: "bold",
        marginLeft: "-3vh" }}

        >

        Unidad Interior </h1> <p style={{
        fontSize: "1rem",
        color: "#6c757d",
        marginBottom: "6vh",
        marginLeft: "-1.6vh",
        fontWeight: "bold" }}

        >

    Explora las especificaciones y modelos de la Unidad Interior. </p>

    <div className="row gy-2 gx-2 justify-content-center"  style={{ width: '130%' }}>
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
                  minHeight: '320px',           // Establecer una altura mínima para todas las tarjetas
                }}
              >
                <div className="card shadow-sm h-100">
                  <div className="card-body text-left">
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
                    <h5 className="card-title text-primary">{equipo.unitName}</h5>
                    <p className="card-text text-secondary">{equipo.model}</p>
                    <div
                      className="d-flex justify-content-between"
                      style={{ marginTop: '15px' }}
                    >
                      <button
                        className="btn btn-primary"
                        style={{ flex: '1', marginRight: '5px', minWidth: '90px' }}
                        onClick={() => añadirEquipo(equipo)}
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
                        onClick={() => verDetalles(equipo)}
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
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setEquipoDetalles(null)}
          >
            <div
              className="card shadow-sm"
              style={{
                width: '50vh',
                background: '#fff',
                borderRadius: '8px',
                padding: '20px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body">
                <h4 className="text-primary mb-3 text-center text-md-start">
                  Detalles del Equipo
                </h4>
                <ul className="list-unstyled">
                  <li className="mb-2 d-flex flex-wrap">
                    <strong className="me-2 text-sm">Nombre:</strong>
                    <span className="text-sm">{equipoDetalles.unitName}</span>
                  </li>
                  <li className="mb-2 d-flex flex-wrap">
                    <strong className="me-2 text-sm">Modelo:</strong>
                    <span className="text-sm">{equipoDetalles.model}</span>
                  </li>
                  {equipoDetalles.remark && (
                    <li className="mb-2 d-flex flex-wrap">
                      <strong className="me-2 text-sm">Observación:</strong>
                      <span className="text-sm">{equipoDetalles.remark}</span>
                    </li>
                  )}
                  {equipoDetalles.design_static_pressure !== undefined && (
                    <li className="mb-2 d-flex flex-wrap">
                      <strong className="me-2 text-sm">Presión Estática:</strong>
                      <span className="text-sm">{equipoDetalles.design_static_pressure} Pa</span>
                    </li>
                  )}
                  {equipoDetalles.static_pressure_range && (
                    <li className="mb-2 d-flex flex-wrap">
                      <strong className="me-2 text-sm">Rango de Presión Estática:</strong>
                      <span className="text-sm">{equipoDetalles.static_pressure_range}</span>
                    </li>
                  )}
                  {equipoDetalles.airflow && (
                    <li className="mb-2 d-flex flex-wrap">
                      <strong className="me-2 text-sm">Flujo de Aire:</strong>
                      <span className="text-sm">{equipoDetalles.airflow}</span>
                    </li>
                  )}
                  {equipoDetalles.noise && (
                    <li className="mb-2 d-flex flex-wrap">
                      <strong className="me-2 text-sm">Ruido:</strong>
                      <span className="text-sm">{equipoDetalles.noise} dB</span>
                    </li>
                  )}
                  {equipoDetalles.weight !== undefined && (
                    <li className="mb-2 d-flex flex-wrap">
                      <strong className="me-2 text-sm">Peso:</strong>
                      <span className="text-sm">{equipoDetalles.weight} kg</span>
                    </li>
                  )}
                </ul>

                <button
                  className="btn btn-sm btn-outline-secondary mt-3"
                  onClick={() => setEquipoDetalles(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {showModal && datosEditados && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalles del Equipo</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="unitName" className="form-label">
                    Unit Name:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="unitName"
                    value={datosEditados.unitName}
                    onChange={(e) => handleInputChange(e, 'unitName')}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="remark" className="form-label">
                    Remark:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="remark"
                    value={datosEditados.remark || ''}
                    onChange={(e) => handleInputChange(e, 'remark')}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="model" className="form-label">
                    Model:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="model"
                    value={datosEditados.model}
                    onChange={(e) => handleInputChange(e, 'model')}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="dryBulbTempCooling" className="form-label">
                    Dry Bulb Temp. (Cooling):
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="dryBulbTempCooling"
                    value={datosEditados.dryBulbTempCooling || 0}
                    onChange={(e) => handleInputChange(e, 'dryBulbTempCooling')}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="wetBulbTempCooling" className="form-label">
                    Wet Bulb Temp. (Cooling):
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="wetBulbTempCooling"
                    value={datosEditados.wetBulbTempCooling || 0}
                    onChange={(e) => handleInputChange(e, 'wetBulbTempCooling')}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="relativeHumCooling" className="form-label">
                    Relative HUM (Cooling):
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="relativeHumCooling"
                    value={datosEditados.relativeHumCooling || 0}
                    onChange={(e) => handleInputChange(e, 'relativeHumCooling')}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="dryBulbTempHeating" className="form-label">
                    Dry Bulb Temp. (Heating):
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="dryBulbTempHeating"
                    value={datosEditados.dryBulbTempHeating || 0}
                    onChange={(e) => handleInputChange(e, 'dryBulbTempHeating')}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="totalCooling" className="form-label">
                    Total Cooling:
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="totalCooling"
                    value={datosEditados.totalCooling || 0}
                    onChange={(e) => handleInputChange(e, 'totalCooling')}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="heating" className="form-label">
                    Heating:
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="heating"
                    value={datosEditados.heating || 0}
                    onChange={(e) => handleInputChange(e, 'heating')}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="heightDifferenceToODU" className="form-label">
                    Height Difference to ODU:
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="heightDifferenceToODU"
                    value={datosEditados.heightDifferenceToODU || 0}
                    onChange={(e) => handleInputChange(e, 'heightDifferenceToODU')}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={enviarReporte}>
                  Añadir
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
      style={{ width: '100%',
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
              onClick={() => setEquiposSeleccionados((prev) => prev.filter((e) => e.id !== equipo.id))}
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
    className="btn btn-success"
    onClick={() => toast.success('Información enviada a la siguiente pantalla')}
    style={{
      marginTop: "0",
      marginLeft: "20vh"
    }}
  >
    Siguiente <i className="bi bi-arrow-right-circle ms-2"></i>
  </button>
</div>

    </div>
  );
};

export default UnidadInterior;
