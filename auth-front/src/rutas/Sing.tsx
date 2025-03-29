import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";
import fondo from "../assets/fondo.jpg";

export default function Sing() {
  const [nombre, setNombre] = useState<string>("");
  const [apellido, setApellido] = useState<string>("");
  const [genero, setGenero] = useState<string>("");
  const [usuario, setUsuario] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");
  const [contraseña, setContraseña] = useState<string>("");
  const [mostrarContraseña, setMostrarContraseña] = useState<boolean>(false); // Mostrar/ocultar contraseña
  const [errorResponse, setErrorResponse] = useState<string>("");
  const [successResponse, setSuccessResponse] = useState<string>("");
  const navigate = useNavigate();

  // Limpiar mensajes de éxito y error automáticamente después de 5 segundos
  useEffect(() => {
    if (errorResponse || successResponse) {
      const timer = setTimeout(() => {
        setErrorResponse("");
        setSuccessResponse("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorResponse, successResponse]);

  // Validar entrada antes del envío
  const validateInput = (): boolean => {
    if (!nombre || !apellido || !usuario || !correo || !contraseña || !genero) {
      setErrorResponse("Todos los campos son obligatorios.");
      return false;
    }

    if (contraseña.length < 8) {
      setErrorResponse("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }

    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(correo)) {
      setErrorResponse("El formato del correo es inválido.");
      return false;
    }

    if (!["masculino", "femenino", "otro"].includes(genero)) {
      setErrorResponse("Selecciona un género válido.");
      return false;
    }

    return true;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateInput()) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/sing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          apellido,
          genero,
          usuario,
          correo,
          contraseña,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const { userId } = data; // Obtiene el ID del usuario

        if (userId) {
          localStorage.setItem("userId", userId);
          navigate("/email-confirmation"); // Redirige a la pantalla de confirmación
          setSuccessResponse("Registro exitoso. Revisa tu correo para confirmar tu cuenta.");
          setNombre("");
          setApellido("");
          setGenero("");
          setUsuario("");
          setCorreo("");
          setContraseña("");
        } else {
          setErrorResponse("Error inesperado al registrar. Intenta nuevamente.");
        }
      } else {
        const alert: { error?: string } = await response.json();
        setErrorResponse(alert.error || "Ocurrió un error inesperado.");
      }
    } catch (error) {
      setErrorResponse(`Error de conexión con el servidor: ${(error as Error).message}`);
    }
  }

  // Alternar visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setMostrarContraseña(!mostrarContraseña);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{ maxWidth: "35vh", width: "100%", backgroundColor: "rgba(255, 255, 255, 0.9)" }}
      >
        <p className="fw-bold mb-5">PASO 1 DE 3</p>
        <h3 className="text-center mb-5">Crea tu cuenta</h3>
        {errorResponse && (
          <div className="alert alert-danger text-center" role="alert">
            {errorResponse}
          </div>
        )}
        {successResponse && (
          <div className="alert alert-success text-center" role="alert">
            {successResponse}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label fw-bold">Nombre</label>
            <input
              id="nombre"
              type="text"
              className="form-control"
              placeholder="Ingresa tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="apellido" className="form-label fw-bold">Apellido</label>
            <input
              id="apellido"
              type="text"
              className="form-control"
              placeholder="Ingresa tu apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="usuario" className="form-label fw-bold">Usuario</label>
            <input
              id="usuario"
              type="text"
              className="form-control"
              placeholder="Crea tu usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="correo" className="form-label fw-bold">Correo</label>
            <input
              id="correo"
              type="email"
              className="form-control"
              placeholder="Ingresa tu correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="contraseña" className="form-label fw-bold">Contraseña</label>
            <div className="input-group">
              <input
                id="contraseña"
                type={mostrarContraseña ? "text" : "password"}
                className="form-control"
                placeholder="Crea una contraseña"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={togglePasswordVisibility}
                aria-label="Mostrar/Ocultar Contraseña"
              >
                <i className={mostrarContraseña ? "bi bi-eye-slash" : "bi bi-eye"}></i>
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="genero" className="form-label fw-bold">Género</label>
            <select
              id="genero"
              className="form-select mb-3"
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              required
            >
              <option value="">Seleccione su género</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-100 ">Siguiente</button>

        </form>
      </div>
    </div>
  );
}