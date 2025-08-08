import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from './Common/Auth/auth.guard';
import { UserHierarchySeederService } from './Modules/user-hierarchy-seeder.service';
import { UsersService } from './Modules/Core/users/users.service';
import { TicketTypesService } from './Modules/Core/ticket-types/ticket-types.service';

@ApiTags('Hierarchy Tests')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('hierarchy-test')
export class HierarchyTestController {
  constructor(
    private readonly userHierarchySeederService: UserHierarchySeederService,
    private readonly usersService: UsersService,
    private readonly ticketTypesService: TicketTypesService,
  ) {}

  @Post('seed')
  @ApiOperation({ summary: 'Ejecutar seeding de jerarquía y soporte' })
  async seedHierarchy() {
    try {
      await this.userHierarchySeederService.seedUserHierarchyAndSupport();
      return { message: 'Seeding de jerarquía completado exitosamente' };
    } catch (error) {
      return { message: 'Error durante el seeding', error: error.message };
    }
  }

  @Post('clear')
  @ApiOperation({ summary: 'Limpiar relaciones de jerarquía y soporte' })
  async clearHierarchy() {
    try {
      await this.userHierarchySeederService.clearHierarchyAndSupport();
      return { message: 'Limpieza de jerarquía completada exitosamente' };
    } catch (error) {
      return { message: 'Error durante la limpieza', error: error.message };
    }
  }

  @Get('users/:id/hierarchy')
  @ApiOperation({ summary: 'Obtener información completa de jerarquía de un usuario' })
  async getUserHierarchy(@Param('id') id: number) {
    try {
      const user = await this.usersService.findById(id);
      const manager = await this.usersService.getManager(id);
      const subordinates = await this.usersService.getSubordinates(id);
      const supportTypes = await this.usersService.getUserSupportTypes(id);

      return {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.name,
          department: user.department?.name
        },
        manager: manager ? {
          id: manager.id,
          name: `${manager.firstName} ${manager.lastName}`,
          email: manager.email,
          role: manager.role?.name
        } : null,
        subordinates: subordinates.map(sub => ({
          id: sub.id,
          name: `${sub.firstName} ${sub.lastName}`,
          email: sub.email,
          role: sub.role?.name
        })),
        supportTypes: supportTypes.map(type => ({
          id: type.id,
          name: type.name,
          code: type.code
        }))
      };
    } catch (error) {
      return { message: 'Error obteniendo jerarquía', error: error.message };
    }
  }

  @Get('ticket-types/with-defaults')
  @ApiOperation({ summary: 'Obtener tipos de ticket con usuarios por defecto' })
  async getTicketTypesWithDefaults() {
    try {
      const ticketTypes = await this.ticketTypesService.findAll();
      
      return ticketTypes.map(type => ({
        id: type.id,
        name: type.name,
        code: type.code,
        defaultUser: type.defaultUser ? {
          id: type.defaultUser.id,
          name: `${type.defaultUser.firstName} ${type.defaultUser.lastName}`,
          email: type.defaultUser.email
        } : null,
        supportUsersCount: type.supportUsers?.length || 0,
        supportUsers: type.supportUsers?.slice(0, 3).map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        })) || []
      }));
    } catch (error) {
      return { message: 'Error obteniendo tipos de ticket', error: error.message };
    }
  }
}
