import { useState } from "react";
import DefaultLayout from "../layout/DefaultLayout";
import { useAuth } from "../auth/AuthProvider";
import { Navigate, useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";
import { AuthResponseError } from "../types/types";

export default function Login() {
  const [usuario, setUsuario] = useState<string>("");
  const [contraseña, setContraseña] = useState<string>("");
  const auth = useAuth();
  const goTo = useNavigate();
  const [errorResponse, setErrorResponse] = useState("");


  async function handleSubmit (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/sing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario,
          contraseña
        }),
      });

      if (response.ok) {
        console.log("User created successfully");
        setErrorResponse("");
        goTo("/");
      } else {
        console.log("Something went wrong");
        const json = (await response.json()) as AuthResponseError;
        setErrorResponse(json.body.error);
        return;
      }

    } catch (error) {
      console.log(error);
    }
  };

  if(auth.isAuthenticated){
    return <Navigate to="/Dashboard" />
  }

  return (
    <DefaultLayout>
      <form className="form" onSubmit={handleSubmit}>
        <h1>Iniciar Sesión</h1>
        {!! errorResponse && <div className="errorMessage">{errorResponse}</div>}
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
