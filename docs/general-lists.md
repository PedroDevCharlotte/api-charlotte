# Módulo: Listas Generales

Propósito
- Gestionar listas del sistema (estados, prioridades, tipos) y sus opciones.

Archivos clave
- `src/Modules/Core/general-lists/general-lists.controller.ts`
- `src/Modules/Core/general-lists/list-options.controller.ts`
- `src/Modules/Core/general-lists/Dto/list-option.dto.ts`
- `src/Modules/Core/general-lists/Dto/general-list.dto.ts`
- `src/Modules/Core/general-lists/Entity/general-list.entity.ts`

Notas
- Se consolidó `ListOptionResponseDto` en `list-option.dto.ts` para evitar errores de DTO duplicado en Swagger.
- Los controladores devuelven `ListOptionResponseDto` para recursos de opción y `GeneralListResponseDto` para listas.

Pruebas
- Añadir tests unitarios para operaciones CRUD en listas y opciones, incluyendo validaciones y comportamiento padre-hijo de opciones.
