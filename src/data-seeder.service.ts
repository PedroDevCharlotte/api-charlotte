import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './Modules/Core/roles/Entity/role.entity';
import { Department } from './Modules/Core/departments/Entity/department.entity';
import { User } from './Modules/Core/users/Entity/user.entity';
import { TicketType } from './Modules/Core/ticket-types/Entity/ticket-type.entity';
import { Ticket, TicketStatus, TicketPriority } from './Modules/Core/tickets/Entity/ticket.entity';
import { TicketParticipant, ParticipantRole } from './Modules/Core/tickets/Entity/ticket-participant.entity';
import { TicketMessage, MessageType } from './Modules/Core/tickets/Entity/ticket-message.entity';
import { GeneralList, ListCategory } from './Modules/Core/general-lists/Entity/general-list.entity';
import { ListOption } from './Modules/Core/general-lists/Entity/list-option.entity';
import { EntityDefinition } from './Modules/Core/general-lists/Entity/entity.entity';
import { FieldDefinition, FieldType } from './Modules/Core/general-lists/Entity/field-definition.entity';
import { UserHierarchySeederService } from './Modules/user-hierarchy-seeder.service';

@Injectable()
export class DataSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketParticipant)
    private readonly ticketParticipantRepository: Repository<TicketParticipant>,
    @InjectRepository(TicketMessage)
    private readonly ticketMessageRepository: Repository<TicketMessage>,
    @InjectRepository(GeneralList)
    private readonly generalListRepository: Repository<GeneralList>,
    @InjectRepository(ListOption)
    private readonly listOptionRepository: Repository<ListOption>,
    @InjectRepository(EntityDefinition)
    private readonly entityDefinitionRepository: Repository<EntityDefinition>,
    @InjectRepository(FieldDefinition)
    private readonly fieldDefinitionRepository: Repository<FieldDefinition>,
    private readonly userHierarchySeederService: UserHierarchySeederService,
  ) {}

  async onModuleInit() {
    try {
      console.log('🌱 Iniciando seeding de datos...');
      
      // Verificar si ya hay datos
      const roleCount = await this.roleRepository.count();
      const departmentCount = await this.departmentRepository.count();
      const ticketTypeCount = await this.ticketTypeRepository.count();
      const ticketCount = await this.ticketRepository.count();
      const generalListCount = await this.generalListRepository.count();
      
      // if (roleCount === 0) {
      //   await this.seedRoles();
      // }
      
      // if (departmentCount === 0) {
      //   await this.seedDepartments();
      // }

      // if (ticketTypeCount === 0) {
      //   await this.seedTicketTypes();
      // }

      // if (ticketCount === 0) {
      //   await this.seedExampleTickets();
      // }
      
      // if (departmentCount === 0) {
      //   await this.seedDepartments();
      // }

      // Seed de listas generales para tipos de ticket
      if (generalListCount === 0) {
        await this.seedTicketTypeLists();
      }

      // Seed de jerarquía de usuarios y tipos de soporte
      await this.userHierarchySeederService.seedUserHierarchyAndSupport();
      // }
      
      // Actualizar usuarios existentes que no tengan roleId
      // await this.updateExistingUsers();
      
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

  /**
   * Crear los tipos de ticket iniciales
   */
  private async seedTicketTypes() {
    console.log('🎫 Creando tipos de ticket...');
    
    const ticketTypes = [
      {
        name: 'Soporte',
        description: 'Tickets relacionados con soporte técnico y resolución de problemas',
        code: 'SUPPORT',
        color: '#FF5722',
        priority: 1
      },
      {
        name: 'Proyecto',
        description: 'Tickets relacionados con desarrollo de proyectos',
        code: 'PROJECT',
        color: '#2196F3',
        priority: 2
      },
      {
        name: 'Reporte',
        description: 'Tickets para solicitudes de reportes y análisis',
        code: 'REPORT',
        color: '#4CAF50',
        priority: 3
      },
      {
        name: 'Marketing',
        description: 'Tickets relacionados con actividades de marketing',
        code: 'MARKETING',
        color: '#9C27B0',
        priority: 4
      }
    ];

    for (const ticketTypeData of ticketTypes) {
      const existingTicketType = await this.ticketTypeRepository.findOne({
        where: { name: ticketTypeData.name }
      });

      if (!existingTicketType) {
        const ticketType = this.ticketTypeRepository.create(ticketTypeData);
        await this.ticketTypeRepository.save(ticketType);
        console.log(`  ✓ Tipo de ticket creado: ${ticketType.name}`);
      }
    }

    console.log('✅ Tipos de ticket creados exitosamente');
  }

  private async seedExampleTickets() {
    console.log('🎫 Creando tickets de ejemplo...');

    // Obtener datos necesarios
    const users = await this.userRepository.find({ take: 3 });
    const departments = await this.departmentRepository.find({ take: 2 });
    const ticketTypes = await this.ticketTypeRepository.find();

    if (users.length === 0 || departments.length === 0 || ticketTypes.length === 0) {
      console.log('⚠️ No se pueden crear tickets de ejemplo: faltan usuarios, departamentos o tipos de ticket');
      return;
    }

    const soporteType = ticketTypes.find(t => t.code === 'SUPPORT');
    const proyectoType = ticketTypes.find(t => t.code === 'PROJECT');
    const reporteType = ticketTypes.find(t => t.code === 'REPORT');

    const exampleTickets = [
      {
        title: 'Problema con acceso al sistema de inventario',
        description: 'Los usuarios reportan problemas intermitentes al acceder al módulo de inventario. Se observan timeouts frecuentes.',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        ticketTypeId: soporteType?.id || ticketTypes[0].id,
        departmentId: departments[0].id,
        createdBy: users[0].id,
        assignedTo: users[1].id,
        isUrgent: true,
        isInternal: false,
        tags: ['sistema', 'inventario', 'timeout'],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
      },
      {
        title: 'Desarrollo de nuevo módulo de reportes financieros',
        description: 'Implementar un módulo para generar reportes financieros automatizados con gráficos interactivos.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.MEDIUM,
        ticketTypeId: proyectoType?.id || ticketTypes[0].id,
        departmentId: departments[1].id,
        createdBy: users[1].id,
        assignedTo: users[2].id,
        isUrgent: false,
        isInternal: true,
        tags: ['desarrollo', 'reportes', 'financiero'],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      },
      {
        title: 'Reporte de ventas mensual - Marzo 2025',
        description: 'Generar el reporte consolidado de ventas del mes de marzo con comparativas del año anterior.',
        status: TicketStatus.WAITING_RESPONSE,
        priority: TicketPriority.MEDIUM,
        ticketTypeId: reporteType?.id || ticketTypes[0].id,
        departmentId: departments[0].id,
        createdBy: users[2].id,
        assignedTo: users[0].id,
        isUrgent: false,
        isInternal: false,
        tags: ['reporte', 'ventas', 'mensual'],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    ];

    let ticketCounter = 1;

    for (const ticketData of exampleTickets) {
      // Generar número de ticket único
      const year = new Date().getFullYear();
      const ticketNumber = `TKT-${year}-${ticketCounter.toString().padStart(4, '0')}`;
      
      const ticket = this.ticketRepository.create({
        ...ticketData,
        ticketNumber,
      });

      const savedTicket = await this.ticketRepository.save(ticket);
      console.log(`  ✓ Ticket creado: ${savedTicket.ticketNumber} - ${savedTicket.title}`);

      // Crear participantes para el ticket
      await this.createTicketParticipants(savedTicket, users);

      // Crear mensajes iniciales
      await this.createInitialMessages(savedTicket, users);

      ticketCounter++;
    }

    console.log('✅ Tickets de ejemplo creados exitosamente');
  }

  private async createTicketParticipants(ticket: Ticket, users: User[]) {
    // Agregar creador como participante
    const creatorParticipant = this.ticketParticipantRepository.create({
      ticketId: ticket.id,
      userId: ticket.createdBy,
      role: ParticipantRole.CREATOR,
      addedBy: ticket.createdBy,
      canEdit: true,
      canComment: true,
      canAssign: true,
      canClose: true,
      receiveNotifications: true,
    });
    
    await this.ticketParticipantRepository.save(creatorParticipant);

    // Agregar asignado como participante (si es diferente del creador)
    if (ticket.assignedTo && ticket.assignedTo !== ticket.createdBy) {
      const assigneeParticipant = this.ticketParticipantRepository.create({
        ticketId: ticket.id,
        userId: ticket.assignedTo,
        role: ParticipantRole.ASSIGNEE,
        addedBy: ticket.createdBy,
        canEdit: true,
        canComment: true,
        canAssign: false,
        canClose: true,
        receiveNotifications: true,
      });
      
      await this.ticketParticipantRepository.save(assigneeParticipant);
    }

    // Agregar un colaborador adicional
    const otherUser = users.find(u => u.id !== ticket.createdBy && u.id !== ticket.assignedTo);
    if (otherUser) {
      const collaboratorParticipant = this.ticketParticipantRepository.create({
        ticketId: ticket.id,
        userId: otherUser.id,
        role: ParticipantRole.COLLABORATOR,
        addedBy: ticket.createdBy,
        canEdit: false,
        canComment: true,
        canAssign: false,
        canClose: false,
        receiveNotifications: true,
      });
      
      await this.ticketParticipantRepository.save(collaboratorParticipant);
    }
  }

  private async createInitialMessages(ticket: Ticket, users: User[]) {
    // Mensaje inicial del sistema
    const systemMessage = this.ticketMessageRepository.create({
      ticketId: ticket.id,
      senderId: ticket.createdBy,
      content: `Ticket ${ticket.ticketNumber} creado`,
      type: MessageType.SYSTEM,
      isInternal: true,
      metadata: { action: 'ticket_created' },
    });
    await this.ticketMessageRepository.save(systemMessage);

    // Mensaje inicial del creador
    const initialMessage = this.ticketMessageRepository.create({
      ticketId: ticket.id,
      senderId: ticket.createdBy,
      content: `Se ha creado este ticket para ${ticket.title.toLowerCase()}. Se requiere atención para resolver el problema descrito.`,
      type: MessageType.COMMENT,
      isInternal: false,
    });
    await this.ticketMessageRepository.save(initialMessage);

    // Mensaje de asignación si hay asignado
    if (ticket.assignedTo && ticket.assignedTo !== ticket.createdBy) {
      const assignMessage = this.ticketMessageRepository.create({
        ticketId: ticket.id,
        senderId: ticket.createdBy,
        content: `Ticket asignado para revisión y resolución.`,
        type: MessageType.SYSTEM,
        isInternal: true,
        metadata: { action: 'assigned', assignedTo: ticket.assignedTo },
      });
      await this.ticketMessageRepository.save(assignMessage);
    }
  }

  private async seedTicketTypeLists() {
    console.log('📋 Insertando listas generales para tipos de ticket...');

    // Primero crear la entidad tickets
    const ticketEntity = this.entityDefinitionRepository.create({
      name: 'Tickets',
      tableName: 'tickets',
      description: 'Sistema de tickets y solicitudes',
      isActive: true,
    });
    await this.entityDefinitionRepository.save(ticketEntity);

    // Obtener todos los tipos de ticket existentes
    const ticketTypes = await this.ticketTypeRepository.find();

    // Definir las listas según el tipo de ticket
    const ticketTypeLists = {
      'Soporte': {
        listName: 'Categoría de incidencia',
        options: [
          'VPN/Internet',
          'Impresión',
          'Software',
          'Hardware',
          'Comunicaciones/telefonía',
          'Correo electrónico',
          'Pantallas',
          'SAP',
          'Aspel',
          'NetSuite',
          'Respaldos/ OneDrive'
        ]
      },
      'Reporte': {
        listName: 'Tipo de software involucrado',
        options: [
          'SAP',
          'Intranet',
          'NetSuite'
        ]
      },
      'Proyecto': {
        listName: 'Tipo de proyecto',
        options: [
          'Mejora continua',
          'Nueva funcionalidad',
          'Expansión'
        ]
      },
      'Marketing': {
        listName: 'Categorías',
        options: [
          'Identificación de oportunidades de mercado',
          'Evaluación de competencia',
          'Fluctuaciones en el precio',
          'Análisis de clientes y comportamiento de compra',
          'Solicitud de dirección',
          'Otro'
        ]
      },
      'CRI': {
        listName: 'Origen de la potencial desviación',
        options: [
          'Cliente',
          'Interna',
          'Proveedor'
        ]
      }
    };

    // Crear las listas y opciones para cada tipo de ticket
    for (const ticketType of ticketTypes) {
      const listConfig = ticketTypeLists[ticketType.name];
      
      if (listConfig) {
        console.log(`📝 Creando lista "${listConfig.listName}" para tipo de ticket "${ticketType.name}"`);

        // Crear la lista general
        const generalList = this.generalListRepository.create({
          code: `TICKET_${ticketType.name.toUpperCase()}_CATEGORY`,
          name: listConfig.listName,
          description: `Lista de opciones para tickets de tipo ${ticketType.name}`,
          category: ListCategory.CUSTOM,
          isSystemList: true,
          allowCustomValues: false,
          isActive: true,
        });
        await this.generalListRepository.save(generalList);

        // Crear las opciones de la lista
        for (let i = 0; i < listConfig.options.length; i++) {
          const option = listConfig.options[i];
          const listOption = this.listOptionRepository.create({
            listId: generalList.id,
            code: option.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
            value: option,
            displayText: option,
            description: `Opción ${option} para tickets de ${ticketType.name}`,
            isDefault: i === 0, // Primera opción como default
            isActive: true,
            sortOrder: i + 1,
          });
          await this.listOptionRepository.save(listOption);
        }

        // Crear la definición de campo para vincular la lista con los tickets
        const fieldDefinition = this.fieldDefinitionRepository.create({
          entityId: ticketEntity.id,
          fieldName: `${ticketType.name.toLowerCase()}_category`,
          displayName: listConfig.listName,
          fieldType: FieldType.SELECT,
          listId: generalList.id,
          isRequired: true,
          isActive: true,
          helpText: `Selecciona la categoría apropiada para este ticket de ${ticketType.name}`,
          sortOrder: 1,
        });
        await this.fieldDefinitionRepository.save(fieldDefinition);

        console.log(`✅ Lista "${listConfig.listName}" creada con ${listConfig.options.length} opciones`);
      }
    }

    console.log('✅ Todas las listas de tipos de ticket han sido creadas exitosamente');
  }
}
