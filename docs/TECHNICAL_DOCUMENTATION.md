
# Documentación técnica del proyecto API Charlotte

## Cambios recientes: Integración con OneDrive para archivos

- Todos los archivos subidos (banners y adjuntos de tickets) se almacenan en OneDrive usando Microsoft Graph API.
- Se utiliza un usuario y carpeta raíz configurables por variables de entorno (`ONEDRIVE_USER_EMAIL`, `ONEDRIVE_ROOT_FOLDER`).
- Para tickets, los archivos se guardan en subcarpetas por ticket (`<root>/<ticket_xxx>/archivo.ext`).
- El campo `filePath` en la base de datos ahora almacena el enlace de vista previa de OneDrive (no la ruta local).
- No se almacena ningún archivo en disco local.
- El servicio `GraphService` centraliza la lógica de integración con OneDrive (búsqueda de usuario, validación/creación de carpetas, subida de archivos, obtención de links de vista previa).
- Se validan las variables de entorno requeridas al inicio y en cada operación de subida.

### Variables de entorno relevantes

- `ONEDRIVE_USER_EMAIL` — email del usuario de OneDrive donde se almacenan los archivos.
- `ONEDRIVE_ROOT_FOLDER` — nombre de la carpeta raíz en OneDrive (por ejemplo, `FilesConectaCCI`).

### Ejemplo de flujo para adjuntos de tickets

1. El usuario sube archivos al crear un ticket (endpoint `/tickets/complete`).
2. El backend crea una subcarpeta en OneDrive para el ticket si no existe.
3. Cada archivo se sube a esa subcarpeta y se obtiene un enlace de vista previa.
4. El enlace se guarda en la base de datos y se expone en la API.

### Ejemplo de flujo para banners

1. El usuario sube una imagen al crear/editar un banner.
2. El backend valida la carpeta raíz y sube la imagen a OneDrive.
3. El enlace de vista previa se guarda en el campo `imagePath` del banner.

---

Este documento resume la documentación técnica por módulo generada por el asistente.

## Resumen de módulos

- Tickets
- Ticket Notification
- Email
- General Lists
- Database / Migrations
- Tests

---

## Módulo: Tickets

Descripción
- Gestión CRUD y lógica de negocio de tickets (creación, actualización, asignación, comentarios, estados, prioridades).
- Expone endpoints REST para operar tickets y contiene servicios que implementan las reglas.

Archivos clave
- `src/Modules/Core/tickets/tickets.controller.ts` — endpoints HTTP.
- `src/Modules/Core/tickets/tickets.service.ts` — lógica de negocio, consultas a la base de datos.
- `src/Modules/Core/tickets/Dto/assign-ticket.dto.ts` — DTO para asignación (`AssignTicketDto`).
- `src/Modules/Core/tickets/Entity/ticket.entity.ts` — entidad TypeORM, enums (TicketStatus) y índices.
- `src/Modules/Core/tickets/ticket-notification.service.ts` — notificaciones relacionadas con tickets.

API pública / Endpoints relevantes
- GET `/tickets/available-by-type/:ticketTypeId` — devuelve usuarios que pueden atender un tipo de ticket (implementado con paginación `page` y `limit`).
- Endpoints CRUD para tickets (crear, actualizar, listar, ver).
- Endpoint de asignación que consume `AssignTicketDto` en el body.

Nuevos endpoints agregados
- `PATCH /tickets/:id/reassign` — Reasigna un ticket a otro usuario. Body: `AssignTicketDto { assigneeId: number }`. Requiere autenticación y permisos de reasignación. Respuesta: `TicketResponseDto`.
- `POST /tickets/:id/request-feedback` — Solicita que el creador del ticket conteste la encuesta. Envía un email al creador con un enlace directo a la encuesta del ticket. Requiere autenticación. Respuesta: `TicketResponseDto`.

DTOs / Entidades principales
- `AssignTicketDto { assigneeId: number }` — validaciones por `class-validator`.
- `Ticket` entity — incluye `status` (enum: OPEN, IN_PROGRESS, FOLLOW_UP, COMPLETED, CLOSED, NON_CONFORMITY, CANCELLED), relaciones a usuarios, mensajes, etc.

