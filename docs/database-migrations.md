# Base de datos y migraciones

Propósito
- Gestionar cambios de esquema de la BD y contener migraciones para correcciones (conflictos índice/FK).

Archivos clave
- `ormconfig.json` — configuración de TypeORM con `synchronize: false`.
- `src/Modules/Database/Migrations/20250815000000-FixIndexFkConflict.ts` — migración para dropear/volver a crear índice y FKs dependientes.

Guía importante
- Hacer siempre un backup de la BD antes de ejecutar migraciones que cambian constraints.
- Ejecutar migraciones en staging primero y verificar integridad.

Cómo ejecutar migraciones
- Usar los scripts del proyecto (revisar `package.json`). Comando de ejemplo:

```powershell
npm run typeorm migration:run
```

Riesgos
- Dropear/volver a crear constraints puede fallar si existen datos que violan las nuevas restricciones. Puede requerir intervención manual.
