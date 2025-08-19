# Endpoint de Creación Completa de Tickets

## Descripción
El endpoint `POST /tickets/complete` permite crear un ticket completo con todas las funcionalidades integradas:

- ✅ **Asignación automática** basada en el tipo de ticket y especialización de usuarios
- ✅ **Manejo completo de participantes** con roles y permisos
- ✅ **Archivos adjuntos** con metadatos completos
- ✅ **Mensajes iniciales** automáticos
- ✅ **Campos personalizados** configurables
- ✅ **Historial completo** de creación y asignación
- ✅ **Validaciones exhaustivas** de datos de entrada

## URL
```
POST http://localhost:3006/tickets/complete
```

## Datos de Entrada

### Estructura JSON
```json
{
  "title": "string (requerido, 5-255 caracteres)",
  "ticketTypeId": "number (requerido)",
  "description": "string (requerido, mínimo 10 caracteres)", 
  "createdByUserId": "number (requerido)",
  "customFields": "object (opcional)",
  "initialMessage": "string (opcional)",
  "attachments": "array (opcional)",
  "participants": "array (opcional)",
  "priority": "enum (opcional): LOW|MEDIUM|HIGH|URGENT|CRITICAL",
  "dueDate": "string ISO 8601 (opcional)",
  "estimatedHours": "number (opcional)",
  "tags": "array de strings (opcional)",
  "isUrgent": "boolean (opcional, default: false)",
  "isInternal": "boolean (opcional, default: false)",
  "notificationsEnabled": "boolean (opcional, default: true)",
  "departmentId": "number (opcional)",
  "assignedTo": "number (opcional)"
}
```

## Ejemplos de Uso

### 1. Ticket Básico con Asignación Automática
```json
{
  "title": "Error en sistema de autenticación",
  "ticketTypeId": 1,
  "description": "Los usuarios no pueden iniciar sesión desde esta mañana. El sistema muestra error 500.",
  "createdByUserId": 18,
  "priority": "HIGH",
  "isUrgent": true,
  "tags": ["autenticacion", "error-critico", "produccion"]
}
```

### 2. Ticket Completo con Participantes y Archivos
```json
{
  "title": "Implementar nueva funcionalidad de reportes",
  "ticketTypeId": 2,
  "description": "Necesitamos crear un módulo de reportes avanzados para el área de ventas",
  "createdByUserId": 16,
  "customFields": {
    "modulo": "ventas",
    "complejidad": "alta",
    "version_objetivo": "2.1.0"
  },
  "initialMessage": "Este ticket incluye el desarrollo de 5 tipos de reportes diferentes según las especificaciones adjuntas.",
  "attachments": [
    {
      "fileName": "especificaciones_reportes.pdf",
      "originalFileName": "Especificaciones de Reportes v1.2.pdf",
      "filePath": "/uploads/tickets/2025/08/spec_reports_20250808.pdf",
      "mimeType": "application/pdf",
      "fileSize": 245760,
      "description": "Especificaciones técnicas detalladas de los reportes requeridos"
    },
    {
      "fileName": "mockups_ui.png",
      "originalFileName": "Mockups Interface Usuario.png", 
      "filePath": "/uploads/tickets/2025/08/mockups_20250808.png",
      "mimeType": "image/png",
      "fileSize": 156890,
      "description": "Diseños propuestos para la interfaz de usuario"
    }
  ],
  "participants": [
    {
      "userId": 14,
      "role": "COLLABORATOR",
      "canEdit": true,
      "canComment": true
    },
    {
      "userId": 17,
      "role": "REVIEWER", 
      "canEdit": false,
      "canComment": true
    }
  ],
  "priority": "MEDIUM",
  "dueDate": "2025-08-30T17:00:00Z",
  "estimatedHours": 40,
  "tags": ["desarrollo", "reportes", "ventas", "frontend"],
  "departmentId": 2
}
```

