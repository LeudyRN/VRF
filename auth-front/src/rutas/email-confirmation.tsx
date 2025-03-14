import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";

export default function EmailConfirmation() {
  const [emailVerified, setEmailVerified] = useState(false);
  const [errorResponse, setErrorResponse] = useState("");
  const goTo = useNavigate();

  useEffect(() => {
    async function checkEmailVerified() {
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
          setErrorResponse("No se pudo verificar el usuario. Por favor, regístrate nuevamente.");
          return;
        }

        const response = await fetch(`${API_URL}/user/status?userId=${userId}`);
        const data = await response.json();

        if (data.email_verified) {
          setEmailVerified(true);
          goTo("/register-card");
        }
      } catch (error) {
        console.error("Error verificando el correo:", error);
        setErrorResponse("Error al verificar el correo. Por favor, intenta nuevamente.");
      }
    }

    const interval = setInterval(checkEmailVerified, 5000);
    return () => clearInterval(interval);
  }, [goTo]);

  return (
    <div>
      <h1>Confirma tu correo</h1>
      <p>Hemos enviado un enlace de confirmación a tu correo. Por favor, revisa tu bandeja de entrada o spam.</p>
      {!!errorResponse && <div className="error-alert">{errorResponse}</div>}
    </div>
  );
}