Flujos importantes
- Asignación de ticket: valida usuario/ticket, actualiza asignación, añade participante y registra historial y mensaje del sistema.
 - Solicitud de encuesta (request-feedback): endpoint que permite a un usuario autorizado solicitar (manualmente) al creador del ticket que responda la encuesta. El backend envía la notificación por email al creador usando el sistema de notificaciones (plantilla `ticket-closed.hbs` por defecto, o plantilla dedicada si existe).
- Búsqueda de agentes por tipo: valida `TicketType` y devuelve usuarios activos paginados.

Consideraciones
- Revisar `src/Modules/Core/tickets/tickets.service.ts` si ha sido editado manualmente.

Pruebas recomendadas
- Unit tests para `getUsersByTicketType` y `assignTicket`.

---

## Módulo: Ticket Notification

Descripción
- Servicio encargado de construir y enviar notificaciones por eventos de tickets (creación, actualización, comentarios, cierre, asignación, estado).
- Usa `EmailService` para enviar emails con templates Handlebars.

Archivos clave
- `src/Modules/Core/tickets/ticket-notification.service.ts` — funciones de notificación.
- Plantillas HBS en `src/Modules/Core/email/templates/`.

Métodos principales
- `notifyTicketCreated`, `notifyTicketUpdated`, `notifyTicketStatusChanged`, `notifyTicketAssigned`, `notifyTicketCommented`, `notifyTicketClosed`.

Consideraciones
- Filtrado y validación de destinatarios antes de enviar.
- Registrar partials necesarios en `EmailService`.

Pruebas
- Añadir tests de integración y unit tests con `EmailService` mockeado.

---

## Módulo: Email

Descripción
- Encapsula el envío de correos mediante `@nestjs-modules/mailer` y templates Handlebars.
- Registra helpers/partials y mejora logging de errores de plantilla/SMTP.

Archivos clave
- `src/Modules/Core/email/email.service.ts` — lógica de envío y registro de partials.
- `src/Modules/Core/email/email.module.ts` — configuración del Mailer provider.
- `src/Modules/Core/email/templates/` — templates .hbs.

Consideraciones
- Se registró manualmente `base.hbs` como partial. Si hay más partials, automatizar su registro leyendo la carpeta `templates/partials`.
- Añadir reintentos/cola para envíos masivos.

Pruebas
- `test/email.service.spec.ts` (mock de `MailerService`).

---

## Módulo: General Lists

Descripción
- Manejo de listas generales del sistema (estados, prioridades, tipos) y sus opciones.

Archivos clave
- `src/Modules/Core/general-lists/general-lists.controller.ts`
- `src/Modules/Core/general-lists/list-options.controller.ts`
- `src/Modules/Core/general-lists/Dto/list-option.dto.ts`
- `src/Modules/Core/general-lists/Dto/general-list.dto.ts`
- `src/Modules/Core/general-lists/Entity/general-list.entity.ts`

Notas
- Se consolidó `ListOptionResponseDto` en `list-option.dto.ts` para evitar colisiones de Swagger.

Pruebas recomendadas
- Unit tests para los controladores y servicios de listas.

---

## Módulo: Database / Migrations

Descripción
- Contiene migraciones y configuración TypeORM.

Archivos clave
- `ormconfig.json` — configuración TypeORM (`synchronize` es false).
- `src/Modules/Database/Migrations/20250815000000-FixIndexFkConflict.ts` — migración para resolver conflictos de índice y FK.

Consideraciones
- Realizar backup antes de ejecutar migraciones que cambian constraints.

---

## Tests

- Tests unitarios se han creado y se recomiendan ejecutar con `npm test`.
- Recomendación: añadir más cobertura en `tickets.service` y `general-lists`.

---

## Acciones siguientes sugeridas
- Añadir tests unitarios adicionales para `tickets.service` (assignTicket, getUsersByTicketType), y para `ticket-notification.service`.
- Automatizar registro de partials Handlebars en `EmailService`.
- Probar y validar migración en entorno de staging con backup.

---

(Fin del documento)
