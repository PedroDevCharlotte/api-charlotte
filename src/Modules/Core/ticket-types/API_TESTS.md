# Pruebas del API de Tipos de Ticket

## Configuración
- Base URL: http://localhost:3000
- Autenticación: Bearer Token requerido

## 1. Obtener todos los tipos de ticket

```bash
GET http://localhost:3000/ticket-types
Authorization: Bearer YOUR_JWT_TOKEN
```

## 2. Crear un nuevo tipo de ticket

```bash
POST http://localhost:3000/ticket-types
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Incidente",
  "description": "Tickets para reportar incidentes críticos",
  "code": "INCIDENT",
  "color": "#F44336",
  "priority": 0
}
```

## 3. Obtener estadísticas

```bash
GET http://localhost:3000/ticket-types/statistics
Authorization: Bearer YOUR_JWT_TOKEN
```

## 4. Obtener por nombre

```bash
GET http://localhost:3000/ticket-types/name/Soporte
Authorization: Bearer YOUR_JWT_TOKEN
```

## 5. Obtener por código

```bash
GET http://localhost:3000/ticket-types/code/SUPPORT
Authorization: Bearer YOUR_JWT_TOKEN
```

## 6. Actualizar un tipo de ticket

```bash
PATCH http://localhost:3000/ticket-types/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "description": "Nueva descripción actualizada",
  "color": "#FF9800"
}
```

## 7. Desactivar un tipo de ticket

```bash
PATCH http://localhost:3000/ticket-types/1/deactivate
Authorization: Bearer YOUR_JWT_TOKEN
```

## 8. Activar un tipo de ticket

```bash
PATCH http://localhost:3000/ticket-types/1/activate
Authorization: Bearer YOUR_JWT_TOKEN
```

## 9. Eliminar un tipo de ticket

```bash
DELETE http://localhost:3000/ticket-types/1
Authorization: Bearer YOUR_JWT_TOKEN
```

## Nota sobre autenticación

Para obtener un token JWT, primero debes hacer login:

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@charlotte.com",
  "password": "tu_password"
}
```

Luego usa el `access_token` de la respuesta en el header Authorization como `Bearer {token}`.
