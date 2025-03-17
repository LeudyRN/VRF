import { Link } from "react-router-dom";

export default function EmailConfirmationFailed() {
    return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="card shadow-lg p-4 text-center" style={{ maxWidth: "500px", backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
                <h3 className="mb-3">Error al confirmar el correo</h3>
                <p>El enlace de confirmación es inválido o ya fue utilizado.</p>
                <Link to="/register" className="btn btn-danger">Volver al registro</Link>
            </div>
        </div>
    );
}
