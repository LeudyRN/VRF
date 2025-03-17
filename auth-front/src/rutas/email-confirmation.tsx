import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants"; // URL del backend

export default function EmailConfirmation() {
  const [errorResponse, setErrorResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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

  // Función para reenviar el correo de confirmación
  async function resendConfirmationEmail() {
    setResendLoading(true);
    setErrorResponse("");
    setEmailSent(false);

    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        setErrorResponse("No se pudo reenviar el correo. Inténtalo más tarde.");
        setResendLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/user/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al reenviar el correo.");
      }

      setEmailSent(true);
    } catch (error) {
      console.error("Error al reenviar el correo:", error);
      setErrorResponse("No se pudo reenviar el correo. Inténtalo más tarde.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{ backgroundSize: "cover", backgroundPosition: "center" }}
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
        {emailSent && (
          <div className="alert alert-success text-center" role="alert">
            Correo de confirmación reenviado con éxito.
          </div>
        )}
        <button
          className="btn btn-primary w-100 mt-3"
          onClick={resendConfirmationEmail}
          disabled={resendLoading}
        >
          {resendLoading ? "Reenviando..." : "Reenviar correo de confirmación"}
        </button>
      </div>
    </div>
  );
}
