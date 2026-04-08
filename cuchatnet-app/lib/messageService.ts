import { apiFetch } from "./api";

export async function getMessages(chatId: string) {
  return apiFetch(`mensajes/${chatId}`);
}

export async function sendMessage(data: any) {
  return apiFetch(`mensajes`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}