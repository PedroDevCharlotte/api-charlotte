# 🔐 Sistema de Notificaciones de Expiración de Contraseñas

## 📋 Descripción

Sistema completo para verificar y notificar a los usuarios sobre contraseñas próximas a vencer. El sistema incluye:

- **Verificación automática** de contraseñas próximas a vencer
- **Notificaciones por email** con plantillas profesionales
- **Niveles de urgencia** (crítico, urgente, alto, medio)
- **Endpoints para administradores** para consultar usuarios afectados

---

## 🚀 Endpoints Disponibles

### 1. Verificar y Enviar Notificaciones
**POST** `/user/check-password-expiration`

Este endpoint verifica todas las contraseñas próximas a vencer y envía notificaciones automáticamente.

#### Headers
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

#### Respuesta de Ejemplo
```json
{
  "message": "Verificación de contraseñas completada. Se enviaron 5 notificaciones.",
  "notificationsSent": 5,
  "usersChecked": 150
}
```

#### Criterios de Notificación
- **7 días o menos**: Notificación preventiva
- **3 días o menos**: Notificación con prioridad alta
- **1 día**: Notificación urgente
- **0 días (vencida)**: Notificación crítica

---

### 2. Obtener Lista de Usuarios con Contraseñas Próximas a Vencer
**GET** `/user/expiring-passwords` (7 días por defecto)
**GET** `/user/expiring-passwords/:days` (días personalizados)

Obtiene una lista de usuarios cuyas contraseñas vencerán en los próximos días especificados.

#### Headers
```
Authorization: Bearer <jwt-token>
```

#### Ejemplos de Uso
```bash
# Obtener usuarios con contraseñas que vencen en 7 días (por defecto)
GET /user/expiring-passwords

# Obtener usuarios con contraseñas que vencen en 30 días
GET /user/expiring-passwords/30

# Obtener usuarios con contraseñas que vencen en 1 día
GET /user/expiring-passwords/1
```

#### Respuesta de Ejemplo
```json
[
  {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@charlotte.com.mx",
    "role": "Administrador",
    "department": "Sistemas",
    "dateToPasswordExpiration": "2025-08-05T00:00:00.000Z",
    "daysRemaining": 1,
    "status": "Vence mañana"
  },
  {
    "id": 2,
    "firstName": "María",
    "lastName": "García",
    "email": "maria.garcia@charlotte.com.mx",
    "role": "Empleado",
    "department": "Administración",
    "dateToPasswordExpiration": "2025-08-04T00:00:00.000Z",
    "daysRemaining": 0,
    "status": "Vencida"
  }
]
```

#### Estados Posibles
- **"Vencida"**: La contraseña ya venció (0 días)
- **"Vence mañana"**: La contraseña vence en 1 día
- **"Crítico"**: La contraseña vence en 2-3 días
- **"Próximo a vencer"**: La contraseña vence en 4+ días

---

## 📧 Sistema de Notificaciones por Email

### Plantilla Profesional
El sistema utiliza una plantilla HTML responsiva (`password-expiration-warning.hbs`) que incluye:

- **Logo de la empresa**
- **Diseño responsive**
- **Niveles de urgencia visuales**:
  - 🚨 **Crítico**: Rojo con animación
  - ⚠️ **Urgente**: Naranja
  - ⏰ **Alto**: Amarillo
  - 🔔 **Medio**: Azul

### Variables de la Plantilla
```handlebars
{{userName}} - Nombre del usuario
{{daysRemaining}} - Días restantes
{{customMessage}} - Mensaje personalizado según urgencia
{{urgencyLevel}} - Nivel de urgencia (critical, urgent, high, medium)
{{changePasswordUrl}} - URL para cambiar contraseña
{{logoUrl}} - URL del logo de la empresa
{{loginUrl}} - URL de login del sistema
{{year}} - Año actual
```

### Mensajes Automáticos
- **0 días**: "Su contraseña vence HOY. Es necesario cambiarla inmediatamente."
- **1 día**: "Su contraseña vence MAÑANA. Por favor, cámbiela lo antes posible."
- **2+ días**: "Su contraseña vencerá en X días. Le recomendamos cambiarla pronto."

---

## 🛠️ Configuración del Campo dateToPasswordExpiration

### En la Entidad User
```typescript
@Column({ type: 'datetime', nullable: true })
dateToPasswordExpiration?: Date;
```

### Configuración Automática
El campo se configura automáticamente cuando:
1. **Se crea un usuario**: `dateToPasswordExpiration = fecha actual + daysToPasswordExpiration`
2. **Se actualiza un usuario**: Se recalcula si se modifica `daysToPasswordExpiration`

