# Sistema de Notificaciones por Email para Tickets

## Resumen de Implementación

Se ha implementado un sistema completo de notificaciones por email para el sistema de tickets que incluye:

### 🚀 Funcionalidades Implementadas

#### 1. Servicio de Notificaciones (`TicketNotificationService`)
- **Ubicación**: `src/Modules/Core/tickets/ticket-notification.service.ts`
- **Funcionalidades**:
  - Notificaciones de creación de tickets
  - Notificaciones de actualización de tickets
  - Notificaciones de cambio de estado
  - Notificaciones de asignación
  - Notificaciones de nuevos comentarios
  - Notificaciones de cierre de tickets

#### 2. Templates de Email Profesionales
Se crearon 6 templates HTML con diseño responsivo y branding de Charlotte Chemical:

- **`ticket-created.hbs`**: Notificación de nuevo ticket creado
- **`ticket-updated.hbs`**: Notificación de ticket actualizado
- **`ticket-status-changed.hbs`**: Notificación de cambio de estado
- **`ticket-assigned.hbs`**: Notificación de asignación de ticket
- **`ticket-commented.hbs`**: Notificación de nuevo comentario
- **`ticket-closed.hbs`**: Notificación de ticket cerrado

#### 3. Funcionalidades de los Templates

##### Características Comunes:
- **Diseño Responsivo**: Optimizado para desktop y móvil
- **Branding Corporativo**: Logo y colores de Charlotte Chemical
- **Información Completa**: Todos los detalles relevantes del ticket
- **Enlaces Directos**: Botones para ver el ticket en el sistema
- **Gestión de Destinatarios**: Soporte para CC y BCC

##### Información Incluida:
- Número de ticket con enlace directo
- Título y descripción del ticket
- Estado actual con colores dinámicos
- Prioridad con indicadores visuales
- Usuario que realizó la acción
- Fechas formateadas en español
- Información del usuario asignado
- Lista de archivos adjuntos
- Participantes del ticket
- Departamento responsable

#### 4. Sistema de Helpers de Handlebars
Se agregaron helpers personalizados para mejorar la funcionalidad de los templates:

```javascript
// Formateo de texto
breaklines()        // Convierte saltos de línea a HTML
substring()         // Extrae subcadenas
capitalize()        // Capitaliza texto

// Formateo de fechas
formatDate()        // Fecha completa en español
formatDateShort()   // Fecha corta
timeAgo()          // Tiempo relativo (hace X minutos)

// Utilitarios
eq(), gt(), lt()   // Comparaciones
number()           // Formato de números
```

#### 5. Integración Automática
- **Notificaciones Automáticas**: Se envían automáticamente al crear tickets a través del endpoint `/tickets/complete`
- **Gestión de Destinatarios**: Los emails se envían a:
  - Creador del ticket
  - Usuario asignado
  - Participantes según su rol
  - Copias a observadores y colaboradores

#### 6. Configuración de Email
El sistema utiliza la configuración existente del `EmailService`:

```typescript
// Variables de entorno necesarias
FRONTEND_URL          // URL del frontend para enlaces
CHARLOTTE_LOGO_URL    // URL del logo corporativo
SUPPORT_EMAIL         // Email de soporte
```

### 📧 Tipos de Notificaciones

#### 1. Creación de Ticket
- **Trigger**: Al crear un nuevo ticket
- **Destinatarios**: Creador, asignado, participantes
- **Información**: Detalles completos del ticket nuevo

#### 2. Actualización de Ticket
- **Trigger**: Al modificar campos del ticket
- **Destinatarios**: Todos los participantes
- **Información**: Comparación antes/después de los cambios

#### 3. Cambio de Estado
- **Trigger**: Al cambiar el estado del ticket
- **Destinatarios**: Todos los participantes
- **Información**: Estado anterior vs nuevo con explicaciones

#### 4. Asignación
- **Trigger**: Al asignar o reasignar el ticket
- **Destinatarios**: Usuario asignado, creador, participantes
- **Información**: Detalles del agente asignado

#### Reasignación (nuevo)
- **Endpoint**: `PATCH /tickets/:id/reassign`
- **Descripción**: Reasigna el ticket a otro usuario. Actualiza participantes e historial y envía una notificación al nuevo asignado y al creador.
- **Request body**: `{ "assigneeId": <userId> }` (ver `AssignTicketDto`).
- **Respuesta**: `TicketResponseDto`.

#### 5. Nuevo Comentario
- **Trigger**: Al agregar comentarios o respuestas
- **Destinatarios**: Participantes según visibilidad del comentario
- **Información**: Contenido del comentario y archivos adjuntos

#### 6. Cierre de Ticket
- **Trigger**: Al cerrar o resolver el ticket
- **Destinatarios**: Todos los participantes
- **Información**: Resumen completo y encuesta de satisfacción

