// lib/userService.ts
import { apiFetch } from "./api";

// lib/userService.ts
export async function getUser(id: number | string) {
  if (!id || id === "undefined") {
    console.error("Se intentó llamar a getUser con un ID no válido");
    // Retornamos un objeto quemado para que la app no explote si es simulado
    return { id: 1, nombre: "Usuario Temporal", telefono: "0000" };
  }
  
  const response = await fetch(`https://localhost:7086/api/usuarios/${id}`);
  if (!response.ok) throw new Error("Error al obtener usuario");
  return response.json();
}

export async function getAllUsers() {
  return apiFetch(`usuarios`);
}