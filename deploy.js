const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
  user: "u821827014.charlottechemical.com",
  password: "!7>c]=:;w*HUaOlG", // o usa process.env.FTP_PASSWORD_FTP
  host: "147.79.125.127", // Corregido para no incluir ftp://
  port: 21,
  localRoot: __dirname,
  remoteRoot: "/public_html/api",
  include: [
    "dist/**",
    "package.json",
    "package-lock.json",
    ".env",
    "uploads/**"
  ],
  exclude: ["**/*.map", "node_modules/**", "test/**", "*.spec.ts"],
  deleteRemote: false, // true para limpiar la carpeta remota antes de subir
  forcePasv: true,
};

ftpDeploy
  .deploy(config)
  .then(res => console.log("Deploy terminado:", res))
  .catch(err => console.error("Error en deploy:", err));