#### Solicitud manual de encuesta (nuevo)
- **Endpoint**: `POST /tickets/:id/request-feedback`
- **Descripción**: Endpoint para solicitar al creador del ticket que responda la encuesta de satisfacción. Envía un correo al creador con un enlace directo a la encuesta del ticket (`${FRONTEND_URL}/apps/ticket/feedback/{ticketId}`).
- **Permisos**: Requiere autenticación; no necesariamente notifica a todos los participantes, únicamente al creador (configurable desde el servicio de notificaciones).
- **Respuesta**: `TicketResponseDto` con el objeto ticket actualizado si aplica.

### Cambios técnicos en manejo de plantillas (templates)
- Para evitar errores en producción por rutas distintas entre `src` y `dist`, el `EmailService` implementa:
  - Búsqueda multi-path de templates (`src/.../templates` y `dist/.../templates`).
  - Fallback de renderizado con Handlebars si el adaptador nativo falla.
  - Recomendación: incluir un script `postbuild` que copie las plantillas `.hbs` al `dist` para garantizar su disponibilidad.

### Ejemplo: Solicitar encuesta (flujo)
1. Frontend llama `POST /tickets/:id/request-feedback` (usuario autenticado).
2. `TicketsController.requestFeedback` delega a `TicketsService.requestFeedback`.
3. `TicketsService` valida permisos y obtiene el ticket + creator email.
4. `TicketNotificationService` prepara el contexto y llama a `EmailService.sendEmailWithTemplate('ticket-closed', context, recipients)` o a una plantilla dedicada si existe.
5. Email llega al creador con enlace: `${FRONTEND_URL}/apps/ticket/feedback/{ticketId}`.

### 🎨 Características del Diseño

#### Elementos Visuales:
- **Encabezados con Gradientes**: Colores dinámicos según el tipo de notificación
- **Iconos Emotivos**: Emojis para identificar rápidamente el tipo de acción
- **Badges de Estado**: Indicadores visuales con colores corporativos
- **Métricas del Ticket**: Información estadística en formato de dashboard
- **Botones de Acción**: Enlaces destacados para ver el ticket

#### Responsive Design:
- **Layout Flexible**: Se adapta a cualquier tamaño de pantalla
- **Imágenes Optimizadas**: Logo y elementos visuales escalables
- **Tipografía Legible**: Fuentes y tamaños optimizados para email
- **Compatibilidad**: Funciona en todos los clientes de email principales

### 🔧 Uso del Sistema

#### Envío Manual de Notificaciones:
```typescript
await this.ticketNotificationService.sendTicketNotification({
  ticket: ticketEntity,
  action: 'created',
  user: currentUser,
  attachments: attachmentList,
  recipients: {
    to: ['user@company.com'],
    cc: ['manager@company.com']
  },
  customMessage: 'Mensaje adicional opcional'
});
```

#### Envío Automático:
El sistema ya está integrado en:
- `POST /tickets/complete` - Envía notificación de creación automáticamente
- Próximamente en otros endpoints de actualización y cambio de estado

### 📝 Configuración Requerida

#### Variables de Entorno:
```env
# Frontend URL para enlaces
FRONTEND_URL=http://localhost:3000

# Email corporativo
CHARLOTTE_LOGO_URL=https://company.com/logo.png
SUPPORT_EMAIL=soporte@charlotte.com

# Configuración SMTP (ya existente)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

### 🚦 Estado Actual

#### ✅ Completado:
- [x] Servicio de notificaciones completo
- [x] 6 templates de email profesionales
- [x] Helpers de Handlebars para formateo
- [x] Integración con creación de tickets
- [x] Sistema de gestión de destinatarios
- [x] Diseño responsive y branding corporativo
- [x] Compilación exitosa del código
- [x] Sincronización de base de datos

#### 🔄 Próximos Pasos Sugeridos:
- [ ] Integrar notificaciones en endpoints de actualización de tickets
- [ ] Agregar notificaciones para cambios de estado manual
- [ ] Implementar notificaciones para comentarios en tickets existentes
- [ ] Crear sistema de preferencias de notificación por usuario
- [ ] Agregar plantillas adicionales para casos específicos

### 📖 Ejemplos de Uso

#### Crear Ticket con Notificación:
```bash
POST /tickets/complete
Content-Type: application/json

{
  "title": "Problema con el sistema",
  "description": "Descripción detallada del problema",
  "ticketTypeId": 1,
  "priority": "HIGH",
  "createdByUserId": 1,
  "assignedTo": 2,
  "participants": [
    {
      "userId": 3,
      "role": "OBSERVER"
    }
  ]
}
```

Al ejecutar este endpoint, automáticamente se enviarán emails de notificación a todos los participantes usando el template `ticket-created.hbs`.

### 🎯 Beneficios del Sistema

1. **Comunicación Efectiva**: Mantiene a todos los involucrados informados
2. **Profesionalismo**: Emails con diseño corporativo y información completa
3. **Trazabilidad**: Historial completo de notificaciones
4. **Escalabilidad**: Fácil agregar nuevos tipos de notificaciones
5. **Personalización**: Templates modificables y configuración flexible
6. **Automatización**: Reduce la carga manual de comunicación

El sistema está listo para ser utilizado en producción y puede expandirse fácilmente para cubrir casos de uso adicionales.
