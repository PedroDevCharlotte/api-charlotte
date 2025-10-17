
# Módulo: Tickets

Propósito
- Lógica de negocio principal para tickets: crear, actualizar, asignar, cerrar, comentar y listar tickets.
- Ahora los archivos adjuntos de tickets se almacenan en OneDrive y se devuelve un enlace de vista previa en la respuesta.

## Cambios recientes
- Los adjuntos de tickets se suben a OneDrive en una subcarpeta por ticket (`<root>/<ticket_xxx>/archivo.ext`).
- El campo `filePath` de cada adjunto contiene el enlace de vista previa de OneDrive.
- No se almacena ningún archivo en disco local.
- Variables de entorno relevantes: `ONEDRIVE_USER_EMAIL`, `ONEDRIVE_ROOT_FOLDER`.

Archivos clave
- `src/Modules/Core/tickets/tickets.controller.ts` — endpoints REST.
- `src/Modules/Core/tickets/tickets.service.ts` — lógica principal y acceso a la BD.
- `src/Modules/Core/tickets/Entity/ticket.entity.ts` — entidad TypeORM, enum `TicketStatus`.
- `src/Modules/Core/tickets/Dto/assign-ticket.dto.ts` — `AssignTicketDto` usado por el endpoint de asignación.

Endpoints públicos (resumen)
- `GET /tickets/available-by-type/:ticketTypeId` — usuarios que pueden atender un tipo de ticket (soporta `page` y `limit`).
- Endpoints CRUD estándar: crear, actualizar, obtener, listar, eliminar (soft delete).
- El endpoint de asignación espera `AssignTicketDto` en el body.
- `POST /tickets/complete` — permite crear un ticket con adjuntos (archivos subidos vía multipart/form-data).

## Ejemplo de respuesta de adjunto

```json
{
	"id": 123,
	"ticketId": 1,
	"fileName": "attachment_20250827_abc123.pdf",
	"originalFileName": "manual.pdf",
	"filePath": "https://onedrive.live.com/preview?resid=...",
	"mimeType": "application/pdf",
	"fileSize": 123456,
	...
}
```

## Funciones importantes
- `create(createDto, currentUserId)` — valida creador, genera número de ticket, añade participantes, historial y mensaje del sistema.
- `getUsersByTicketType(ticketTypeId, page, limit)` — valida el tipo de ticket y devuelve usuarios activos paginados con soporte para ese tipo.
- `assignTicket(ticketId, assigneeId, currentUserId)` — comprueba permisos, actualiza asignado, asegura participante, registra historial y crea mensaje del sistema.

## Errores / casos bordes
- Las comprobaciones de permisos (`checkTicketAccess`, `checkEditPermissions`, `checkAssignPermissions`, `checkClosePermissions`) pueden lanzar `ForbiddenException`.
- `getUsersByTicketType` lanza `NotFoundException` si el tipo de ticket no existe.
- Asegurar límites razonables en la paginación.

## Pruebas sugeridas
- Tests unitarios para: `getUsersByTicketType` (existencia y paginación), `assignTicket` (camino feliz, asignado inexistente, permiso denegado), `createCompleteTicket` (camino feliz y falta de usuario por defecto).

## Notas operativas
- Usa el enum `TicketStatus` con los valores: OPEN, IN_PROGRESS, FOLLOW_UP, COMPLETED, CLOSED, NON_CONFORMITY, CANCELLED.
- Emite notificaciones vía `TicketNotificationService` para envío de emails de forma asíncrona.

## Comportamiento al crear mensajes
-------------------------------
- Cuando se crea un mensaje en un ticket:
	- Si el remitente es el usuario asignado al ticket y el estado actual es `IN_PROGRESS`, el estado del ticket se actualiza a `FOLLOW_UP` (solo la primera vez).
	- Si el remitente es el creador del ticket y el estado actual no es `IN_PROGRESS` ni `FOLLOW_UP`, el estado del ticket se actualiza a `IN_PROGRESS`.
	- Una vez que un ticket ha pasado por el estado `FOLLOW_UP`, no volverá automáticamente a `IN_PROGRESS` por mensajes del creador.
	- Ambos cambios de estado generan un mensaje del sistema y disparan notificaciones por correo a los participantes relevantes.

## Destinatarios de notificaciones por correo
-----------------------------------------
- Las notificaciones por email (tanto por cambios de estado como por nuevos comentarios) se envían a:
	- participantes del ticket,
	- el usuario asignado,
	- el creador del ticket.
- El actor que origina la acción (quien crea el mensaje o cambia el estado) se excluye de la lista de destinatarios.

