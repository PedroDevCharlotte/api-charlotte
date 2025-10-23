# Ejemplo de Uso del Método Update con Responsables Múltiples

## 📋 Datos de Entrada del Formulario

El método `update` ahora está preparado para procesar datos como estos:

```json
{
  "actionPlans": [
    {
      "description": "Cambiar al personal, y capacitar al nuevo de forma correcta para evitar que la vuelvan a c@%&je$$$tear",
      "commitmentDate": "2025-10-15",
      "type": "principal",
      "responsibleOptionId": 2,
      "responsibleOptionIds": [2, 4]
    },
    {
      "description": "Capacitar constantemente cada cierto tiempo",
      "commitmentDate": "2025-10-29",
      "type": "secundaria",
      "responsibleOptionId": 3,
      "responsibleOptionIds": [3, 8, 9]
    }
  ]
}
```

## 🔄 Procesamiento Automático

El método `update` realizará las siguientes operaciones:

### 1. **Compatibilidad Legacy**
- ✅ Acepta tanto `responsibleOptionId` (individual) como `responsibleOptionIds` (múltiple)
- ✅ Convierte automáticamente a `userIds` internamente
- ✅ Combina ambos campos para evitar duplicados

### 2. **Gestión de ActionPlans**
- ✅ **CREAR**: Nuevos ActionPlans sin ID
- ✅ **ACTUALIZAR**: ActionPlans existentes con ID
- ✅ **ELIMINAR**: ActionPlans que no están en el request

### 3. **Responsables Múltiples**
- ✅ Elimina asignaciones previas
- ✅ Crea nuevas asignaciones para cada usuario
- ✅ Mantiene integridad referencial

## 📊 Ejemplo de Log de Procesamiento

```
🔄 Iniciando actualización de NonConformity ID: 123
📋 Datos recibidos: { actionPlans: [...] }
✅ Campos directos actualizados
🔄 Procesando actionPlans: 2 planes
📝 Procesando plan: Cambiar al personal, y capacitar al nuevo...
✅ ActionPlan actualizado - ID: 456
📝 Procesando plan: Capacitar constantemente cada cierto tiempo...
✅ ActionPlan creado - ID: 789
📊 Resumen ActionPlans:
   - Procesados: 2
   - Eliminados: 0
✅ NonConformity actualizada exitosamente
```

## 🎯 Estructura de Base de Datos Resultante

### ActionPlan
| id | nonConformityId | description | type | commitmentDate |
|----|-----------------|-------------|------|----------------|
| 456 | 123 | Cambiar al personal... | principal | 2025-10-15 |
| 789 | 123 | Capacitar constantemente... | secundaria | 2025-10-29 |

### ActionPlanResponsible (Junction Table)
| id | actionPlanId | userId |
|----|--------------|--------|
| 1  | 456          | 2      |
| 2  | 456          | 4      |
| 3  | 789          | 3      |
| 4  | 789          | 8      |
| 5  | 789          | 9      |

## ✅ Ventajas de la Implementación

1. **Retrocompatibilidad**: Acepta datos legacy del frontend
2. **Flexibilidad**: Maneja tanto responsables individuales como múltiples
3. **Robustez**: Logs detallados para debugging
4. **Integridad**: Eliminación automática de registros huérfanos
5. **Performance**: Operaciones batch optimizadas

## 🚀 Ready for Production

El método está listo para recibir datos del formulario y procesarlos correctamente con responsables múltiples.