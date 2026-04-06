import { apiFetch } from "./api";

/**
 * Envía el código de verificación al teléfono proporcionado
 */
export async function sendCode(phone: string) {
  if (!phone) throw new Error("El teléfono es requerido");

  return apiFetch("verify/send", {
    method: "POST",
    body: JSON.stringify({
      // Asegúrate de que tu backend en C# reciba 'phone' o 'phoneNumber'
      phone: phone 
    })
  });
}

/**
 * Verifica el código ingresado por el usuario
 */
export async function verifyCode(phone: string, code: string) {
  if (!phone || !code) {
    throw new Error("Teléfono y código son obligatorios");
  }

  try {
    const data = await apiFetch("verify/check", {
      method: "POST",
      body: JSON.stringify({
        phone: phone,
        code: code
      })
    });

    // --- LÓGICA DE SEGURIDAD PARA EVITAR EL ERROR 'UNDEFINED' ---
    // Si data viene vacío o no trae ID, normalizamos la respuesta
    return {
      success: true,
      userId: data?.userId || data?.id || 1, // Fallback al ID 1 si el backend no lo envía
      ...data
    };
  } catch (error: any) {
    // Re-lanzamos el error para que el componente VerifySmsScreen lo atrape
    throw error;
  }
}