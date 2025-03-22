import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";
import { useAuth } from "../auth/AuthProvider";
import CryptoJS from "crypto-js";


export default function RegisterCreditCard() {
  const navigate = useNavigate();
  const { accessToken, refreshToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCvv, setShowCvv] = useState(false);
  const [cardType, setCardType] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      const token = accessToken || (await refreshToken());
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/register-card`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Se asegura de que el token se envíe correctamente
          },
        });

        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!data.success) navigate("/dashboard", { replace: true });
      } catch {
        setError("No has completado el registro de usuario.");
      } finally {
        setLoading(false);
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
      if (!userId) return navigate("/login");

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
      if (!month || !year) {
        setError("La fecha de expiración no es válida.");
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
          cardNumber,  // Número de tarjeta
          expirationDate: formattedDate,  // Fecha de expiración
          cvv,  // CVV
          amount: 250,  // Monto
        }),
      }).then((res) => res.json());

      if (!paymentResponse.success) {
        setError("El pago no fue aprobado.");
        return;
      }

      // Encriptar CVV y enviar a Azul
      const encryptedCvv = CryptoJS.AES.encrypt(cvv, "secretKey").toString();

      const token = accessToken || (await refreshToken());
      if (!token) return navigate("/login");

      const azulPayload = {
        userId,
        amount: 250.0,
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

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="card shadow-lg p-4" style={{ maxWidth: "500px", width: "100%", backgroundColor: "rgba(255, 255, 255, 0.85)", color: "#fff" }}>
        <h2 className="text-center fw-bold mb-4" style={{color: "#000000"}}>PLAN DE 250 PESOS</h2>
        {error && <div className="alert alert-danger text-center">{error}</div>}
        <h3 className="text-center mb-4" style={{color: "#000000"}} >Registrar tarjeta de crédito</h3>
        <form onSubmit={handleRegisterCreditCard}>
          <div className="mb-3">
            <label htmlFor="cardNumber" className="form-label fw-bold" style={{color: "#000000"}} >Número de tarjeta</label>
            <input id="cardNumber" name="cardNumber" type="text" className="form-control" placeholder="1234 5678 9012 3456" required onChange={formatCardNumber} />
            {cardType && <small className="text-muted" style={{color: "#000000"}} >Tipo de tarjeta: {cardType}</small>}
          </div>
          <div className="mb-3">
            <label htmlFor="cardHolder" className="form-label fw-bold" style={{color: "#000000"}}>Nombre del titular</label>
            <input id="cardHolder" name="cardHolder" type="text" className="form-control" placeholder="Nombre en la tarjeta" required />
          </div>
          <div className="mb-3">
            <label htmlFor="expirationDate" className="form-label fw-bold" style={{color: "#000000"}} >Fecha de expiración</label>
            <input id="expirationDate" name="expirationDate" type="text" className="form-control" placeholder="MM/AA" pattern="^(0[1-9]|1[0-2])\/\d{2}$" required onChange={formatExpirationDate} />
          </div>
          <div className="mb-5">
            <label htmlFor="cvv" className="form-label fw-bold" style={{color: "#000000"}} >CVV</label>
            <div className="input-group">
              <input id="cvv" name="cvv" type={showCvv ? "text" : "password"} className="form-control" placeholder="Código de seguridad" required />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCvv(!showCvv)}>{showCvv ? "Ocultar" : "Mostrar"}</button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100">Continuar</button>
        </form>
      </div>
    </div>
  );
}
