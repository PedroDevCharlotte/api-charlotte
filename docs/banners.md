# Banners API

Documentación simple del módulo Banners (endpoints CRUD).

Base path: `/banners`

Campos aceptados (body / multipart):
- title (string) — requerido
- description (string) — opcional
- link (string) — opcional (URL)
- startDate (ISO string) — opcional; si no se provee al crear, se establece por defecto la fecha actual
- endDate (ISO string) — opcional
- status (string) — opcional; si se proveen fechas, se calcula automáticamente: `active` o `inactive`
- order (number) — opcional
- active (boolean) — opcional; la lógica basada en fechas puede sobreescribir este valor según reglas de negocio
- image (file) — opcional; multipart field name: `image`

Reglas de negocio importantes:
- Si `startDate` no se proporciona al crear un banner, se usa la fecha actual como `startDate`.
- `active`/`status` se calculan automáticamente en base a `startDate` y `endDate`:
  - Si `endDate` existe y es menor que la fecha actual → `active=false`, `status='inactive'`.
  - Si `startDate` existe y es mayor que la fecha actual → `active=false`, `status='inactive'`.
  - En otros casos → `active=true`, `status='active'`.
- Si el cliente envía explícitamente `active`, la implementación lo respetará al crear (siempre que no entre en conflicto con expiración/fechas); al actualizar se respeta si es provisto.

Endpoints

- GET /banners
  - Lista todos los banners ordenados por `order` y `id`.

- GET /banners/:id
  - Devuelve un banner por id.

- POST /banners
  - Crea un banner.
  - Content-Type: `multipart/form-data` si se envía `image`.
  - Campos en form-data: `title`, `description`, `link`, `startDate`, `endDate`, `status`, `order`, `active`, y `image` (archivo).

- PUT /banners/:id
  - Actualiza un banner (igual que POST respecto a fields y `image` field name).

- DELETE /banners/:id
  - Elimina el banner.

Ejemplo (Postman / curl multipart) — PowerShell:

```powershell
curl -X POST 'http://localhost:3000/banners' -F "image=@C:\path\to\img.jpg" -F "title=Prueba" -F "description=desc" -F "startDate=2025-08-25T00:00:00Z"
```

Notas de implementación:
- Las imágenes se guardan en `uploads/banners/YYYY/MM` con nombres únicos.
- `status` se guarda como string ('active'|'inactive') por defecto.
- Validaciones adicionales (URLs, formatos de fecha) pueden añadirse mediante `class-validator`.

