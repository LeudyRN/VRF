import { FormEvent, useState } from "react";
import { Project } from "../types";

export function ProjectDashboard({ projects, projectId, setProjectId, createProject }: { projects: Project[]; projectId: string; setProjectId: (id: string) => void; createProject: (name: string) => void; }) {
  const [name, setName] = useState("New HVAC Project");
  const submit = (e: FormEvent) => { e.preventDefault(); createProject(name); };
  return <section><h3>Projects</h3><form onSubmit={submit}><input value={name} onChange={(e)=>setName(e.target.value)} /><button>Create</button></form><select value={projectId} onChange={(e)=>setProjectId(e.target.value)}><option value="">Select project</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></section>;
}
