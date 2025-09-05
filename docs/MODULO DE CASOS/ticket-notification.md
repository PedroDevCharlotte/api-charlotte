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

Pruebas
- Mockear `EmailService` para verificar que se llama con el nombre de plantilla y contexto correctos.
- Verificar que las direcciones inválidas son filtradas y registradas.

Próximos pasos
- Añadir reintentos/backoff para fallos transitorios del SMTP.
- Rastrear métricas (correos enviados, fallos) y exponerlas mediante logs/monitoring.
