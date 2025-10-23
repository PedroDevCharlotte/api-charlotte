-- Migración para agregar responsables múltiples a ActionPlans y FollowUps
-- Fecha: 2025-10-09

-- Crear tabla para responsables múltiples de ActionPlans
CREATE TABLE action_plan_responsibles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    actionPlanId INT NOT NULL,
    responsibleOptionId INT NOT NULL,
    INDEX idx_action_plan_id (actionPlanId),
    INDEX idx_responsible_option_id (responsibleOptionId),
    FOREIGN KEY (actionPlanId) REFERENCES action_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (responsibleOptionId) REFERENCES list_options(id)
);

-- Crear tabla para responsables múltiples de FollowUps
CREATE TABLE follow_up_responsibles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    followUpId INT NOT NULL,
    responsibleOptionId INT NOT NULL,
    INDEX idx_follow_up_id (followUpId),
    INDEX idx_responsible_option_id (responsibleOptionId),
    FOREIGN KEY (followUpId) REFERENCES non_conformity_follow_ups(id) ON DELETE CASCADE,
    FOREIGN KEY (responsibleOptionId) REFERENCES list_options(id)
);

-- Migrar datos existentes de action_plans a action_plan_responsibles
INSERT INTO action_plan_responsibles (actionPlanId, responsibleOptionId)
SELECT id, responsibleOptionId 
FROM action_plans 
WHERE responsibleOptionId IS NOT NULL;

-- NOTA: Los campos legacy responsibleOptionId en action_plans y non_conformity_follow_ups
-- se mantendrán por compatibilidad pero eventualmente se podrán eliminar.
-- Para eliminarlos en el futuro, ejecutar:
-- ALTER TABLE action_plans DROP COLUMN responsibleOptionId;
-- ALTER TABLE non_conformity_follow_ups DROP COLUMN verifiedBy; -- si se agrega responsables múltiples a followUps