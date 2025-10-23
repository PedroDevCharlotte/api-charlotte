-- Migración para corregir Foreign Key Constraints - ON DELETE CASCADE
-- Fecha: 2025-10-09
-- Problema: Los constraints se crearon con ON DELETE NO ACTION, necesitan ser ON DELETE CASCADE

-- Primero, eliminar los constraints existentes
ALTER TABLE action_plan_responsibles 
DROP FOREIGN KEY FK_a57992eac9120230fd88f43cd0b;

ALTER TABLE follow_up_responsibles 
DROP FOREIGN KEY FK_seguimiento_responsables_followup; -- nombre puede variar

-- Volver a crear los constraints con ON DELETE CASCADE
ALTER TABLE action_plan_responsibles 
ADD CONSTRAINT FK_action_plan_responsibles_actionplan 
FOREIGN KEY (actionPlanId) REFERENCES action_plans(id) ON DELETE CASCADE;

ALTER TABLE action_plan_responsibles 
ADD CONSTRAINT FK_action_plan_responsibles_responsible 
FOREIGN KEY (responsibleOptionId) REFERENCES list_options(id);

ALTER TABLE follow_up_responsibles 
ADD CONSTRAINT FK_follow_up_responsibles_followup 
FOREIGN KEY (followUpId) REFERENCES non_conformity_follow_ups(id) ON DELETE CASCADE;

ALTER TABLE follow_up_responsibles 
ADD CONSTRAINT FK_follow_up_responsibles_responsible 
FOREIGN KEY (responsibleOptionId) REFERENCES list_options(id);

-- Verificar los constraints creados
SELECT 
    CONSTRAINT_NAME, 
    TABLE_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME,
    DELETE_RULE
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('action_plan_responsibles', 'follow_up_responsibles')
AND REFERENCED_TABLE_NAME IS NOT NULL;