### Ejemplo de Uso en el Servicio
```typescript
// Al crear o actualizar usuario
let dateToPasswordExpiration = user.daysToPasswordExpiration 
  ? new Date(Date.now() + user.daysToPasswordExpiration * 24 * 60 * 60 * 1000) 
  : null;
user.dateToPasswordExpiration = dateToPasswordExpiration;
```

---

## 🔄 Automatización con Cron Jobs

### Configuración Recomendada
Para automatizar las verificaciones, se recomienda configurar un cron job que ejecute el endpoint:

```bash
# Verificar diariamente a las 8:00 AM
0 8 * * * curl -X POST "http://localhost:3006/user/check-password-expiration" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"
```

### Usando Node-Cron (Alternativa)
```typescript
import * as cron from 'node-cron';

// Ejecutar diariamente a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
  try {
    await this.usersService.checkPasswordExpiration();
    console.log('✅ Verificación de contraseñas ejecutada automáticamente');
  } catch (error) {
    console.error('❌ Error en verificación automática:', error);
  }
});
```

---

## 🧪 Pruebas de los Endpoints

### 1. Probar Verificación de Contraseñas
```bash
curl -X POST "http://localhost:3006/user/check-password-expiration" \
  -H "Authorization: Bearer <tu-jwt-token>" \
  -H "Content-Type: application/json"
```

### 2. Probar Lista de Usuarios
```bash
# Lista por defecto (7 días)
curl -X GET "http://localhost:3006/user/expiring-passwords" \
  -H "Authorization: Bearer <tu-jwt-token>"

# Lista personalizada (30 días)
curl -X GET "http://localhost:3006/user/expiring-passwords/30" \
  -H "Authorization: Bearer <tu-jwt-token>"
```

### 3. Probar con Usuarios de Prueba
Para probar el sistema, puedes:

1. **Crear un usuario de prueba** con `daysToPasswordExpiration: 1`
2. **Ejecutar el endpoint** de verificación
3. **Verificar el email** en la bandeja de entrada
4. **Comprobar el estado** en la lista de usuarios

---

## 📱 Integración con Frontend

### Ejemplo de Componente React
```jsx
const PasswordExpirationDashboard = () => {
  const [expiringUsers, setExpiringUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkPasswords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/check-password-expiration', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      alert(`Verificación completada. ${result.notificationsSent} notificaciones enviadas.`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringUsers = async (days = 7) => {
    try {
      const response = await fetch(`/api/user/expiring-passwords/${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const users = await response.json();
      setExpiringUsers(users);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <button onClick={checkPasswords} disabled={loading}>
        {loading ? 'Verificando...' : 'Verificar Contraseñas'}
      </button>
      
      <select onChange={(e) => loadExpiringUsers(e.target.value)}>
        <option value="7">7 días</option>
        <option value="15">15 días</option>
        <option value="30">30 días</option>
      </select>

      <div>
        {expiringUsers.map(user => (
          <div key={user.id} className={`user-card ${user.status.toLowerCase()}`}>
            <h3>{user.firstName} {user.lastName}</h3>
            <p>Email: {user.email}</p>
            <p>Días restantes: {user.daysRemaining}</p>
            <p>Estado: {user.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔧 Configuración de Entorno

### Variables de Entorno Necesarias
```env
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu-email@gmail.com
MAIL_PASS=tu-app-password
MAIL_FROM=sistema@charlotte.com.mx

# Frontend URLs
FRONTEND_URL=http://localhost:3000
CHARLOTTE_LOGO_URL=https://tu-logo.com/logo.png
```

### Dependencias Requeridas
```json
{
  "@nestjs-modules/mailer": "^1.x.x",
  "handlebars": "^4.x.x",
  "bcrypt": "^5.x.x"
}
```

---

## ✅ Checklist de Implementación

- [x] Campo `dateToPasswordExpiration` agregado a la entidad User
- [x] Interfaces TypeScript para tipos de datos
- [x] Método `checkPasswordExpiration()` en UsersService
- [x] Método `getUsersWithExpiringPasswords()` en UsersService
- [x] Método `sendPasswordExpirationWarning()` en EmailService
- [x] Plantilla HTML profesional `password-expiration-warning.hbs`
- [x] Endpoints en UserController
- [x] Documentación completa
- [x] Compilación exitosa
- [x] Aplicación funcionando en puerto 3006

---

## 🎯 Próximos Pasos Sugeridos

1. **Configurar Cron Job** para ejecución automática
2. **Crear Dashboard** en el frontend para administradores
3. **Agregar notificaciones push** (opcional)
4. **Implementar historial** de notificaciones enviadas
5. **Configurar alertas** para administradores
6. **Añadir métricas** de cumplimiento de políticas de contraseñas

---

¡El sistema está listo y funcionando! 🚀
