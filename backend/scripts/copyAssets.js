const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src", "services", "ai", "tools", "models");
const dest = path.join(__dirname, "..", "dist", "services", "ai", "tools", "models");

fs.cpSync(src, dest, { recursive: true });
console.log(`Copied risk model assets -> ${path.relative(process.cwd(), dest)}`);
