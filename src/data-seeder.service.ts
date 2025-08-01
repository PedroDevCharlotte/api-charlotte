import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './Modules/Core/roles/Entity/role.entity';
import { Department } from './Modules/Core/departments/Entity/department.entity';
import { User } from './Modules/Core/users/Entity/user.entity';

@Injectable()
export class DataSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    try {
      console.log('🌱 Iniciando seeding de datos...');
      
      // Verificar si ya hay datos
      const roleCount = await this.roleRepository.count();
      const departmentCount = await this.departmentRepository.count();
      
      if (roleCount === 0) {
        await this.seedRoles();
      }
      
      if (departmentCount === 0) {
        await this.seedDepartments();
      }
      
      // Actualizar usuarios existentes que no tengan roleId
      await this.updateExistingUsers();
      
      console.log('✅ Seeding completado exitosamente');
    } catch (error) {
      console.error('❌ Error durante el seeding:', error);
    }
  }

  private async seedRoles() {
    console.log('📋 Insertando roles iniciales...');
    
    const roles = [
      'Administrador del Sistema',
      'Director General',
      'Gerente',
      'Supervisor',
      'Jefe de Departamento',
      'Coordinador',
      'Analista',
      'Especialista',
      'Técnico',
      'Asistente',
      'Empleado',
      'Operador',
      'Consultor',
      'Usuario Final',
      'Solo Lectura'
    ];

    const rolePermissions = {
      'Administrador del Sistema': [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'roles.create', 'roles.read', 'roles.update', 'roles.delete',
        'departments.create', 'departments.read', 'departments.update', 'departments.delete',
        'audit.read', 'system.manage'
      ],
      'Director General': [
        'users.read', 'users.update',
        'roles.read', 'departments.read',
        'audit.read', 'reports.view'
      ],
      'Gerente': [
        'users.read', 'users.update',
        'departments.read', 'reports.view'
      ],
      'Supervisor': [
        'users.read', 'departments.read'
      ],
      'Jefe de Departamento': [
        'users.read', 'departments.read'
      ],
      'Coordinador': [
        'users.read'
      ],
      'Analista': [
        'users.read'
      ],
      'Especialista': [
        'users.read'
      ],
      'Técnico': [
        'users.read'
      ],
      'Asistente': [
        'users.read'
      ],
      'Empleado': [
        'users.read'
      ],
      'Operador': [
        'users.read'
      ],
      'Consultor': [
        'users.read'
      ],
      'Usuario Final': [
        'users.read'
      ],
      'Solo Lectura': [
        'users.read'
      ]
    };

    for (const roleName of roles) {
      const roleEntity = this.roleRepository.create({
        name: roleName,
        description: `Rol de ${roleName}`,
        permissions: rolePermissions[roleName] || ['users.read'],
        isActive: true
      });
      
      await this.roleRepository.save(roleEntity);
      console.log(`  ✓ Rol creado: ${roleName}`);
    }
  }

  private async seedDepartments() {
    console.log('🏢 Insertando departamentos iniciales...');
    
    const departments = [
      'Administración',
      'Recursos Humanos',
      'Finanzas y Contabilidad',
      'Tecnología de la Información',
      'Marketing y Ventas',
      'Operaciones y Producción',
      'Logística y Almacén',
      'Calidad y Control',
      'Investigación y Desarrollo',
      'Compras y Adquisiciones',
      'Atención al Cliente',
      'Legal y Cumplimiento',
      'Seguridad y Salud Ocupacional',
      'Mantenimiento',
      'Dirección General'
    ];

    const departmentCodes = {
      'Administración': 'ADM',
      'Recursos Humanos': 'RH',
      'Finanzas y Contabilidad': 'FIN',
      'Tecnología de la Información': 'IT',
      'Marketing y Ventas': 'MKT',
      'Operaciones y Producción': 'OPR',
      'Logística y Almacén': 'LOG',
      'Calidad y Control': 'QC',
      'Investigación y Desarrollo': 'I+D',
      'Compras y Adquisiciones': 'COM',
      'Atención al Cliente': 'CUS',
      'Legal y Cumplimiento': 'LEG',
      'Seguridad y Salud Ocupacional': 'SSO',
      'Mantenimiento': 'MTO',
      'Dirección General': 'DIR'
    };

    for (const deptName of departments) {
      const deptEntity = this.departmentRepository.create({
        name: deptName,
        description: `Departamento de ${deptName}`,
        code: departmentCodes[deptName],
        isActive: true
      });
      
      await this.departmentRepository.save(deptEntity);
      console.log(`  ✓ Departamento creado: ${deptName} (${departmentCodes[deptName]})`);
    }
  }

  private async updateExistingUsers() {
    console.log('👥 Actualizando usuarios existentes...');
    
    // Obtener rol por defecto (Empleado) y departamento por defecto (Administración)
    const defaultRole = await this.roleRepository.findOne({ where: { name: 'Empleado' } });
    const defaultDepartment = await this.departmentRepository.findOne({ where: { name: 'Administración' } });
    
    if (!defaultRole || !defaultDepartment) {
      console.error('❌ No se encontraron rol o departamento por defecto');
      return;
    }

    // Buscar usuarios que no tengan roleId asignado
    const usersWithoutRole = await this.userRepository.find({
      where: { roleId: null as any }
    });

    console.log(`📊 Encontrados ${usersWithoutRole.length} usuarios sin rol asignado`);

    for (const user of usersWithoutRole) {
      // Asignar rol basado en el rol string existente o usar por defecto
      let assignedRole = defaultRole;
      
      // Intentar mapear el rol string existente a un rol de la nueva tabla
      if ((user as any).role) {
        const mappedRole = await this.roleRepository.findOne({ 
          where: { name: (user as any).role } 
        });
        if (mappedRole) {
          assignedRole = mappedRole;
        }
      }

      user.roleId = assignedRole.id;
      user.departmentId = defaultDepartment.id;
      
      await this.userRepository.save(user);
      console.log(`  ✓ Usuario actualizado: ${user.email} -> Rol: ${assignedRole.name}, Dept: ${defaultDepartment.name}`);
    }
  }
}
