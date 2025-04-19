import { Link } from "react-router-dom";
import fondo from "../assets/fondo.jpg";

export default function EmailConfirmationSuccess() {
    return (
        <div className="d-flex align-items-center justify-content-center vh-100"
            style={{
                backgroundImage: `url(${fondo})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}

        >
            <div className="card shadow-lg p-4 text-center" style={{ maxWidth: "50vh", backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
                <h3 className="mb-3">¡Correo confirmado con éxito!</h3>
                <p>Tu cuenta ha sido verificada correctamente. Ahora puedes continuar con el registro de tu tarjeta para completar tu cuenta.</p>
                <div className="mt-3">
                    <Link to="/register-card" className="btn btn-primary">Ir al siguiente paso</Link>
                </div>
            </div>
        </div>
    );
}