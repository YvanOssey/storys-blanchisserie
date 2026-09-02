const { randomBytes, scryptSync } = require("node:crypto");

process.stdout.write("Mot de passe admin : ");
process.stdin.setRawMode(true);
process.stdin.resume();
let password = "";

process.stdin.on("data", (chunk) => {
  const code = chunk[0];
  if (code === 13 || code === 10) {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    console.log("\nHASH À COPIER :");
    console.log(`${salt}:${hash}`);
  } else if (code === 3) {
    process.exit();
  } else if (code ===  8) {
    password = password.slice(0, -1);
  } else {
    password += chunk.toString();
  }
});
