-- Migración para cambiar de entidades puente a relaciones directas many-to-many
-- Ejecutar este script para actualizar la estructura de base de datos

-- PASO 1: Crear respaldos de los datos existentes
CREATE TABLE backup_action_plan_responsibles AS SELECT * FROM action_plan_responsibles;
CREATE TABLE backup_follow_up_responsibles AS SELECT * FROM follow_up_responsibles;

-- PASO 2: Eliminar las tablas existentes de las entidades puente
DROP TABLE IF EXISTS action_plan_responsibles;
DROP TABLE IF EXISTS follow_up_responsibles;

-- PASO 3: TypeORM creará automáticamente las nuevas tablas junction cuando inicie la aplicación
-- Las tablas se crearán con los nombres especificados en @JoinTable:
-- - action_plan_responsibles (con actionPlanId y userId)
-- - follow_up_responsibles (con followUpId y userId)

-- PASO 4: Migrar datos de los respaldos (opcional)
-- Si hay datos existentes que necesiten migrarse, ejecutar después de que TypeORM cree las nuevas tablas:

-- INSERT INTO action_plan_responsibles (actionPlanId, userId)
-- SELECT actionPlanId, userId FROM backup_action_plan_responsibles;

-- INSERT INTO follow_up_responsibles (followUpId, userId)
-- SELECT followUpId, userId FROM backup_follow_up_responsibles;

-- PASO 5: Limpiar respaldos (opcional, después de verificar que todo funciona)
-- DROP TABLE backup_action_plan_responsibles;
-- DROP TABLE backup_follow_up_responsibles;

-- NOTA: Si las tablas junction ya existen y tienen la estructura correcta,
-- solo se necesita verificar que los datos estén en el formato correcto
-- (actionPlanId, userId) y (followUpId, userId)