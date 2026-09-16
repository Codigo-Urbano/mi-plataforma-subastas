
const fs = require("fs");
const envContent = fs.readFileSync(".env.local", "utf8");
console.log(envContent.split("\n").filter(line => line.includes("SUPABASE")));

