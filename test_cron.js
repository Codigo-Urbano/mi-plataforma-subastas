
const fs = require("fs");
const env = fs.readFileSync(".env.local", "utf-8").split("\n").reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/"/g, "").trim();
  return acc;
}, {});

fetch("http://localhost:3000/api/cron/finalizar-subastas", {
  headers: {
    "Authorization": `Bearer ${env.CRON_SECRET}`
  }
}).then(res => res.json()).then(console.log).catch(console.error);

