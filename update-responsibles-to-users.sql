-- Migración para cambiar las referencias de responsibleOptionId a userId en las tablas de responsables múltiples
-- Fecha: 2025-01-27
-- Propósito: Actualizar las relaciones de responsibles para que apunten a usuarios en lugar de opciones de lista

-- Eliminar constraints de clave foránea existentes si existen
ALTER TABLE action_plan_responsibles 
DROP CONSTRAINT IF EXISTS FK_action_plan_responsibles_responsibleOptionId;

ALTER TABLE follow_up_responsibles 
DROP CONSTRAINT IF EXISTS FK_follow_up_responsibles_responsibleOptionId;

-- Renombrar columnas responsibleOptionId a userId
ALTER TABLE action_plan_responsibles 
RENAME COLUMN responsibleOptionId TO userId;

ALTER TABLE follow_up_responsibles 
RENAME COLUMN responsibleOptionId TO userId;

-- Agregar nuevas constraints de clave foránea apuntando a la tabla de usuarios
ALTER TABLE action_plan_responsibles 
ADD CONSTRAINT FK_action_plan_responsibles_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE follow_up_responsibles 
ADD CONSTRAINT FK_follow_up_responsibles_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Comentarios de verificación
-- SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('action_plan_responsibles', 'follow_up_responsibles');
-- SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_NAME LIKE '%responsibles%';