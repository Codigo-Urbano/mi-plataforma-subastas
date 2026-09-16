
const fs = require("fs");
let content = fs.readFileSync("src/app/mi-cuenta/page.tsx", "utf8");
content = `import { ShieldAlert } from "lucide-react";\n` + content;
fs.writeFileSync("src/app/mi-cuenta/page.tsx", content, "utf8");

