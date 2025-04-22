import { createContext, useContext, useState, useEffect, ReactNode } from "react";

import { Proyecto } from "../rutas/Dashboard";

interface ProyectoContextType {
  proyectoActivo: Proyecto | null;
  setProyectoActivo: (proyecto: Proyecto | null) => void;
}

interface ProyectoContextType {
  proyectoActivo: Proyecto | null;
  setProyectoActivo: (proyecto: Proyecto | null) => void;
}

const ProyectoContext = createContext<ProyectoContextType | undefined>(undefined);

interface ProyectoProviderProps {
  children: ReactNode;
}

export const ProyectoProvider = ({ children }: ProyectoProviderProps) => {
  const [proyectoActivo, setProyectoActivo] = useState<Proyecto | null>(null);

  useEffect(() => {
    const storedProyecto = localStorage.getItem("proyectoActivo");
    console.log("📌 Proyecto en localStorage al iniciar:", storedProyecto);

    if (storedProyecto) {
      const parsedProyecto = JSON.parse(storedProyecto);
      setProyectoActivo(parsedProyecto);
      console.log("✅ Estado restaurado en ProyectoProvider:", parsedProyecto);
    }
  }, []);

  // 🚀 Guardar automáticamente cada cambio en `localStorage`
  useEffect(() => {
    console.log("🔄 Proyecto activo actualizado:", proyectoActivo);

    if (proyectoActivo) {
      const proyectoSeguro = {
        ...proyectoActivo,
        data: proyectoActivo.data ?? {}, // 🔹 Si `data` es undefined, usa un objeto vacío `{}`.
      };

      localStorage.setItem("proyectoActivo", JSON.stringify(proyectoSeguro));
    } else {
      localStorage.removeItem("proyectoActivo");
    }
  }, [proyectoActivo]);

  return (
    <ProyectoContext.Provider value={{ proyectoActivo, setProyectoActivo }}>
      {children}
    </ProyectoContext.Provider>
  );
};

export const useProyecto = () => {
  const context = useContext(ProyectoContext);
  if (!context) {
    throw new Error("useProyecto debe ser usado dentro de un ProyectoProvider.");
  }
  return context;
};