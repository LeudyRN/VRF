import { useState } from "react";
import DefaultLayout from "../layout/DefaultLayout";
import { useAuth } from "../auth/AuthProvider";
import { Navigate } from "react-router-dom";

export default function Login() {
  const [usuario, setUsuario] = useState<string>("");
  const [contraseña, setContraseña] = useState<string>("");
  const auth = useAuth();

  if(auth.isAuthenticated){
    return <Navigate to="/Dashboard" />
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log({ usuario, contraseña });
  };

  return (
    <DefaultLayout>
      <form className="form" onSubmit={handleSubmit}>
        <h1>Iniciar Sesión</h1>

        <label htmlFor="usuario">Usuario</label>
        <input
          id="usuario"
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />

        <label htmlFor="contraseña">Contraseña</label>
        <input
          id="contraseña"
          type="password"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          required
        />

        <button type="submit">Iniciar Sesión</button>
      </form>
    </DefaultLayout>
  );
}
