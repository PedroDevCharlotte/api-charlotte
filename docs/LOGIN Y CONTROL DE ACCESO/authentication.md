# Autenticación y login

Documentación de los endpoints de autenticación (login, 2FA, logout y cambio de primera contraseña).

Base path: `/auth`

Endpoints principales

- POST `/auth/login` — Iniciar sesión.
  - Body: `UserLoginDto` { email, password }
  - Respuesta 200: `LoginResponseDto` { access_token, requires2FA?, register2FA?, user? }
  - Errores: 401 Credenciales inválidas.

- POST `/auth/2fa/verify` — Verificar código 2FA.
  - Body: `Verify2FADto` { userId, token }
  - Respuesta: token final si 2FA válida.

- POST `/auth/2fa/setup` — Generar secreto y QR para configurar 2FA (requiere token).
  - Respuesta: { otpauthUrl, secret, qrCode }

- POST `/auth/2fa/enable` — Habilitar 2FA después de verificar el código (requiere token).
- POST `/auth/2fa/disable` — Deshabilitar 2FA (requiere token).

- POST `/auth/change-first-password` — Cambiar contraseña en el primer login (requiere token en header).
  - Body: `ChangeFirstPasswordDto` { currentPassword, newPassword }
  - Respuesta: nuevo `access_token` y flags (requires2FA, register2FA, isFirstLogin=false)

- POST `/auth/logout` — Cerrar sesión (requiere token). Registra logout en auditoría.

DTOs (resumen)

- `UserLoginDto`:
  - email (string)
  - password (string)

- `LoginResponseDto`:
  - access_token (string)
  - requires2FA? (boolean)
  - register2FA? (boolean)
  - user? (object con id, email, role, department)

Ejemplo: login

POST /auth/login

{
  "email": "pedro.m@example.com",
  "password": "Secret123!"
}

Respuesta 200:

{
  "access_token": "eyJhbGci...",
  "requires2FA": false,
  "user": {
    "id": 123,
    "email": "pedro.m@example.com",
    "role": "user",
    "department": "IT"
  }
}

Notas

- Los endpoints que alteran la seguridad (habilitar/deshabilitar 2FA, cambio de contraseña) requieren pasar el header Authorization: `Bearer <JWT>`.
- El flujo de 2FA puede incluir un paso intermedio donde `authService.generateToken()` retorna `requires2FA: true` y el front debe llamar a `/auth/2fa/verify`.
- El servicio registra eventos de login/logout en `session_log` para auditoría.
