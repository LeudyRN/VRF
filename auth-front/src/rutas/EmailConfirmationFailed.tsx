import { Link } from "react-router-dom";

export default function EmailConfirmationFailed() {
    return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="card shadow-lg p-4 text-center" style={{ maxWidth: "500px", backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
                <h3 className="mb-3">Error al confirmar el correo</h3>
                <p>El enlace de confirmación es inválido, ya fue utilizado, o ha caducado.</p>
                <p>Si el problema persiste, puedes reenviar un nuevo enlace de confirmación desde la página de verificación.</p>
                <div className="mt-3">
                    <Link to="/sing" className="btn btn-danger me-2">Volver al registro</Link>
                    <Link to="/resend-confirmation" className="btn btn-primary">Reenviar enlace</Link>
                </div>
            </div>
        </div>
    );
}