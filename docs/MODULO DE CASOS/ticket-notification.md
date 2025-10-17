# Módulo: Notificaciones de Ticket

Propósito
- Construir y enviar notificaciones sobre eventos de tickets (creación, actualizaciones, asignación, comentarios, cambios de estado).

Archivos clave
- `src/Modules/Core/tickets/ticket-notification.service.ts` — servicio de notificaciones.
- Plantillas de correo usadas por las notificaciones: `src/Modules/Core/email/templates/*.hbs`.

Comportamiento
- Para cada evento de ticket (`created`, `updated`, `status_changed`, `assigned`, `commented`, `closed`) el método correspondiente prepara un contexto y llama a `EmailService.sendEmailWithTemplate`.
- Filtra y valida destinatarios antes de enviar; registra en logs las direcciones inválidas.
- Usa partials/helpers registrados por `EmailService` para renderizar las plantillas.

Nuevas integraciones y endpoints
- Reasignación: `PATCH /tickets/:id/reassign` invoca la lógica de reasignación en `TicketsService.assignTicket` y, tras actualizar el ticket, dispara la notificación de reasignación (`notifyTicketAssigned`) que envía un email al nuevo asignado y notifica a participantes relevantes.
- Solicitud de encuesta: `POST /tickets/:id/request-feedback` permite enviar manualmente una notificación al creador del ticket con el enlace a la encuesta. Este endpoint llama a `TicketsService.requestFeedback` que delega en `TicketNotificationService` para enviar el correo (por defecto utiliza `ticket-closed.hbs` si es apropiado).

Mejoras en `EmailService` relacionadas con templates
- Resolución resiliente de templates: en tiempo de ejecución `EmailService` ahora busca plantillas `.hbs` en múltiples rutas candidatas (fuente `src/.../templates` y rutas compiladas `dist/.../templates`) para evitar errores cuando se ejecuta desde la carpeta de build.
- Fallback de render manual: si el adaptador del mailer falla al compilar la plantilla, el servicio intenta renderizar la plantilla con Handlebars directamente como fallback y registra el error original.
- Postbuild: se añadió/puede añadirse un script postbuild que copia los `.hbs` desde `src/Modules/Core/email/templates` a la carpeta `dist` para asegurar que las plantillas estén disponibles en producción.

Pruebas
- Mockear `EmailService` para verificar que se llama con el nombre de plantilla y contexto correctos.
- Verificar que las direcciones inválidas son filtradas y registradas.

Próximos pasos
- Añadir reintentos/backoff para fallos transitorios del SMTP.
- Rastrear métricas (correos enviados, fallos) y exponerlas mediante logs/monitoring.
