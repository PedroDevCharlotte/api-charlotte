# Módulo de Tipos de Ticket

Este módulo proporciona un CRUD completo para gestionar los tipos de ticket en el sistema.

## 📋 Características

- ✅ CRUD completo (Crear, Leer, Actualizar, Eliminar)
- ✅ Validaciones robustas con DTOs
- ✅ Soft delete (activar/desactivar)
- ✅ Búsqueda por nombre y código
- ✅ Colores personalizables para UI
- ✅ Prioridades para ordenamiento
- ✅ Documentación Swagger completa
- ✅ Autenticación con JWT
- ✅ Seeding de datos iniciales

## 🎫 Tipos de Ticket Iniciales

El sistema viene con 4 tipos de ticket predefinidos:

| Nombre | Código | Color | Descripción |
|--------|--------|-------|-------------|
| Soporte | SUPPORT | #FF5722 (Rojo) | Tickets de soporte técnico |
| Proyecto | PROJECT | #2196F3 (Azul) | Tickets de desarrollo de proyectos |
| Reporte | REPORT | #4CAF50 (Verde) | Tickets para reportes y análisis |
| Marketing | MARKETING | #9C27B0 (Púrpura) | Tickets de actividades de marketing |

## 🚀 Endpoints API

### Crear Tipo de Ticket
```http
POST /ticket-types
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nuevo Tipo",
  "description": "Descripción del tipo",
  "code": "NEW_TYPE",
  "color": "#FF9800",
  "priority": 5
}
```

### Obtener Todos los Tipos de Ticket
```http
GET /ticket-types
Authorization: Bearer {token}

# Incluir inactivos
GET /ticket-types?includeInactive=true
```

### Obtener por ID
```http
GET /ticket-types/{id}
Authorization: Bearer {token}
```

### Obtener por Nombre
```http
GET /ticket-types/name/{nombre}
Authorization: Bearer {token}
```

### Obtener por Código
```http
GET /ticket-types/code/{codigo}
Authorization: Bearer {token}
```

### Actualizar Tipo de Ticket
```http
PATCH /ticket-types/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nombre Actualizado",
  "description": "Nueva descripción",
  "color": "#E91E63"
}
```

### Desactivar Tipo de Ticket
```http
PATCH /ticket-types/{id}/deactivate
Authorization: Bearer {token}
```

### Activar Tipo de Ticket
```http
PATCH /ticket-types/{id}/activate
Authorization: Bearer {token}
```

### Eliminar Tipo de Ticket
```http
DELETE /ticket-types/{id}
Authorization: Bearer {token}
```

### Obtener Estadísticas
```http
GET /ticket-types/statistics
Authorization: Bearer {token}
```

## 📊 Estructura de Datos

### TicketType Entity
```typescript
{
  id: number;
  name: string;           // Nombre único
  description?: string;   // Descripción opcional
  code?: string;          // Código único (ej: SUPPORT)
  color?: string;         // Color hex (ej: #FF5722)
  priority: number;       // Prioridad 0-999
  isActive: boolean;      // Estado activo/inactivo
  createdAt: Date;
  updatedAt: Date;
}
```

### Validaciones
- **name**: Requerido, máximo 100 caracteres, único
- **description**: Opcional, máximo 255 caracteres
- **code**: Opcional, máximo 20 caracteres, único
- **color**: Opcional, formato hexadecimal válido
- **priority**: Opcional, número entre 0-999
- **isActive**: Opcional, boolean (default: true)

## 🔧 Uso en Código

### Importar el Servicio
```typescript
import { TicketTypesService } from './ticket-types.service';

constructor(
  private readonly ticketTypesService: TicketTypesService
) {}
```

### Ejemplos de Uso
```typescript
// Obtener todos los tipos activos
const activeTypes = await this.ticketTypesService.findAll();

// Crear nuevo tipo
const newType = await this.ticketTypesService.create({
  name: 'Incidente',
  code: 'INCIDENT',
  color: '#F44336',
  priority: 1
});

// Buscar por código
const supportType = await this.ticketTypesService.findByCode('SUPPORT');
```

## 🎨 Colores Sugeridos

Para mantener consistencia en la UI, aquí tienes algunos colores recomendados:

| Color | Hex | Uso Sugerido |
|-------|-----|--------------|
| Rojo | #F44336 | Crítico/Urgente |
| Naranja | #FF9800 | Advertencia |
| Azul | #2196F3 | Información |
| Verde | #4CAF50 | Éxito/Completado |
| Púrpura | #9C27B0 | Marketing/Creativo |
| Gris | #607D8B | Archivo/Inactivo |

## 🔐 Seguridad

- Todos los endpoints requieren autenticación JWT
- Se validan todos los datos de entrada
- Prevención de duplicados por nombre y código
- Soft delete para preservar referencias

## 📝 Notas

- Los tipos de ticket se pueden usar como referencia en futuros módulos de tickets
- El campo `priority` permite personalizar el orden de visualización
- Los colores son compatibles con Material Design y otras librerías de UI
- El seeding automático garantiza que siempre haya tipos básicos disponibles
