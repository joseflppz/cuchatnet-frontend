// app/api/verify/send/route.ts
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch("https://localhost:7086/api/verify/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}