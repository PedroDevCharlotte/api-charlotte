import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './Core/users/Entity/user.entity';
import { TicketType } from './Core/ticket-types/Entity/ticket-type.entity';

@Injectable()
export class UserHierarchySeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
  ) {}

  async seedUserHierarchyAndSupport(): Promise<void> {
    console.log('🔧 Iniciando seeding de jerarquía de usuarios y tipos de soporte...');

    try {
      // 1. Obtener usuarios existentes
      const users = await this.userRepository.find({
        where: { active: true },
        relations: ['role', 'department']
      });

      if (users.length === 0) {
        console.log('❌ No hay usuarios para configurar jerarquía');
        return;
      }

      // 2. Obtener tipos de ticket existentes
      const ticketTypes = await this.ticketTypeRepository.find({
        where: { isActive: true }
      });

      if (ticketTypes.length === 0) {
        console.log('❌ No hay tipos de ticket para configurar soporte');
        return;
      }

      // 3. Configurar una jerarquía de ejemplo
      // Buscar un usuario admin o de alto nivel como jefe
      const adminUser = users.find(user => 
        user.role?.name?.toLowerCase().includes('admin') ||
        user.role?.name?.toLowerCase().includes('gerente') ||
        user.role?.name?.toLowerCase().includes('jefe')
      ) || users[0]; // Si no hay admin, usar el primer usuario

      // Asignar otros usuarios como subordinados
      const subordinates = users.filter(user => user.id !== adminUser.id).slice(0, 3);
      
      for (const subordinate of subordinates) {
        subordinate.managerId = adminUser.id;
        await this.userRepository.save(subordinate);
        console.log(`👤 ${subordinate.firstName} ${subordinate.lastName} ahora reporta a ${adminUser.firstName} ${adminUser.lastName}`);
      }

      // 4. Asignar tipos de soporte a usuarios
      const supportType = ticketTypes.find(tt => tt.name.toLowerCase().includes('soporte'));
      const projectType = ticketTypes.find(tt => tt.name.toLowerCase().includes('proyecto'));
      const marketingType = ticketTypes.find(tt => tt.name.toLowerCase().includes('marketing'));

      // Asignar usuario por defecto para Soporte
      if (supportType) {
        const supportUser = users.find(user => 
          user.department?.name?.toLowerCase().includes('soporte') ||
          user.department?.name?.toLowerCase().includes('ti') ||
          user.department?.name?.toLowerCase().includes('sistemas')
        ) || users[0];

        supportType.defaultUserId = supportUser.id;
        await this.ticketTypeRepository.save(supportType);
        console.log(`🎫 Tipo 'Soporte' asignado por defecto a ${supportUser.firstName} ${supportUser.lastName}`);

        // Asignar múltiples usuarios que pueden dar soporte
        const supportUsers = users.slice(0, 2);
        supportType.supportUsers = supportUsers;
        await this.ticketTypeRepository.save(supportType);
        console.log(`👥 ${supportUsers.length} usuarios pueden dar soporte al tipo 'Soporte'`);
      }

      // Asignar usuario por defecto para Proyecto
      if (projectType) {
        const projectUser = users.find(user => 
          user.department?.name?.toLowerCase().includes('desarrollo') ||
          user.department?.name?.toLowerCase().includes('proyecto')
        ) || users[1] || users[0];

        projectType.defaultUserId = projectUser.id;
        await this.ticketTypeRepository.save(projectType);
        console.log(`🎫 Tipo 'Proyecto' asignado por defecto a ${projectUser.firstName} ${projectUser.lastName}`);
      }

      // Asignar usuario por defecto para Marketing
      if (marketingType) {
        const marketingUser = users.find(user => 
          user.department?.name?.toLowerCase().includes('marketing') ||
          user.department?.name?.toLowerCase().includes('ventas')
        ) || users[2] || users[0];

        marketingType.defaultUserId = marketingUser.id;
        await this.ticketTypeRepository.save(marketingType);
        console.log(`🎫 Tipo 'Marketing' asignado por defecto a ${marketingUser.firstName} ${marketingUser.lastName}`);
      }

      // 5. Asignar tipos de soporte que cada usuario puede manejar
      for (let i = 0; i < users.length && i < ticketTypes.length; i++) {
        const user = users[i];
        const assignedTypes = ticketTypes.slice(i, i + 2); // Cada usuario puede manejar 1-2 tipos
        
        user.supportTypes = assignedTypes;
        await this.userRepository.save(user);
        console.log(`👤 ${user.firstName} ${user.lastName} puede dar soporte a: ${assignedTypes.map(t => t.name).join(', ')}`);
      }

      console.log('✅ Seeding de jerarquía y soporte completado exitosamente');

    } catch (error) {
      console.error('❌ Error durante el seeding de jerarquía y soporte:', error);
      throw error;
    }
  }

  /**
   * Método para limpiar las relaciones de jerarquía y soporte
   */
  async clearHierarchyAndSupport(): Promise<void> {
    console.log('🧹 Limpiando jerarquía y tipos de soporte...');

    try {
      // Limpiar managerId de todos los usuarios
      await this.userRepository.update({}, { managerId: undefined });

      // Limpiar defaultUserId de todos los tipos de ticket
      await this.ticketTypeRepository.update({}, { defaultUserId: undefined });

      // Limpiar relaciones many-to-many
      const users = await this.userRepository.find({ relations: ['supportTypes'] });
      for (const user of users) {
        user.supportTypes = [];
        await this.userRepository.save(user);
      }

      console.log('✅ Limpieza completada');

    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
      throw error;
    }
  }
}
