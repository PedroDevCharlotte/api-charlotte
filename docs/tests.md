# Estrategia de pruebas

Resumen
- Las pruebas unitarias están ubicadas en `test/` y reflejan módulos clave para pruebas unitarias enfocadas.
- Se recomiendan pruebas de integración/e2e para comportamientos transversales (notificaciones, migraciones DB).

Cómo ejecutar

```powershell
npm test
```

Archivos añadidos por el asistente
- `test/Modules/Core/tickets/tickets.service.spec.ts`
- `test/Modules/Core/email/email.service.spec.ts`
- `test/Modules/Core/general-lists/general-lists.service.spec.ts`

Recomendaciones
- Crear `test/utils` con fábricas de mocks para repositorios y utilidades de setup comunes.
- Usar una BD de pruebas (Docker) para pruebas de integración. Sembrar datos para validar migraciones y flujos.
- Añadir un paso en CI que ejecute `npm test` en los pull requests.
