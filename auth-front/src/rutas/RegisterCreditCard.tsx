import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";

export default function RegisterCreditCard() {
  const goTo = useNavigate();

  useEffect(() => {
    async function checkAccess() {
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
          goTo("/sing");
          return;
        }

        const response = await fetch(`${API_URL}/register-card?userId=${userId}`);

        if (response.status === 403) {
          goTo("/email-confirmation");
        } else if (!response.ok) {
          throw new Error("Error al verificar el acceso");
        }
      } catch (error) {
        console.error("Error verificando acceso:", error);
        goTo("/sing");
      }
    }

    checkAccess();
  }, [goTo]);

  return (
    <div>
      <h1>Registrar tarjeta de crédito</h1>
      <p>Completa este formulario para registrar tu tarjeta.</p>
      {/* Continúa con tu formulario */}
    </div>
  );
}
