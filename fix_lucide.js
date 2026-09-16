
const fs = require("fs");
let content = fs.readFileSync("src/app/mi-cuenta/page.tsx", "utf8");
content = content.replace(
  /import { Package, Gavel, FileImage } from "lucide-react";/,
  `import { Package, Gavel, FileImage, ShieldAlert } from "lucide-react";`
);
fs.writeFileSync("src/app/mi-cuenta/page.tsx", content, "utf8");

