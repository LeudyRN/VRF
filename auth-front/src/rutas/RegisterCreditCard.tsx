import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";
import { useAuth } from "../auth/AuthProvider";
import CryptoJS from "crypto-js";
import fondo from "../assets/fondo.jpg";

export default function RegisterCreditCard() {
  const navigate = useNavigate();
  const { accessToken, refreshToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCvv, setShowCvv] = useState(false);
  const [cardType, setCardType] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      setLoading(true); // Mostrar estado de carga
      const token = accessToken || (await refreshToken());

      if (!token) {
        navigate("/login");
        return;
      }

      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("No se encuentra el identificador de usuario.");
        navigate("/login");
        return;
      }

      try {
        // Llamada a la API para verificar el estado del registro
        const response = await fetch(`${API_URL}/register-card`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al registrar la tarjeta.");
        }

        const data = await response.json();
        if (!data.success) navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error(error);
        setError("No has completado el registro de usuario.");
      } finally {
        setLoading(false); // Finaliza el estado de carga
      }
    }

    checkAccess();
  }, [navigate, accessToken, refreshToken]);

  const detectCardType = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\D/g, "");
    const patterns: { [key: string]: RegExp } = {
      Visa: /^4/,
      Mastercard: /^5[1-5]/,
      Amex: /^3[47]/,
      Discover: /^6/,
    };
    return Object.keys(patterns).find((type) => patterns[type].test(cleanNumber)) || null;
  };

  const formatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 16);
    value = value.replace(/(.{4})/g, "$1 ").trim();
    e.target.value = value;
    setCardType(detectCardType(value));
  };

  const formatExpirationDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (value.length >= 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    e.target.value = value;
  };

  async function handleRegisterCreditCard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("userId es null. Redirigiendo a login...");
        navigate("/login");
        return;
      }

      const form = e.currentTarget;
      const cardNumber = (form.elements.namedItem("cardNumber") as HTMLInputElement).value.replace(/\s/g, "");
      const cardHolder = (form.elements.namedItem("cardHolder") as HTMLInputElement).value.trim();
      const expirationDate = (form.elements.namedItem("expirationDate") as HTMLInputElement).value;
      const cvv = (form.elements.namedItem("cvv") as HTMLInputElement).value.trim();

      // Verificar que los datos no estén vacíos
      if (!cardNumber || !cardHolder || !expirationDate || !cvv) {
        setError("Todos los campos son obligatorios.");
        return;
      }

      const [month, year] = expirationDate.split("/");
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        setError("Fecha de expiración inválida.");
        return;
      }
      const formattedDate = `20${year}-${month}-01`;
      // Solicitud al servidor para procesar el pago
      const paymentResponse = await fetch(`${API_URL}/payment/processPayment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount: 195,         // Monto fijo
          cardNumber,         // Numero de T.
          cardHolder,          // Nombre del titular
          expiryDate: formattedDate, // Fecha en formato YYYY-MM-DD
          cvv,
        }),

      }).then((res) => res.json());

      console.log("Payload enviado al backend:", paymentResponse);


      console.log(localStorage.getItem("userId"));

      if (!paymentResponse.success) {
        setError("El pago no fue aprobado.");
        return;
      }

      // Encriptar CVV y enviar a Azul
      const encryptedCvv = CryptoJS.AES.encrypt(cvv, "secretKey").toString();

      const token = accessToken || (await refreshToken());
      if (!token) return navigate("/login");

      const storedUserId = localStorage.getItem("userId");

      if (!storedUserId) {
        setError("No se encontró el usuario. Intenta registrarte nuevamente.");
        return;
      }

      const azulPayload = {
        userId: storedUserId,
        amount: 195,
        cardNumber,
        cardHolder,
        expiryDate: formattedDate,
        cvv: encryptedCvv,
      };

      const response = await fetch(`${API_URL}/azul/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(azulPayload),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl; // Redirigir a Azul
      } else {
        setError("Error al procesar el pago.");
      }
    } catch {
      setError("Hubo un problema al registrar la tarjeta.");
    }
  }

  if (loading)
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <p>Cargando...</p>
      </div>
    );

    if (loading)
      return (
        <div className="d-flex align-items-center justify-content-center vh-100">
          <p>Cargando...</p>
        </div>
      );

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
          style={{
            maxWidth: "30vh",
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: "2vh",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Paso y título */}
          <p className="fw-bold mb-5">PASO 3 DE 3</p>
          <h1 className="mb-3 fw-bold">Configura tu tarjeta de crédito o débito</h1>

          {/* Mensaje de error */}
          {error && <div className="alert alert-danger text-center mb-5">{error}</div>}

          {/* Formulario */}
          <form onSubmit={handleRegisterCreditCard}>
            <div className="mb-3">
              <label htmlFor="cardNumber" className="form-label fw-bold">
                Número de tarjeta
              </label>
              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                className="form-control"
                placeholder="1234 5678 9012 3456"
                required
                onChange={formatCardNumber}
              />
              {cardType && <small className="text-muted">Tipo de tarjeta: {cardType}</small>}
            </div>

            <div className="mb-3 d-flex justify-content-between gap-3">
              <div style={{ flex: 1 }}>
                <label htmlFor="expirationDate" className="form-label fw-bold">
                  Fecha de vencimiento
                </label>
                <input
                  id="expirationDate"
                  name="expirationDate"
                  type="text"
                  className="form-control"
                  placeholder="MM/AA"
                  pattern="^(0[1-9]|1[0-2])\/\d{2}$"
                  required
                  onChange={formatExpirationDate}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="cvv" className="form-label fw-bold">
                  CVV
                </label>
                <div className="input-group">
                  <input
                    id="cvv"
                    name="cvv"
                    type={showCvv ? "text" : "password"}
                    className="form-control"
                    placeholder="Código de seguridad"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCvv(!showCvv)}
                  >
                    {showCvv ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="cardHolder" className="form-label fw-bold">
                Nombre en la tarjeta
              </label>
              <input
                id="cardHolder"
                name="cardHolder"
                type="text"
                className="form-control"
                placeholder="Nombre completo"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold">
              Iniciar membresía
            </button>
          </form>

          {/* Plan debajo del formulario */}
          <div
            className="mt-3 p-2 text-center"
            style={{
              border: "1px solid #ddd",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <p className="fw-bold mb-0">195 US</p>
            <p className="text-muted">Plan actual</p>
          </div>
        </div>
      </div>
    );
  }