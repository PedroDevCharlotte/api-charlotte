# Guía de Uso: Endpoints de Creación de Tickets

## Problema Resuelto

El endpoint `POST /tickets/complete` estaba configurado para recibir solo JSON, pero cuando se envía un FormData desde el frontend (necesario para archivos adjuntos), se producía el error de validación:

```json
{
  "message": [
    "title must be shorter than or equal to 255 characters",
    "title must be longer than or equal to 5 characters",
    "title must be a string",
    "ticketTypeId must be a number conforming to the specified constraints",
    "description must be longer than or equal to 10 characters",
    "description must be a string",
    "createdByUserId must be a number conforming to the specified constraints"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## Solución Implementada

Se crearon **2 endpoints** para diferentes casos de uso:

### 1. `POST /tickets/complete` - Para FormData con Archivos

**Uso**: Cuando necesitas subir archivos adjuntos al crear el ticket.

**Content-Type**: `multipart/form-data`

**Características**:
- ✅ Soporta archivos adjuntos
- ✅ Convierte FormData a formato interno automáticamente
- ✅ Maneja arrays JSON como strings (participants, customFields)
- ✅ Procesa archivos y los guarda en el servidor

**Ejemplo de uso desde JavaScript/Frontend**:

```javascript
const formData = new FormData();

// Campos básicos del ticket
formData.append('title', 'Problema con el sistema');
formData.append('description', 'Descripción detallada del problema');
formData.append('ticketTypeId', '1');
formData.append('createdByUserId', '3');
formData.append('priority', 'HIGH');
formData.append('assignedTo', '2');

// Campos opcionales
formData.append('isUrgent', 'true');
formData.append('isInternal', 'false');
formData.append('initialMessage', 'Mensaje inicial del ticket');

// Arrays como JSON strings
formData.append('participants', JSON.stringify([
  { userId: 4, role: 'OBSERVER' },
  { userId: 5, role: 'COLLABORATOR' }
]));

formData.append('customFields', JSON.stringify({
  sistema: 'ERP',
  modulo: 'Contabilidad'
}));

// Archivos adjuntos
formData.append('files', file1);
formData.append('files', file2);

