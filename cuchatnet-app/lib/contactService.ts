import { apiFetch } from "./api";

export async function getContacts(userId: number) {
  return apiFetch(`contactos/${userId}`);
}