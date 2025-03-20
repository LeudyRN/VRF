import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";
import CryptoJS from "crypto-js";
import { useAuth } from "../auth/AuthProvider";

export default function RegisterCreditCard() {
  const navigate = useNavigate();
  const { accessToken, refreshToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCvv, setShowCvv] = useState(false);
  const [cardType, setCardType] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      let token = accessToken || (await refreshToken());
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/verify-access`, {
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

  const isValidCardNumber = (cardNumber: string) => {
    const digits = cardNumber.replace(/\D/g, "").split("").reverse().map(Number);
    const checksum = digits.reduce((sum, digit, idx) => sum + (idx % 2 ? (digit * 2 > 9 ? digit * 2 - 9 : digit * 2) : digit), 0);
    return checksum % 10 === 0;
  };

  const detectCardType = (cardNumber: string) => {
    const patterns: { [key: string]: RegExp } = {
      Visa: /^4/,
      Mastercard: /^5[1-5]/,
      Amex: /^3[47]/,
      Discover: /^6/,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber.replace(/\D/g, ""))) return type;
    }
    return null;
  };

  const formatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(.{4})/g, "$1 ").trim();
    e.target.value = value;
    setCardType(detectCardType(value)); // Detecta y actualiza el tipo de tarjeta
  };

  const formatExpirationDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (value.length >= 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    e.target.value = value;
  };

  async function handleRegisterCard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return navigate("/login");

      const form = e.currentTarget;
      const cardNumber = (form.elements.namedItem("cardNumber") as HTMLInputElement).value.replace(/\s/g, "");
      const cardHolder = (form.elements.namedItem("cardHolder") as HTMLInputElement).value.trim();
      const expirationDate = (form.elements.namedItem("expirationDate") as HTMLInputElement).value;
      const cvv = (form.elements.namedItem("cvv") as HTMLInputElement).value.trim();

      if (!isValidCardNumber(cardNumber)) {
        setError("Número de tarjeta inválido.");
        return;
      }

      const [month, year] = expirationDate.split("/");
      if (!month || !year || month.length !== 2 || year.length !== 2 || isNaN(Number(month)) || isNaN(Number(year))) {
        setError("Formato de fecha inválido. Usa MM/AA.");
        return;
      }

      const formattedDate = `20${year}-${month}-01`;
      if (!cardHolder || !cvv) {
        setError("Todos los campos son obligatorios.");
        return;
      }

      const secretKey = "clave_secreta";
      const encryptedCardNumber = CryptoJS.AES.encrypt(cardNumber, secretKey).toString();
      const encryptedCvv = CryptoJS.AES.encrypt(cvv, secretKey).toString();

      const response = await fetch(`${API_URL}/register-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // Envía el token correctamente
        },
        body: JSON.stringify({ userId, cardNumber: encryptedCardNumber, cardHolder, expiryDate: formattedDate, cvv: encryptedCvv }),
      });

      if (!response.ok) throw new Error();

      navigate("/dashboard");
    } catch {
      setError("Hubo un problema al registrar la tarjeta.");
    }
  }

  if (loading) return <div className="d-flex align-items-center justify-content-center vh-100"><p>Cargando...</p></div>;

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="card shadow-lg p-4" style={{ maxWidth: "500px", width: "100%", backgroundColor: "rgba(0, 0, 0, 0.85)", color: "#fff" }}>
        <h2 className="text-center fw-bold mb-4" style={{ marginBottom: "3rem" }}>PLAN DE 250 PESOS</h2>
        <h3 className="text-center mb-4" style={{ marginBottom: "2rem" }}>Registrar tarjeta de crédito</h3>
        {error && <div className="alert alert-danger text-center" role="alert">{error}</div>}
        <form onSubmit={handleRegisterCard}>
          <div className="mb-3">
            <label htmlFor="cardNumber" className="form-label fw-bold">Número de tarjeta</label>
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
          <div className="mb-3">
            <label htmlFor="cardHolder" className="form-label fw-bold">Nombre del titular</label>
            <input id="cardHolder" name="cardHolder" type="text" className="form-control" placeholder="Nombre en la tarjeta" required />
          </div>
          <div className="mb-3">
            <label htmlFor="expirationDate" className="form-label fw-bold">Fecha de expiración</label>
            <input id="expirationDate" name="expirationDate" type="text" className="form-control" placeholder="MM/AA" pattern="^(0[1-9]|1[0-2])\/\d{2}$" required onChange={formatExpirationDate} />
          </div>
          <div className="mb-3">
            <label htmlFor="cvv" className="form-label fw-bold">CVV</label>
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
          <button type="submit" className="btn btn-primary w-100">Registrar</button>
        </form>
      </div>
    </div>
  );
}
