# Análisis del Error: Foreign Key Constraint Failed

## Error Encontrado
```
QueryFailedError: Cannot add or update a child row: a foreign key constraint fails 
(`charlottecore`.`ticket_participants`, CONSTRAINT `FK_4e5f07696a97841345a25975a69` 
FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION)
```

## Causa del Problema
El error ocurre cuando se intenta insertar un participante en un ticket con un `userId` que **no existe** en la tabla `users`. Esto puede suceder por:

1. **Usuario eliminado**: El usuario existía pero fue eliminado de la base de datos
2. **Usuario inactivo**: El usuario existe pero está marcado como `active: false`
3. **ID incorrecto**: Se está enviando un ID de usuario que nunca existió
4. **Datos de prueba**: Se están usando IDs hardcodeados que no coinciden con la BD

## Mejoras Implementadas

### 1. Validaciones Mejoradas
Se agregaron validaciones específicas para cada tipo de participante:

```typescript
// Validación para creador
try {
  const creatorParticipant = await this.participantRepository.save(/* ... */);
} catch (error) {
  throw new BadRequestException(`Error al agregar el usuario creador como participante. Verifique que el usuario con ID ${createCompleteTicketDto.createdByUserId} existe.`);
}

// Validación para usuario asignado
if (assignedUser) {
  try {
    const assigneeParticipant = await this.participantRepository.save(/* ... */);
  } catch (error) {
    throw new BadRequestException(`Error al agregar el usuario asignado como participante. Verifique que el usuario con ID ${assignedUser.id} existe.`);
  }
}

// Validación para participantes adicionales
for (const participantDto of createCompleteTicketDto.participants) {
  const participantUser = await this.userRepository.findOne({
    where: { id: participantDto.userId }
  });
  if (!participantUser) {
    throw new NotFoundException(`Usuario participante con ID ${participantDto.userId} no encontrado`);
  }
}
```

### 2. Endpoint de Debug para Usuarios
Se agregó un endpoint temporal para verificar qué usuarios están disponibles:

**GET** `/tickets/debug/users`

Respuesta:
```json
{
  "totalUsers": 5,
  "users": [
    {
      "id": 1,
      "name": "Jorge Enrique Miguel",
      "email": "jorge@charlotte.com",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Jonathan Vizcalla",
      "email": "jonathan@charlotte.com", 
      "isActive": true
    }
  ]
}
```

### 3. Manejo de Errores Específicos
Ahora el sistema devuelve errores más claros:

```json
{
  "message": "Usuario participante con ID 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

## Cómo Diagnosticar el Problema

### Paso 1: Verificar Usuarios Disponibles
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3006/tickets/debug/users
```

### Paso 2: Verificar el Request que Falla
Revisar qué `userId` se está enviando en:
- `createdByUserId`
- `assignedTo` 
- `participants[].userId`

### Paso 3: Comparar con Usuarios Existentes
Asegurarse de que todos los IDs de usuario existen en la respuesta del paso 1.

## Soluciones Comunes

### 1. Usuario Inexistente
**Problema**: Se envía un ID que no existe
**Solución**: Usar IDs válidos de la tabla `users`

```javascript
// ❌ MAL - ID que no existe
{
  "createdByUserId": 999,
  "participants": [
    { "userId": 888, "role": "OBSERVER" }
  ]
}

// ✅ BIEN - IDs válidos
{
  "createdByUserId": 1,
  "participants": [
    { "userId": 2, "role": "OBSERVER" }
  ]
}
```

### 2. Usuario Inactivo
**Problema**: El usuario existe pero está inactivo
**Solución**: Activar usuario o usar otro activo

```sql
-- Verificar estado del usuario
SELECT id, firstName, lastName, active FROM users WHERE id = 1;

-- Activar usuario si es necesario
UPDATE users SET active = true WHERE id = 1;
```

### 3. Datos de Testing
**Problema**: Usar IDs hardcodeados en tests
**Solución**: Obtener IDs dinámicamente

```javascript
// ✅ Obtener usuarios válidos primero
const response = await fetch('/tickets/debug/users');
const data = await response.json();
const validUserId = data.users[0].id;

// Luego crear ticket
const ticketData = {
  title: "Test ticket",
  description: "Test description",
  ticketTypeId: 1,
  createdByUserId: validUserId, // ID dinámico válido
  participants: [
    { userId: data.users[1].id, role: "OBSERVER" } // Otro ID válido
  ]
};
```

## Ejemplo de Request Válido

```javascript
// 1. Primero obtener usuarios disponibles
const usersResponse = await fetch('/tickets/debug/users', {
  headers: { 'Authorization': 'Bearer ' + token }
});
const usersData = await usersResponse.json();

// 2. Crear FormData con IDs válidos
const formData = new FormData();
formData.append('title', 'Ticket de prueba');
formData.append('description', 'Descripción detallada del problema');
formData.append('ticketTypeId', '1');
formData.append('createdByUserId', usersData.users[0].id.toString());

// Participantes con IDs válidos
const participants = [
  { userId: usersData.users[1].id, role: 'OBSERVER' },
  { userId: usersData.users[2].id, role: 'COLLABORATOR' }
];
formData.append('participants', JSON.stringify(participants));

// 3. Enviar request
const response = await fetch('/tickets/complete', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
});
```

## Verificaciones en Base de Datos

### Consultar Usuarios Activos
```sql
SELECT id, firstName, lastName, email, active 
FROM users 
WHERE active = true 
ORDER BY id;
```

### Verificar Constraint de Foreign Key
```sql
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE CONSTRAINT_NAME = 'FK_4e5f07696a97841345a25975a69';
```

### Verificar Participantes Existentes
```sql
SELECT tp.*, u.firstName, u.lastName, u.active
FROM ticket_participants tp
LEFT JOIN users u ON tp.userId = u.id
WHERE tp.ticketId = [TICKET_ID];
```

## Prevención Future

### 1. Validación en Frontend
```javascript
// Validar IDs antes de enviar
function validateUserIds(data, availableUsers) {
  const availableIds = availableUsers.map(u => u.id);
  
  if (!availableIds.includes(data.createdByUserId)) {
    throw new Error(`Usuario creador ${data.createdByUserId} no válido`);
  }
  
  if (data.assignedTo && !availableIds.includes(data.assignedTo)) {
    throw new Error(`Usuario asignado ${data.assignedTo} no válido`);
  }
  
  if (data.participants) {
    for (const p of data.participants) {
      if (!availableIds.includes(p.userId)) {
        throw new Error(`Participante ${p.userId} no válido`);
      }
    }
  }
}
```

### 2. Tests Unitarios
```javascript
describe('Ticket Creation', () => {
  it('should fail with invalid user ID', async () => {
    const invalidTicketData = {
      title: 'Test',
      description: 'Test description',
      ticketTypeId: 1,
      createdByUserId: 999999 // ID que no existe
    };
    
    await expect(
      ticketsService.createCompleteTicket(invalidTicketData)
    ).rejects.toThrow('Usuario con ID 999999 no encontrado');
  });
});
```

## Monitoreo y Logs

Los errores ahora incluyen información específica:
- ID del usuario que causó el problema
- Tipo de participante (creador, asignado, adicional)
- Stack trace completo para debugging

```
Error agregando participante (userId: 999): QueryFailedError: Cannot add or update a child row...
```

¡Con estas mejoras, el error debería ser mucho más fácil de diagnosticar y resolver!
