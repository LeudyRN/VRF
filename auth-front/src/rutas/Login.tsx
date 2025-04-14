import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import fondo from "../assets/fondo.jpg";

export default function Login() {
  const [usuario, setUsuario] = useState<string>("");
  const [contraseña, setContraseña] = useState<string>("");
  const [mostrarContraseña, setMostrarContraseña] = useState<boolean>(false);
  const [errorResponse, setErrorResponse] = useState<string>("");
  const navigate = useNavigate();
  const auth = useAuth();

  // Cambiar visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setMostrarContraseña(!mostrarContraseña);
  };

  // Validar entrada antes del envío
  const validateInput = (): boolean => {
    if (!usuario.trim()) {
      setErrorResponse("El campo usuario es obligatorio.");
      return false;
    }
    if (contraseña.length < 8) {
      setErrorResponse("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
    return true;
  };

  // Función para manejar inicio de sesión
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateInput()) {
      return;
    }

    try {
      const response = await fetch("http://localhost:3100/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario, contraseña }),
      });

      if (response.ok) {
        const json = await response.json();

        localStorage.setItem("accessToken", json.accessToken);
        localStorage.setItem("refreshToken", json.refreshToken);

        if (json.redirectToRegisterCard === true) {
          navigate("/register-card");
          return;
        }

        auth.login(json.accessToken, json.refreshToken);
        navigate("/dashboard");
      } else {
        setErrorResponse("Usuario o contraseña incorrectos.");
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorResponse("Hubo un problema con el servidor. Inténtalo de nuevo.");
      } else {
        setErrorResponse("Error desconocido. Inténtalo de nuevo.");
      }
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        width: "100vw",
        height: "100vh",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{
          maxWidth: "400px", // Aumenté el maxWidth para pantallas más grandes
          width: "90%", // Permite que la tarjeta se ajuste en pantallas pequeñas
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "10px", // Un radio de borde más común y suave
          overflow: "hidden",
        }}
      >
        <h3
          className="text-center mt-3"
          style={{
            fontSize: "2.2rem", // Un poco más grande para destacar
            fontWeight: "bold",
            color: "var(--bs-primary)", // Usando la variable de color primario de Bootstrap
            textTransform: "uppercase",
            letterSpacing: "1px", // Ligeramente reducido para mejor legibilidad
            padding: "1.5rem", // Un poco más de espacio interno
            marginBottom: "1.5rem", // Más espacio debajo del título
          }}
        >
          Portal de Sistemas VRF
        </h3>

        <form onSubmit={handleSubmit}>
          {errorResponse && (
            <div className="alert alert-danger text-center mb-3" role="alert"> {/* Añadí mb-3 */}
              {errorResponse}
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="usuario" className="form-label fw-bold">
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              className="form-control"
              placeholder="Ingresa tu usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="contraseña" className="form-label fw-bold">
              Contraseña
            </label>
            <div className="input-group">
              <input
                id="contraseña"
                type={mostrarContraseña ? "text" : "password"}
                className="form-control"
                placeholder="Ingresa tu contraseña"
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
          <div className="d-flex justify-content-center">
            <button type="submit" className="btn btn-primary w-75"> {/* Aumenté el ancho del botón */}
              Iniciar Sesión
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-decoration-none text-primary">
            ¿Olvidaste tu usuario o contraseña?
          </Link>
          <div className="mt-2">
            <Link to="/sing" className="text-decoration-none text-primary">
              ¿No tienes cuenta? Regístrate aquí.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}