# Usuarios

Este documento resume los endpoints relacionados con la gestión de usuarios (CRUD, jerarquía y contraseñas).

Base path: `/user`

Endpoints principales

- GET `/user/list` — Obtener todos los usuarios (requiere token Bearer).
- GET `/user/:id` — Obtener usuario por ID (requiere token).
- POST `/user/insert` — Crear usuario (formato moderno). Payload: `CreateUserDto`.
- POST `/user/insert-legacy` — Crear usuario (formato legacy). Payload: `CreateUserLegacyDto`.
- PUT `/user/update` — Actualizar usuario (requiere token). Payload: `UpdateUserDto`.
- DELETE `/user/delete/:id` — Eliminar usuario por ID (requiere token).

Endpoints de utilidades

- POST `/user/request-password-reset` — Solicitar código de restablecimiento por email.
- POST `/user/verify-password-reset` — Verificar código y establecer nueva contraseña.
- POST `/user/check-password-expiration` — (Admin) verificar contraseñas próximas a expirar y enviar notificaciones.
- GET `/user/expiring-passwords/:days` — Obtener usuarios con contraseñas próximas a expirar (privado).
- GET `/user/expiring-passwords` — Obtener usuarios con contraseñas próximas a expirar (versión sin parámetros).

Jerarquía y soporte

- GET `/user/:id/subordinates` — Obtener subordinados.
- GET `/user/:id/manager` — Obtener jefe directo.
- PUT `/user/:id/assign-manager/:managerId` — Asignar jefe.
- GET `/user/:id/available-managers` — Posibles jefes disponibles.
- GET `/user/:id/support-types` — Tipos de soporte que puede manejar un usuario.
- PUT `/user/:id/support-types` — Asignar tipos de soporte a un usuario. Body: { supportTypeIds: number[] }
- GET `/user/by-support-type/:ticketTypeId` — Usuarios que manejan un tipo de ticket.

DTOs (resumen)

- `CreateUserDto`:
  - firstName, lastName, roleId (number), departmentId (number), email, password
  - daysToPasswordExpiration (number), active (boolean), isBlocked (boolean), isTwoFactorEnabled (boolean)

- `CreateUserLegacyDto` (legacy) — tiene `name`, `lastname`, `rol` (array), `email`, `password` y un método `toUserDto()` para convertir al formato moderno.

Ejemplo: crear usuario (modern):

POST /user/insert

{
  "firstName": "Pedro",
  "lastName": "Martínez",
  "email": "pedro.m@example.com",
  "password": "Secret123!",
  "roleId": 11,
  "departmentId": 1,
  "daysToPasswordExpiration": 90
}

Respuesta: 201 Created (objeto `User` con campos básicos).

Notas

- Muchos endpoints requieren el header Authorization: `Bearer <JWT>`.
- Auditoría: varias acciones registran actividad en la tabla `session_log`.
- Para pruebas el endpoint `/user/test-insert` existe pero no debe usarse en producción.
