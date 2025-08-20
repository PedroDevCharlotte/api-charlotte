# Esquema de la base de datos (resumen)

> Diagrama ER disponible en `docs/er-diagram.mmd` y exportable a SVG/PNG.
> Ver también `docs/er-diagram-instructions.md` para pasos de exportación.

Esta sección resume las tablas principales, columnas clave, relaciones y índices encontrados en el código.

## Tablas principales

### `tickets`
- id (PK, int, auto)
- ticketNumber (string, unique)
- title (string)
- description (text)
- status (enum: OPEN, IN_PROGRESS, FOLLOW_UP, COMPLETED, CLOSED, NON_CONFORMITY, CANCELLED)
- priority (enum: LOW, MEDIUM, HIGH, URGENT, CRITICAL)
- ticketTypeId (FK -> `ticket_types.id`)
- createdBy (FK -> `users.id`)
- assignedTo (FK -> `users.id`, nullable)
- departmentId (FK -> `departments.id`, nullable)
- dueDate (datetime, nullable)
- resolvedAt (datetime, nullable)
- closedAt (datetime, nullable)
- estimatedHours (int, nullable)
- actualHours (int, nullable)
- tags (json, nullable)
- notificationsEnabled (boolean)
- isUrgent (boolean)
- isInternal (boolean)
- customFields (json, nullable)
- createdAt (timestamp)
- updatedAt (timestamp)
- parentTicketId (FK -> `tickets.id`, nullable)

Indexes:
- idx_status_priority (status, priority)
- idx_createdBy_status (createdBy, status)
- idx_assignedTo_status (assignedTo, status)
- idx_departmentId_status (departmentId, status)

Relaciones:
- ticketType: ManyToOne -> `ticket_types`
- creator: ManyToOne -> `users`
- assignee: ManyToOne -> `users`
- department: ManyToOne -> `departments`
- messages: OneToMany -> `ticket_messages`
- participants: OneToMany -> `ticket_participants`
- attachments: OneToMany -> `ticket_attachments`
- history: OneToMany -> `ticket_history`
- parentTicket/childTickets: self-relation

---

### `ticket_participants`
- id (PK)
- ticketId (FK -> tickets.id)
- userId (FK -> users.id)
- role (enum: CREATOR, ASSIGNEE, COLLABORATOR, OBSERVER, APPROVER, REVIEWER)
- canComment (boolean)
- canEdit (boolean)
- canClose (boolean)
- canAssign (boolean)
- receiveNotifications (boolean)
- joinedAt (timestamp)
- removedAt (datetime, nullable)
- addedBy (FK -> users.id, nullable)

Constraints:
- Unique(ticketId, userId)
- Index(ticketId, role)

---

### `ticket_messages`
- id (PK)
- ticketId (FK -> tickets.id)
- senderId (FK -> users.id)
- content (text)
- type (enum: COMMENT, SYSTEM, ATTACHMENT, STATUS_CHANGE, ASSIGNMENT, ESCALATION)
- metadata (json, nullable)
- isInternal (boolean)
- isEdited (boolean)
- replyToId (FK -> ticket_messages.id, nullable)
- editedBy (FK -> users.id, nullable)
- editedAt (datetime, nullable)
- createdAt, updatedAt, deletedAt

Indexes:
- idx_ticketId_createdAt
- idx_senderId
- idx_type

Relations:
- replies: OneToMany self-relation
- reads: OneToMany -> ticket_message_read
- attachments: OneToMany -> ticket_attachments

---

### `ticket_attachments`
- id (PK)
- ticketId (FK -> tickets.id)
- messageId (FK -> ticket_messages.id, nullable)
- uploadedById (FK -> users.id)
- fileName, originalFileName, filePath, mimeType
- fileSize (bigint)
- fileHash (string, nullable)
- isPublic (boolean)
- description (text, nullable)
- uploadedAt (timestamp)
- deletedAt (datetime, nullable)

Indexes:
- idx_ticketId, idx_messageId, idx_uploadedById

---

### `ticket_history`
- id (PK)
- ticketId (FK -> tickets.id)
- userId (FK -> users.id, nullable)
- action (enum: CREATED, UPDATED, STATUS_CHANGED, ASSIGNED, ...)
- oldValues (json, nullable)
- newValues (json, nullable)
- description (text, nullable)
- metadata (json, nullable)
- ipAddress (string, nullable)
- userAgent (text, nullable)
- createdAt (timestamp)

Indexes:
- idx_ticketId_createdAt
- idx_userId
- idx_action

---

### `ticket_types`
- id (PK)
- name (string, unique)
- description (string, nullable)
- code (string, nullable)
- color (string nullable)
- priority (int)
- defaultUserId (FK -> users.id, nullable)
- isActive (boolean)
- createdAt, updatedAt

Relations:
- defaultUser: ManyToOne -> users
- supportUsers: ManyToMany -> users (join table `user_support_types`)

---

### `users`
- id (PK)
- firstName, lastName
- email (unique)
- password
- roleId (FK -> roles.id)
- departmentId (FK -> departments.id)
- managerId (FK -> users.id, nullable)
- active (boolean)
- isBlocked (boolean)
- twoFactorSecret, temp2FASecret, isTwoFactorEnabled, last2FAVerifiedAt
- trustedDevices (simple-array, nullable)
- isFirstLogin (boolean)
- CreatedAt, UpdateAt

Relations:
- role: ManyToOne -> roles
- department: ManyToOne -> departments
- supportTypes: ManyToMany -> ticket_types (user_support_types)
- defaultForTicketTypes: OneToMany -> ticket_types

---

## Tablas auxiliares y otras entidades
- `roles`, `departments`, `user_support_types` (join table), `ticket_message_read`, `general_lists`, `list_options`, `entity_definitions`, etc. — revisar entidades en `src/Modules/Core` para detalles adicionales.

---

## Notas
- Esta es una vista simplificada basada en las entidades TypeORM encontradas en el código. Para un diagrama ER completo se recomienda generar un diagrama a partir de la base de datos real o usar una herramienta que analice las entidades (p.ej. TypeORM Modeler).
- Antes de aplicar migraciones en producción, realice un backup y pruebe en staging.
