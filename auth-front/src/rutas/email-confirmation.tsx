import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants"; // URL del backend

export default function EmailConfirmation() {
  const [errorResponse, setErrorResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function checkEmailVerified() {
      setLoading(true);
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
          setErrorResponse("No se pudo verificar el usuario. Por favor, regístrate nuevamente.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/user/status?userId=${userId}`);

        if (!response.ok) {
          throw new Error("Error al comunicarse con el servidor");
        }

        const data = await response.json();

        if (data.email_verified) {
          console.log("Correo confirmado. Redirigiendo...");
          navigate("/register-card");
        } else {
          console.log("Correo no confirmado. Verificando de nuevo...");
        }
      } catch (error) {
        console.error("Error verificando el correo:", error);
        setErrorResponse("Hubo un problema confirmando el correo. Por favor, inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    }

    const interval = setInterval(checkEmailVerified, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const resendVerificationEmail = async () => {
    setResendLoading(true);
    setResendMessage("");
    setErrorResponse("");

    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        setErrorResponse("No se encontró el usuario. Por favor, regístrate nuevamente.");
        setResendLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/user/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Error al reenviar el código de verificación.");
      }

      setResendMessage("Correo de verificación reenviado con éxito. Revisa tu bandeja de entrada o spam.");
    } catch (error) {
      console.error("Error reenviando el correo:", error);
      setErrorResponse("Hubo un problema reenviando el correo. Inténtalo nuevamente.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{ maxWidth: "500px", width: "100%", backgroundColor: "rgba(255, 255, 255, 0.9)" }}
      >
        <h3 className="text-center mb-4">Confirma tu correo</h3>
        <p className="text-center">
          Hemos enviado un enlace de confirmación a tu correo. Por favor, revisa tu bandeja de entrada o spam.
        </p>
        {loading && <p className="text-center">Verificando el estado del correo...</p>}
        {!!errorResponse && (
          <div className="alert alert-danger text-center" role="alert">
            {errorResponse}
          </div>
        )}
        {!!resendMessage && (
          <div className="alert alert-success text-center" role="alert">
            {resendMessage}
          </div>
        )}
        <div className="text-center mt-3">
          <button
            className="btn btn-primary"
            onClick={resendVerificationEmail}
            disabled={resendLoading}
          >
            {resendLoading ? "Reenviando..." : "Reenviar código"}
          </button>
        </div>
      </div>
    </div>
  );
}
