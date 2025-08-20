# Módulo: Tickets

Propósito
- Lógica de negocio principal para tickets: crear, actualizar, asignar, cerrar, comentar y listar tickets.

Archivos clave
- `src/Modules/Core/tickets/tickets.controller.ts` — endpoints REST.
- `src/Modules/Core/tickets/tickets.service.ts` — lógica principal y acceso a la BD.
- `src/Modules/Core/tickets/Entity/ticket.entity.ts` — entidad TypeORM, enum `TicketStatus`.
- `src/Modules/Core/tickets/Dto/assign-ticket.dto.ts` — `AssignTicketDto` usado por el endpoint de asignación.

Endpoints públicos (resumen)
- `GET /tickets/available-by-type/:ticketTypeId` — usuarios que pueden atender un tipo de ticket (soporta `page` y `limit`).
- Endpoints CRUD estándar: crear, actualizar, obtener, listar, eliminar (soft delete).
- El endpoint de asignación espera `AssignTicketDto` en el body.

Funciones importantes
- `create(createDto, currentUserId)` — valida creador, genera número de ticket, añade participantes, historial y mensaje del sistema.
- `getUsersByTicketType(ticketTypeId, page, limit)` — valida el tipo de ticket y devuelve usuarios activos paginados con soporte para ese tipo.
- `assignTicket(ticketId, assigneeId, currentUserId)` — comprueba permisos, actualiza asignado, asegura participante, registra historial y crea mensaje del sistema.

Errores / casos bordes
- Las comprobaciones de permisos (`checkTicketAccess`, `checkEditPermissions`, `checkAssignPermissions`, `checkClosePermissions`) pueden lanzar `ForbiddenException`.
- `getUsersByTicketType` lanza `NotFoundException` si el tipo de ticket no existe.
- Asegurar límites razonables en la paginación.

Pruebas sugeridas
- Tests unitarios para: `getUsersByTicketType` (existencia y paginación), `assignTicket` (camino feliz, asignado inexistente, permiso denegado), `createCompleteTicket` (camino feliz y falta de usuario por defecto).

Notas operativas
- Usa el enum `TicketStatus` con los valores: OPEN, IN_PROGRESS, FOLLOW_UP, COMPLETED, CLOSED, NON_CONFORMITY, CANCELLED.
- Emite notificaciones vía `TicketNotificationService` para envío de emails de forma asíncrona.
