# Módulo: Email

Propósito
- Envío centralizado de correos usando `@nestjs-modules/mailer` y plantillas Handlebars; maneja partials y registro de helpers.

Archivos clave
- `src/Modules/Core/email/email.service.ts` — registra partials/helpers y expone `sendEmailWithTemplate`.
- `src/Modules/Core/email/email.module.ts` — configuración del proveedor Mailer.
- `src/Modules/Core/email/templates/` — plantillas Handlebars (p.ej. `base.hbs`, `ticket-created.hbs`).

Notas importantes
- El servicio registra manualmente el partial `base` (lee `templates/base.hbs`) para evitar errores de partial no encontrado.
- Se eliminó la opción incompatible `partialsDir` en la creación de `HandlebarsAdapter` y se registran los partials programáticamente.
- `sendEmailWithTemplate` registra errores detallados y vuelve a lanzar con contexto para facilitar el debug.

Variables de entorno
- Configuración SMTP (host, port, secure, user, pass) a través de `ConfigService`.
- `MAIL_FROM` u dirección remitente equivalente es requerida.

Pruebas
- Mockear `MailerService` y lecturas de sistema de archivos para testear el registro y el comportamiento de `sendEmailWithTemplate`.

Mejoras sugeridas
- Auto-registrar todos los partials presentes en `templates/partials/`.
- Implementar colas o reintentos para envíos de alto volumen.
