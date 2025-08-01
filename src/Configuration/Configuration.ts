export const Configuration = () => ({
    NODE_ENV: process.env.NODE_ENV,
    // Configuración de Email
    // MAIL_HOST: process.env.MAIL_HOST || 'smtp.gmail.com',
    // MAIL_PORT: parseInt(process.env.MAIL_PORT || '587'),
    // MAIL_USER: process.env.MAIL_USER,
    // MAIL_PASS: process.env.MAIL_PASS,
    // MAIL_FROM: process.env.MAIL_FROM,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
});
