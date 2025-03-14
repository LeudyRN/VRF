import { useState, useEffect } from "react";
import DefaultLayout from "../layout/DefaultLayout";
import { Navigate, useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";

export default function Sing() {
  const [nombre, setNombre] = useState<string>("");
  const [apellido, setApellido] = useState<string>("");
  const [genero, setGenero] = useState<string>("");
  const [usuario, setUsuario] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");
  const [contraseña, setContraseña] = useState<string>("");
  const [errorResponse, setErrorResponse] = useState<string>("");
  const [successResponse, setSuccessResponse] = useState<string>(""); // Nuevo estado para mensaje exitoso
  const [emailVerified, setEmailVerified] = useState<boolean>(false); // Verifica si el correo fue confirmado
  const goTo = useNavigate();

  useEffect(() => {
    if (errorResponse || successResponse) {
      const timer = setTimeout(() => {
        setErrorResponse("");
        setSuccessResponse("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorResponse, successResponse]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

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
        const { userId } = data;

        // Verificar que el backend devolvió un userId y proceder normalmente
        if (userId) {
          localStorage.setItem("userId", userId); // Guarda el ID del usuario
          goTo("/email-confirmation"); // Redirige al siguiente paso
          setSuccessResponse("Registro exitoso. Revisa tu correo para confirmar tu cuenta.");
          setErrorResponse(""); // Limpia los errores previos
          setNombre("");
          setApellido("");
          setGenero("");
          setUsuario("");
          setCorreo("");
          setContraseña("");
        } else {
          // Manejo en caso de que no se reciba userId
          setErrorResponse("Error inesperado al registrar. Intenta nuevamente.");
        }
      } else {
        const alert: { error?: string } = await response.json();
        setErrorResponse(alert.error || "Ocurrió un error inesperado.");
        setSuccessResponse(""); // Limpia mensajes de éxito previos
      }

    } catch (error) {
      setErrorResponse("Error de conexión con el servidor.");
    }
  }

  useEffect(() => {
    async function checkEmailVerified() {
      try {
        const userId = localStorage.getItem("userId");

        // Si no existe userId, detén el proceso y no escribas en la consola.
        if (!userId) {
          return; // Simplemente sal de la función sin hacer nada
        }

        // Si existe userId, procede a hacer la solicitud
        const response = await fetch(`${API_URL}/user/status?userId=${userId}`);
        const data = await response.json();

        if (data.email_verified) {
          setEmailVerified(true); // Cambia el estado a verdadero si está verificado
        } else {
          console.log("El correo aún no está verificado."); // Mensaje de estado normal
        }
      } catch (error) {
        console.error("Error verificando el correo:", error); // Manejo de errores reales
      }
    }

    checkEmailVerified();
  }, []);

  useEffect(() => {
    if (emailVerified) {
      goTo("/register-card");
    }
  }, [emailVerified, goTo]);

  return (
    <DefaultLayout>
      {!!errorResponse && <div className="error-alert">{errorResponse}</div>}
      {!!successResponse && <div className="success-alert">{successResponse}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <h1>Regístrate</h1>

        <label htmlFor="nombre">Nombre</label>
        <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

        <label htmlFor="apellido">Apellido</label>
        <input id="apellido" type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required />

        <label htmlFor="usuario">Usuario</label>
        <input id="usuario" type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} required />

        <label htmlFor="correo">Correo</label>
        <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />

        <label htmlFor="contraseña">Contraseña</label>
        <input id="contraseña" type="password" value={contraseña} onChange={(e) => setContraseña(e.target.value)} required />

        <label htmlFor="genero">Género</label>
        <select id="genero" value={genero} onChange={(e) => setGenero(e.target.value)} required>
          <option value="">Seleccione su género</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>

        <button type="submit">Siguiente</button>
      </form>
    </DefaultLayout>
  );
}
