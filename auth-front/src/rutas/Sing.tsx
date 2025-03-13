import { useState } from "react";
import DefaultLayout from "../layout/DefaultLayout";
import { useAuth } from "../auth/AuthProvider";
import { Navigate } from "react-router-dom";
import { API_URL } from "../auth/constants";

export default function Sing() {
  const [nombre, setNombre] = useState<string>("");
  const [apellido, setapellido] = useState<string>("");
  const [genero, setgenero] = useState<string>("");
  const [usuario, setUsuario] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");
  const [contraseña, setContraseña] = useState<string>("");


 async function handleSubmit (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/sing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre,
          apellido,
          genero,
          usuario,
          correo,
          contraseña
        }),
      });

      if (response.ok) {
        console.log("User created successfully");
      } else {console.log("Something went wrong")}

    } catch (error) {
      console.log(error);
    }
  };

  const auth = useAuth();

  if(auth.isAuthenticated){
    return <Navigate to="/Dashboard" />
  }

  return (
    <DefaultLayout>
      <form className="form" onSubmit={handleSubmit}>
      <h1>Regístrate</h1>

        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <label htmlFor="apellido">Apellido</label>
        <input
          id="apellido"
          type="text"
          value={apellido}
          onChange={(e) => setapellido(e.target.value)}
          required
        />

        <label htmlFor="usuario">Usuario</label>
        <input
          id="usuario"
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />

        <label htmlFor="correo">Correo</label>
        <input
          id="correo"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
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

        <label htmlFor="genero">Género</label>
        <select
          id="genero"
          value={genero}
          onChange={(e) => setgenero(e.target.value)}
          required
        >
          <option value="">Seleccione su género</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>


        <button type="submit">Siguiente</button>
      </form>
    </DefaultLayout>
  );
}