// Enviar request
const response = await fetch('/tickets/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

### 2. `POST /tickets/complete-json` - Para JSON sin Archivos

**Uso**: Cuando no necesitas archivos adjuntos y prefieres enviar JSON puro.

**Content-Type**: `application/json`

**Características**:
- ✅ Validación automática con class-validator
- ✅ Tipos TypeScript estrictos
- ✅ Swagger documentation completa
- ❌ No soporta archivos adjuntos

**Ejemplo de uso desde JavaScript/Frontend**:

```javascript
const ticketData = {
  title: 'Problema con el sistema',
  description: 'Descripción detallada del problema',
  ticketTypeId: 1,
  createdByUserId: 3,
  priority: 'HIGH',
  assignedTo: 2,
  isUrgent: true,
  isInternal: false,
  initialMessage: 'Mensaje inicial del ticket',
  participants: [
    { userId: 4, role: 'OBSERVER' },
    { userId: 5, role: 'COLLABORATOR' }
  ],
  customFields: {
    sistema: 'ERP',
    modulo: 'Contabilidad'
  }
};

const response = await fetch('/tickets/complete-json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(ticketData)
});
```

## Campos Requeridos

Los siguientes campos son **obligatorios** en ambos endpoints:

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| `title` | string | Título del ticket | 5-255 caracteres |
| `description` | string | Descripción detallada | Mínimo 10 caracteres |
| `ticketTypeId` | number | ID del tipo de ticket | Debe existir en DB |
| `createdByUserId` | number | ID del usuario creador | Debe existir en DB |

## Campos Opcionales

| Campo | Tipo | Descripción | Default |
|-------|------|-------------|---------|
| `priority` | enum | URGENT, HIGH, MEDIUM, LOW | MEDIUM |
| `assignedTo` | number | ID del usuario asignado | null (auto-asignación) |
| `departmentId` | number | ID del departamento | Del usuario creador |
| `isUrgent` | boolean | Marca como urgente | false |
| `isInternal` | boolean | Ticket interno | false |
| `dueDate` | string | Fecha límite (ISO) | null |
| `initialMessage` | string | Mensaje inicial | null |
| `tags` | string[] | Etiquetas del ticket | [] |
| `customFields` | object | Campos personalizados | {} |
| `participants` | array | Lista de participantes | [] |
| `attachments` | array | Solo en JSON endpoint | [] |

## Estructura de Participantes

```javascript
{
  userId: number,        // ID del usuario
  role: 'CREATOR' | 'ASSIGNEE' | 'OBSERVER' | 'COLLABORATOR' | 'APPROVER',
  canEdit: boolean,      // Opcional, default: false
  canComment: boolean    // Opcional, default: true
}
```

## Respuesta de Ambos Endpoints

```javascript
{
  ticket: {
    id: number,
    ticketNumber: string,
    title: string,
    description: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'FOLLOW_UP' | 'COMPLETED' | 'CLOSED' | 'NON_CONFORMITY' | 'CANCELLED',
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
    // ... más campos del ticket
  },
  assignedUser: {
    id: number,
    firstName: string,
    lastName: string,
    email: string
  } | null,
  initialMessage: object | null,
  attachments: array,
  participants: array,
  ticketNumber: string,
  processingInfo: {
    autoAssigned: boolean,
    assignmentReason: string,
    defaultUserUsed: boolean
  }
}
```

## Notificaciones por Email

**Ambos endpoints** envían automáticamente notificaciones por email a:
- Usuario creador del ticket
- Usuario asignado (si aplica)
- Participantes según su rol
- Observadores en copia (CC)

Las notificaciones incluyen:
- ✅ Enlaces directos al ticket en el sistema
- ✅ Información completa del ticket
- ✅ Diseño profesional con branding corporativo
- ✅ Lista de archivos adjuntos
- ✅ Detalles de participantes y asignación

## Recomendaciones de Uso

### Usar `POST /tickets/complete` cuando:
- ✅ Necesites subir archivos adjuntos
- ✅ Envíes datos desde un formulario HTML
- ✅ Uses librerías que generan FormData automáticamente

### Usar `POST /tickets/complete-json` cuando:
- ✅ No necesites archivos adjuntos
- ✅ Prefieras validación estricta de tipos
- ✅ Trabajes con datos JSON puros
- ✅ Desarrolles APIs que consumen otras APIs

## Manejo de Errores

Ambos endpoints devuelven errores estándar:

```javascript
// Error de validación
{
  "message": ["title must be longer than or equal to 5 characters"],
  "error": "Bad Request",
  "statusCode": 400
}

// Usuario no encontrado
{
  "message": "Usuario con ID 999 no encontrado",
  "error": "Not Found", 
  "statusCode": 404
}

// Tipo de ticket no encontrado
{
  "message": "Tipo de ticket con ID 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

## Configuración de Archivos

Los archivos se guardan en:
- **Directorio**: `uploads/tickets/`
- **Formato**: `{timestamp}_{random}.{extension}`
- **Límites**: Sin límite específico (configurar en el servidor si es necesario)

## Ejemplo Completo de FormData

```javascript
// Función helper para crear FormData desde objeto
function createTicketFormData(ticketData, files = []) {
  const formData = new FormData();
  
  // Campos requeridos
  formData.append('title', ticketData.title);
  formData.append('description', ticketData.description);
  formData.append('ticketTypeId', ticketData.ticketTypeId.toString());
  formData.append('createdByUserId', ticketData.createdByUserId.toString());
  
  // Campos opcionales
  if (ticketData.priority) formData.append('priority', ticketData.priority);
  if (ticketData.assignedTo) formData.append('assignedTo', ticketData.assignedTo.toString());
  if (ticketData.departmentId) formData.append('departmentId', ticketData.departmentId.toString());
  if (ticketData.isUrgent !== undefined) formData.append('isUrgent', ticketData.isUrgent.toString());
  if (ticketData.isInternal !== undefined) formData.append('isInternal', ticketData.isInternal.toString());
  if (ticketData.dueDate) formData.append('dueDate', ticketData.dueDate);
  if (ticketData.initialMessage) formData.append('initialMessage', ticketData.initialMessage);
  
  // Arrays como JSON
  if (ticketData.participants) formData.append('participants', JSON.stringify(ticketData.participants));
  if (ticketData.customFields) formData.append('customFields', JSON.stringify(ticketData.customFields));
  if (ticketData.tags && ticketData.tags.length > 0) {
    ticketData.tags.forEach(tag => formData.append('tags', tag));
  }
  
  // Archivos
  files.forEach(file => formData.append('files', file));
  
  return formData;
}

// Uso
const ticketData = {
  title: 'Problema urgente',
  description: 'Descripción detallada del problema que necesita resolución inmediata',
  ticketTypeId: 1,
  createdByUserId: 3,
  priority: 'HIGH',
  isUrgent: true,
  participants: [
    { userId: 4, role: 'OBSERVER' }
  ]
};

const files = [document.getElementById('fileInput').files[0]];
const formData = createTicketFormData(ticketData, files);

fetch('/tickets/complete', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
});
```

¡El sistema ahora soporta completamente tanto FormData con archivos como JSON puro según tus necesidades!
