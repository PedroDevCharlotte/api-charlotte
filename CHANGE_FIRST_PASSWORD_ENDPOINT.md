# Endpoint para Cambio de Contraseña en Primer Login

## 📋 Descripción
Este endpoint permite a los usuarios cambiar su contraseña durante su primer login al sistema. Es una funcionalidad de seguridad que obliga a los usuarios a establecer una nueva contraseña personalizada cuando acceden por primera vez.

## 🔐 Autenticación
- **Método**: Bearer Token
- **Requerido**: Sí
- **Header**: `Authorization: Bearer <token>`

## 🛠️ Endpoint

### POST `/auth/change-first-password`

**Descripción**: Cambia la contraseña de un usuario solo si es su primer login

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "currentPassword": "contraseñaActual123",
  "newPassword": "nuevaContraseñaSegura456!"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "message": "Contraseña cambiada exitosamente",
  "access_token": "nuevo.jwt.token.aqui",
  "user": {
    "id": 1,
    "email": "usuario@charlotte.com.mx",
    "role": "Empleado",
    "department": "Administración",
    "roleId": 2,
    "departmentId": 1
  },
  "requires2FA": false,
  "register2FA": true,
  "isFirstLogin": false
}
```

## ⚠️ Validaciones

### 1. **Token de Autenticación**
- El token debe ser válido y no expirado
- Se extrae el `userId` del campo `sub` del token decodificado

### 2. **Estado de Primer Login**
- Solo funciona si `isFirstLogin = true`
- Después del cambio, se marca `isFirstLogin = false`

### 3. **Validación de Contraseña Actual**
- Debe coincidir con la contraseña hasheada en la base de datos

### 4. **Validación de Nueva Contraseña**
- Mínimo 8 caracteres
- No puede estar vacía

## 🚫 Códigos de Error

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Token de autorización requerido"
}
```

```json
{
  "statusCode": 401,
  "message": "Token inválido"
}
```

```json
{
  "statusCode": 401,
  "message": "Usuario no encontrado"
}
```

```json
{
  "statusCode": 401,
  "message": "Esta operación solo está permitida en el primer login"
}
```

```json
{
  "statusCode": 401,
  "message": "La contraseña actual es incorrecta"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "La nueva contraseña debe tener al menos 8 caracteres"
  ],
  "error": "Bad Request"
}
```

## 🔄 Flujo de Proceso

1. **Extracción del Token**: Se extrae el token del header `Authorization`
2. **Decodificación**: Se decodifica el JWT para obtener el `userId` del campo `sub`
3. **Verificación de Usuario**: Se busca el usuario en la base de datos
4. **Validación de Primer Login**: Se verifica que `isFirstLogin = true`
5. **Verificación de Contraseña Actual**: Se compara con bcrypt
6. **Hash de Nueva Contraseña**: Se hashea la nueva contraseña con bcrypt
7. **Actualización**: Se actualiza la contraseña y se marca `isFirstLogin = false`
8. **Nuevo Token**: Se genera un nuevo JWT con la información actualizada

## 📝 Ejemplo de Uso con cURL

```bash
curl -X POST http://localhost:3006/auth/change-first-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "tempPassword123",
    "newPassword": "miNuevaContraseñaSegura456!"
  }'
```

## 📝 Ejemplo de Uso con JavaScript

```javascript
const changeFirstPassword = async (token, currentPassword, newPassword) => {
  try {
    const response = await fetch('/auth/change-first-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Contraseña cambiada exitosamente:', result);
    
    // Guardar el nuevo token
    localStorage.setItem('token', result.access_token);
    
    return result;
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    throw error;
  }
};

// Uso
changeFirstPassword(
  'tu-jwt-token-aqui',
  'contraseñaActual123',
  'nuevaContraseñaSegura456!'
);
```

## 🔒 Consideraciones de Seguridad

1. **Hash Seguro**: Las contraseñas se hashean con bcrypt (10 rounds)
2. **Validación JWT**: Se verifica la integridad y validez del token
3. **Una Sola Vez**: Solo funciona en el primer login
4. **Nuevo Token**: Se genera un nuevo JWT después del cambio
5. **Validación Robusta**: Múltiples capas de validación de entrada

## 📊 Estados del Usuario

| Campo | Antes del Cambio | Después del Cambio |
|-------|------------------|-------------------|
| `isFirstLogin` | `true` | `false` |
| `password` | Hash temporal | Hash de nueva contraseña |
| Token JWT | Token original | Nuevo token generado |

## 🎯 Casos de Uso

1. **Empleado Nuevo**: Usuario creado por administrador que debe cambiar su contraseña temporal
2. **Reset de Seguridad**: Usuario que ha sido marcado para cambio obligatorio de contraseña
3. **Migración de Sistema**: Usuarios migrados que necesitan establecer nueva contraseña
