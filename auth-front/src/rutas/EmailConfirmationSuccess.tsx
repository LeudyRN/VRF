import { Link } from "react-router-dom";

export default function EmailConfirmationSuccess() {
    return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="card shadow-lg p-4 text-center" style={{ maxWidth: "500px", backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
                <h3 className="mb-3">¡Correo confirmado con éxito!</h3>
                <p>Tu cuenta ha sido verificada correctamente. Ahora vamos al siguiente paso!.</p>
                <Link to="/register-card" className="btn btn-primary">Ir al siguiente paso</Link>
            </div>
        </div>
    );
}
