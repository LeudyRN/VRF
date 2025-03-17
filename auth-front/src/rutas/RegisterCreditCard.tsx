import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";
import CryptoJS from "crypto-js"; // Importar CryptoJS para el cifrado

export default function RegisterCreditCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
          console.error("Usuario no encontrado en localStorage. Redirigiendo...");
          navigate("/sing");
          return;
        }

        // Verificar si el usuario tiene acceso para registrar la tarjeta
        const response = await fetch(`${API_URL}/register-card?userId=${userId}`);

        if (response.status === 403) {
          console.error("Correo no confirmado. Redirigiendo a /email-confirmation");
          navigate("/email-confirmation");
        } else if (!response.ok) {
          throw new Error("Error al verificar el acceso");
        }

        const data = await response.json();

        if (data.tarjetaRegistrada) {
          navigate("/dashboard"); // Redirige al dashboard si ya tiene tarjeta
        }
      } catch (err) {
        console.error("Error verificando acceso:", err);
        setError("Hubo un problema al verificar el acceso. Inténtalo nuevamente.");
        navigate("/sing"); // Redirige al registro si ocurre un problema grave
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [navigate]);

  async function handleRegisterCard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("Usuario no encontrado en el sistema.");
        return;
      }

      // Datos del formulario
      const form = e.currentTarget;
      const cardNumber = (form.elements.namedItem("cardNumber") as HTMLInputElement).value;
      const cardHolder = (form.elements.namedItem("cardHolder") as HTMLInputElement).value;
      const expirationDate = (form.elements.namedItem("expirationDate") as HTMLInputElement).value;
      const cvv = (form.elements.namedItem("cvv") as HTMLInputElement).value;

      // Validar formato de fecha MM/AA
      const [month, year] = expirationDate.split("/");
      if (!month || !year || month.length !== 2 || year.length !== 2 || isNaN(Number(month)) || isNaN(Number(year))) {
        setError("Formato de fecha inválido. Usa MM/AA.");
        return;
      }

      // Convertir fecha a formato YYYY-MM-DD
      const formattedDate = `20${year}-${month}-01`;

      // Cifrar datos sensibles
      const encryptedCardNumber = CryptoJS.AES.encrypt(cardNumber, "clave_secreta").toString();
      const encryptedCvv = CryptoJS.AES.encrypt(cvv, "clave_secreta").toString();

      const response = await fetch(`${API_URL}/register-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          cardNumber: encryptedCardNumber,
          cardHolder,
          expiryDate: formattedDate,
          cvv: encryptedCvv,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al registrar la tarjeta.");
      }

      // Tarjeta registrada con éxito
      navigate("/dashboard");
    } catch (err) {
      console.error("Error registrando la tarjeta:", err);
      setError("Hubo un problema al registrar la tarjeta. Inténtalo nuevamente.");
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="card shadow-lg p-4" style={{ maxWidth: "500px", width: "100%", backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
        <h3 className="text-center mb-4">Registrar tarjeta de crédito</h3>
        {error && (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleRegisterCard}>
          <div className="mb-3">
            <label htmlFor="cardNumber" className="form-label fw-bold">
              Número de tarjeta
            </label>
            <input
              id="cardNumber"
              name="cardNumber"
              type="text"
              className="form-control"
              placeholder="Ingresa tu número de tarjeta"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="cardHolder" className="form-label fw-bold">
              Nombre del titular
            </label>
            <input
              id="cardHolder"
              name="cardHolder"
              type="text"
              className="form-control"
              placeholder="Ingresa el nombre del titular"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="expirationDate" className="form-label fw-bold">
              Fecha de expiración
            </label>
            <input
              id="expirationDate"
              name="expirationDate"
              type="text"
              className="form-control"
              placeholder="MM/AA"
              pattern="^(0[1-9]|1[0-2])\/\d{2}$" // Validar formato MM/AA
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="cvv" className="form-label fw-bold">
              CVV
            </label>
            <input
              id="cvv"
              name="cvv"
              type="password"
              className="form-control"
              placeholder="Código de seguridad"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
}
