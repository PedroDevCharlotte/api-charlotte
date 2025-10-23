# Implementación de Responsables Múltiples

## Resumen de Cambios

Se ha implementado la funcionalidad para asignar múltiples responsables a los ActionPlans y FollowUps en el sistema de No Conformidades.

## Cambios en Backend

### 1. Nuevas Entidades de Relación

**Archivo:** `src/Modules/Core/non-conformities/Entity/action-plan-responsible.entity.ts`
- Nueva entidad para gestionar la relación many-to-many entre ActionPlans y responsables (ListOptions)

**Archivo:** `src/Modules/Core/non-conformities/Entity/follow-up-responsible.entity.ts`
- Nueva entidad para gestionar la relación many-to-many entre FollowUps y responsables (ListOptions)

### 2. Entidades Actualizadas

**ActionPlan.entity.ts:**
- Agregada relación `responsibleAssignments: ActionPlanResponsible[]`
- Mantenidos campos legacy para compatibilidad

**FollowUp.entity.ts:**
- Agregada relación `responsibleAssignments: FollowUpResponsible[]`

### 3. Servicio Actualizado

**non-conformities.service.ts:**
- Agregadas funciones para manejar múltiples responsables:
  - `manageActionPlanResponsibles(actionPlanId, responsibleOptionIds)`
  - `manageFollowUpResponsibles(followUpId, responsibleOptionIds)`
- Actualizada función `loadActionPlansResponsibleOptions()` para cargar responsables múltiples
- Modificados métodos `create()` y `update()` para manejar `responsibleOptionIds` array

### 4. DTOs Actualizados

**Archivo:** `src/Modules/Core/non-conformities/dto/action-plan.dto.ts`
- Nuevos DTOs específicos para ActionPlan y FollowUp
- Campos agregados:
  - `responsibleOptionId?: number` (compatibilidad legacy)
  - `responsibleOptionIds?: number[]` (múltiples responsables)

**non-conformity.dto.ts:**
- Actualizado para usar los nuevos DTOs tipados

### 5. Módulos Actualizados

- `non-conformities.module.ts`: Agregadas nuevas entidades
- `app.module.ts`: Agregadas nuevas entidades al TypeORM

## Cambios en Frontend

### 1. Mapeo de Datos del API

**NewNonConformityStepper.tsx:**
- Actualizado mapeo para enviar múltiples responsables:
  ```tsx
  responsibleOptionId: plan.responsibles?.[0]?.id || null, // Compatibilidad
  responsibleOptionIds: plan.responsibles?.map((r: any) => r.id) || [] // Múltiples
  ```

### 2. Carga de Datos desde API

- Actualizado para cargar múltiples responsables desde `responsibleAssignments`
- Mantiene compatibilidad con responsable único legacy
- Fallback a `userOptions` si no hay datos del API

## Migración de Base de Datos

**Archivo:** `scripts/migrations/add-multiple-responsibles-2025-10-09.sql`

### Nuevas Tablas:
```sql
-- Tabla para responsables múltiples de ActionPlans
CREATE TABLE action_plan_responsibles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    actionPlanId INT NOT NULL,
    responsibleOptionId INT NOT NULL,
    FOREIGN KEY (actionPlanId) REFERENCES action_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (responsibleOptionId) REFERENCES list_options(id)
);

-- Tabla para responsables múltiples de FollowUps  
CREATE TABLE follow_up_responsibles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    followUpId INT NOT NULL,
    responsibleOptionId INT NOT NULL,
    FOREIGN KEY (followUpId) REFERENCES non_conformity_follow_ups(id) ON DELETE CASCADE,
    FOREIGN KEY (responsibleOptionId) REFERENCES list_options(id)
);
```

### Migración de Datos:
```sql
-- Migrar datos existentes de action_plans a action_plan_responsibles
INSERT INTO action_plan_responsibles (actionPlanId, responsibleOptionId)
SELECT id, responsibleOptionId 
FROM action_plans 
WHERE responsibleOptionId IS NOT NULL;
```

## Compatibilidad

### Backend:
- ✅ Mantiene campos `responsibleOptionId` legacy en las entidades
- ✅ Acepta tanto `responsibleOptionId` como `responsibleOptionIds` en los DTOs
- ✅ Los métodos existentes siguen funcionando

### Frontend:
- ✅ Mantiene interfaz existente (`responsibles: UserOption[]`)
- ✅ Envía tanto legacy como nuevos campos al API
- ✅ Carga datos con fallbacks apropiados

## Flujo de Datos

### Crear/Actualizar ActionPlan:
1. Frontend envía `responsibleOptionIds: [1, 2, 3]`
2. Backend crea/actualiza ActionPlan
3. Backend llama `manageActionPlanResponsibles()` con los IDs
4. Se crean registros en `action_plan_responsibles`

### Cargar ActionPlans:
1. Backend carga ActionPlans con `responsibleAssignments`
2. `loadActionPlansResponsibleOptions()` popula los responsables
3. Frontend mapea desde `responsibleAssignments` o fallback a legacy

## Testing

### Para Probar:
1. **Ejecutar migración SQL** en la base de datos
2. **Crear nueva No Conformidad** con múltiples responsables por ActionPlan
3. **Editar No Conformidad existente** y agregar/quitar responsables
4. **Verificar que datos legacy** siguen funcionando

### Casos de Prueba:
- [ ] Crear ActionPlan con 1 responsable
- [ ] Crear ActionPlan con múltiples responsables  
- [ ] Editar ActionPlan cambiando responsables
- [ ] Cargar No Conformidad existente (datos legacy)
- [ ] Verificar que responsables se muestran correctamente en frontend

## Notas de Desarrollo

- Los campos legacy se mantendrán hasta confirmar que todo funciona correctamente
- La migración de datos preserva la información existente
- El frontend ya manejaba arrays de responsables, solo se actualizó el mapeo del API
- Todos los cambios son retrocompatibles