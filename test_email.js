
const fs = require("fs");
const { Resend } = require("resend");

const env = fs.readFileSync(".env.local", "utf-8").split("\n").reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/"/g, "").trim();
  return acc;
}, {});

const resend = new Resend(env.RESEND_API_KEY);

async function testEmail() {
  console.log("Probando envio con Resend...");
  try {
    const data = await resend.emails.send({
      from: "Subastas Pro <notificaciones@subastas-pro.com>",
      to: ["lococovero@gmail.com"], // We know this email from the screenshot
      subject: "Prueba de Integracion",
      html: "<h1>Hola, esta es una prueba de que Resend funciona</h1>"
    });
    console.log("Resultado:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

testEmail();