### 3. Ticket con Usuario Específico Asignado
```json
{
  "title": "Actualizar contenido de página de marketing",
  "ticketTypeId": 4,
  "description": "Actualizar el contenido de la página principal con las nuevas promociones de temporada",
  "createdByUserId": 1,
  "assignedTo": 16,
  "customFields": {
    "pagina": "homepage",
    "seccion": "promociones",
    "urgencia_marketing": "media"
  },
  "initialMessage": "Por favor coordinar con el equipo de diseño para las imágenes actualizadas",
  "priority": "MEDIUM",
  "dueDate": "2025-08-15T12:00:00Z",
  "estimatedHours": 6,
  "tags": ["marketing", "contenido", "promociones"],
  "isInternal": false,
  "notificationsEnabled": true
}
```

## Respuesta del Endpoint

### Estructura de Respuesta Exitosa (HTTP 201)
```json
{
  "ticket": {
    "id": 123,
    "ticketNumber": "TKT-2025-123",
    "title": "...",
    "description": "...",
    "status": "OPEN",
    "priority": "HIGH",
    // ... datos completos del ticket
  },
  "assignedUser": {
    "id": 1,
    "firstName": "admin",
    "lastName": "",
    "email": "admin@charlotte.com"
  },
  "initialMessage": {
    "id": 456,
    "content": "...",
    "type": "COMMENT",
    // ... datos del mensaje inicial
  },
  "attachments": [
    {
      "id": 789,
      "fileName": "especificaciones_reportes.pdf",
      "originalFileName": "Especificaciones de Reportes v1.2.pdf",
      // ... datos de archivos adjuntos
    }
  ],
  "participants": [
    {
      "id": 101,
      "userId": 18,
      "role": "CREATOR",
      "canEdit": true,
      "canComment": true
    },
    {
      "id": 102, 
      "userId": 1,
      "role": "ASSIGNEE",
      "canEdit": true,
      "canComment": true
    }
  ],
  "ticketNumber": "TKT-2025-123",
  "processingInfo": {
    "autoAssigned": true,
    "assignmentReason": "Usuario por defecto para tipo de ticket 'Soporte'",
    "defaultUserUsed": true
  }
}
```

## Lógica de Asignación Automática

El sistema sigue esta prioridad para asignar tickets:

1. **Usuario específico** - Si se proporciona `assignedTo`
2. **Usuario por defecto** - Si el tipo de ticket tiene un usuario por defecto configurado  
3. **Usuario especialista** - Busca usuarios con especialización en ese tipo de soporte
4. **Usuario creador** - Como último recurso, se asigna al creador del ticket

## Validaciones

- ✅ Usuario creador debe existir y estar activo
- ✅ Tipo de ticket debe existir y estar activo
- ✅ Usuario asignado (si se especifica) debe existir
- ✅ Participantes especificados deben existir
- ✅ Validaciones de formato en campos requeridos
- ✅ Prevención de participantes duplicados

## Efectos Secundarios

El endpoint ejecuta automáticamente:

1. **Generación de número de ticket único**
2. **Creación de participantes** (creador y asignado)
3. **Registro en historial** de creación y asignación
4. **Mensaje del sistema** de confirmación
5. **Almacenamiento de archivos adjuntos**
6. **Configuración de permisos** de participantes

## Errores Comunes

### HTTP 404 - Not Found
```json
{
  "message": "Usuario con ID 999 no encontrado",
  "statusCode": 404
}
```

### HTTP 400 - Bad Request  
```json
{
  "message": [
    "title must be longer than or equal to 5 characters",
    "description must be longer than or equal to 10 characters"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## Testing

Para probar el endpoint puedes usar:

### Con curl:
```bash
curl -X POST http://localhost:3006/tickets/complete \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test ticket",
    "ticketTypeId": 1,
    "description": "Ticket de prueba para validar el endpoint",
    "createdByUserId": 1
  }'
```

### Con Postman:
1. Método: POST
2. URL: `http://localhost:3006/tickets/complete`
3. Headers: `Content-Type: application/json`
4. Body: Usar cualquiera de los ejemplos JSON de arriba

## Estados de Ticket

Los tickets se crean automáticamente con estado `OPEN` y pueden transicionar a:
- `IN_PROGRESS` - En progreso
Los tickets se crean automáticamente con estado `OPEN` y pueden transicionar a:
- `IN_PROGRESS` - En progreso
- `FOLLOW_UP` - En seguimiento / esperando acción
- `COMPLETED` - Completado
- `CLOSED` - Cerrado
- `NON_CONFORMITY` - No conformidad
- `CANCELLED` - Cancelado
