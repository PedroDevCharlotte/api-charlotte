# Documentación técnica del proyecto API Charlotte

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

DTOs / Entidades principales
- `AssignTicketDto { assigneeId: number }` — validaciones por `class-validator`.
- `Ticket` entity — incluye `status` (enum: OPEN, IN_PROGRESS, FOLLOW_UP, COMPLETED, CLOSED, NON_CONFORMITY, CANCELLED), relaciones a usuarios, mensajes, etc.

Flujos importantes
- Asignación de ticket: valida usuario/ticket, actualiza asignación, añade participante y registra historial y mensaje del sistema.
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
