
const fs = require("fs");
let content = fs.readFileSync("src/app/mi-cuenta/page.tsx", "utf8");

if (content.includes("ShieldCheck") && !content.includes("import { ShieldCheck")) {
    content = content.replace(
      /import \{ Package, Gavel, FileImage \} from "lucide-react";/,
      `import { Package, Gavel, FileImage, ShieldCheck } from "lucide-react";`
    );
    fs.writeFileSync("src/app/mi-cuenta/page.tsx", content, "utf8");
}

