# Script de Prueba para Validar Usuarios

## Verificar Usuarios Disponibles

Para diagnosticar y resolver el error de foreign key, sigue estos pasos:

### Paso 1: Verificar usuarios disponibles
```bash
curl -X GET "http://localhost:3006/tickets/debug/users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Paso 2: Usar endpoint de debug para FormData
```bash
curl -X POST "http://localhost:3006/tickets/complete-debug" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Ticket" \
  -F "description=Test description for debugging" \
  -F "ticketTypeId=1" \
  -F "createdByUserId=1"
```

### Paso 3: Crear ticket con datos válidos
```bash
# Usar IDs reales obtenidos del paso 1
curl -X POST "http://localhost:3006/tickets/complete" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Ticket Real" \
  -F "description=Descripción detallada del problema" \
  -F "ticketTypeId=1" \
  -F "createdByUserId=1" \
  -F "participants=[{\"userId\":2,\"role\":\"OBSERVER\"}]"
```

## Script JavaScript para Frontend

```javascript
// Función para crear ticket validando usuarios primero
async function createTicketSafely(ticketData, files = []) {
  try {
    // 1. Obtener usuarios disponibles
    const usersResponse = await fetch('/tickets/debug/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!usersResponse.ok) {
      throw new Error('No se pueden obtener usuarios disponibles');
    }
    
    const usersData = await usersResponse.json();
    console.log('Usuarios disponibles:', usersData);
    
    // 2. Validar que los IDs existen
    const availableIds = usersData.users.map(u => u.id);
    
    if (!availableIds.includes(ticketData.createdByUserId)) {
      throw new Error(`Usuario creador ${ticketData.createdByUserId} no existe. Usuarios disponibles: ${availableIds.join(', ')}`);
    }
    
    if (ticketData.assignedTo && !availableIds.includes(ticketData.assignedTo)) {
      throw new Error(`Usuario asignado ${ticketData.assignedTo} no existe. Usuarios disponibles: ${availableIds.join(', ')}`);
    }
    
    if (ticketData.participants) {
      for (const participant of ticketData.participants) {
        if (!availableIds.includes(participant.userId)) {
          throw new Error(`Participante ${participant.userId} no existe. Usuarios disponibles: ${availableIds.join(', ')}`);
        }
      }
    }
    
    // 3. Crear FormData con datos validados
    const formData = new FormData();
    
    // Campos requeridos
    formData.append('title', ticketData.title);
    formData.append('description', ticketData.description);
    formData.append('ticketTypeId', ticketData.ticketTypeId.toString());
    formData.append('createdByUserId', ticketData.createdByUserId.toString());
    
    // Campos opcionales
    if (ticketData.priority) formData.append('priority', ticketData.priority);
    if (ticketData.assignedTo) formData.append('assignedTo', ticketData.assignedTo.toString());
    if (ticketData.departmentId) formData.append('departmentId', ticketData.departmentId.toString());
    if (ticketData.isUrgent !== undefined) formData.append('isUrgent', ticketData.isUrgent.toString());
    if (ticketData.isInternal !== undefined) formData.append('isInternal', ticketData.isInternal.toString());
    if (ticketData.dueDate) formData.append('dueDate', ticketData.dueDate);
    if (ticketData.initialMessage) formData.append('initialMessage', ticketData.initialMessage);
    
    // Arrays como JSON
    if (ticketData.participants) formData.append('participants', JSON.stringify(ticketData.participants));
    if (ticketData.customFields) formData.append('customFields', JSON.stringify(ticketData.customFields));
    if (ticketData.tags) {
      ticketData.tags.forEach(tag => formData.append('tags', tag));
    }
    
    // Archivos
    files.forEach(file => formData.append('files', file));
    
    // 4. Crear ticket
    const response = await fetch('/tickets/complete', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error creando ticket: ${errorData.message}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error en createTicketSafely:', error);
    throw error;
  }
}

// Ejemplo de uso
const ticketData = {
  title: 'Problema con el sistema',
  description: 'Descripción detallada del problema que necesita resolución',
  ticketTypeId: 1,
  createdByUserId: 1, // ID que debe existir
  priority: 'HIGH',
  isUrgent: true,
  participants: [
    { userId: 2, role: 'OBSERVER' }, // ID que debe existir
    { userId: 3, role: 'COLLABORATOR' } // ID que debe existir
  ]
};

// Crear ticket con validación
createTicketSafely(ticketData, [])
  .then(result => {
    console.log('Ticket creado exitosamente:', result);
  })
  .catch(error => {
    console.error('Error creando ticket:', error.message);
  });
```

## Casos de Prueba

### Caso 1: Usuario inexistente
```javascript
const badTicketData = {
  title: 'Test',
  description: 'Test description',
  ticketTypeId: 1,
  createdByUserId: 999999 // ID que no existe
};

// Debería fallar con error claro
createTicketSafely(badTicketData);
```

### Caso 2: Participante inexistente
```javascript
const badParticipantData = {
  title: 'Test',
  description: 'Test description', 
  ticketTypeId: 1,
  createdByUserId: 1, // ID válido
  participants: [
    { userId: 888888, role: 'OBSERVER' } // ID que no existe
  ]
};

// Debería fallar con error específico
createTicketSafely(badParticipantData);
```

### Caso 3: Datos válidos
```javascript
// Primero obtener usuarios reales
fetch('/tickets/debug/users')
  .then(r => r.json())
  .then(data => {
    const validTicketData = {
      title: 'Ticket válido',
      description: 'Este ticket debería crearse sin problemas',
      ticketTypeId: 1,
      createdByUserId: data.users[0].id, // Primer usuario real
      participants: [
        { userId: data.users[1].id, role: 'OBSERVER' } // Segundo usuario real
      ]
    };
    
    return createTicketSafely(validTicketData);
  })
  .then(result => console.log('Éxito:', result))
  .catch(error => console.error('Error:', error));
```

## Debugging en Consola del Navegador

```javascript
// Verificar usuarios disponibles
fetch('/tickets/debug/users', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(data => {
  console.table(data.users);
  window.availableUsers = data.users; // Guardar para uso posterior
});

// Crear ticket con primer usuario disponible
const testTicket = {
  title: 'Test desde consola',
  description: 'Ticket de prueba creado desde la consola del navegador',
  ticketTypeId: 1,
  createdByUserId: window.availableUsers[0].id
};

createTicketSafely(testTicket).then(console.log).catch(console.error);
```

¡Con estas herramientas puedes diagnosticar y resolver completamente el error de foreign key!
