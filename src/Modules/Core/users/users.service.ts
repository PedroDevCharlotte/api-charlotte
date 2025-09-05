import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';
import { Repository } from 'typeorm';
import { UserLoginDto } from '../auth/Dto/user-login.dto';
import { UserDto } from './Dto/user.dto';
import { UpdateUserDto } from './Dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { RespUserDto } from './Dto/RespUser.dto';
import { isError } from 'util';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { TicketType } from '../ticket-types/Entity/ticket-type.entity';
import {
  UserNotificationItem,
  ExpiringPasswordUser,
  PasswordExpirationCheckResult,
} from './interfaces/password-expiration.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
    private readonly mailService: MailerService, // Asegúrate de tener un servicio de correo
    private readonly emailService: EmailService, // Nuestro servicio de email mejorado
    private readonly auditService: AuditService, // Servicio de auditoría
  ) {}

  /**
   * Generar una contraseña temporal segura
   */
  private generateTemporaryPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Asegurar que tenga al menos un carácter de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Mayúscula
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Número
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Símbolo

    // Completar el resto de la longitud
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Mezclar los caracteres
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  async findOne(username: string): Promise<any | undefined> {
    return this.userRepository.findOne({ where: { email: username } });
  }

  async findAll(): Promise<any> {
    let response = {
      users: [] as RespUserDto[],
      isError: false,
      errorMessage: '',
    };

    try {
      let users = await this.userRepository.find({
        relations: [
          'role',
          'department',
          'manager',
          'subordinates',
          'supportTypes',
        ],
      });
      response.users = users.map((user) => {
        const respUser = new RespUserDto();
        respUser.id = user.id;
        respUser.firstName = user.firstName;
        respUser.lastName = user.lastName;
        respUser.email = user.email;
        respUser.roleId = user.role?.id || 0; // Obtener el nombre del rol
        respUser.role = user.role?.name || ''; // Obtener el nombre del rol
        respUser.departmentId = user.department?.id || 0; // Obtener el nombre del departamento
        respUser.department = user.department?.name || ''; // Obtener el nombre del rol
        respUser.isTwoFactorEnabled = user.isTwoFactorEnabled;
        respUser.last2FAVerifiedAt = user.last2FAVerifiedAt;
        respUser.isBlocked = user.isBlocked || false;
        respUser.daysToPasswordExpiration = user.daysToPasswordExpiration || 90; // Asignar valor por defecto si no se proporciona
        respUser.active = user.active || false;
        respUser.supportTypes = (user.supportTypes || []).map((t) => ({
          id: t.id,
          name: t.name,
        }));

        return respUser;
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      // throw new NotFoundException('Users not found');
    }

    return response;
  }

  async findById(userId: number): Promise<any | undefined> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'role',
        'department',
        'manager',
        'subordinates',
        'supportTypes',
      ],
    });
  }
  async create(
    user: any,
    authToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<User> {
    let temporaryPassword: string | null = null;

    // Si no se proporciona contraseña, generar una temporal
    if (!user.password) {
      temporaryPassword = this.generateTemporaryPassword();
      user.password = temporaryPassword;
    } else {
      // Si se proporciona contraseña, asumimos que es temporal para el email
      temporaryPassword = user.password;
    }

    // Encriptar la contraseña antes de crear el usuario
    if (user.password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
    let dateToPasswordExpiration = user.daysToPasswordExpiration
      ? new Date(
          Date.now() + user.daysToPasswordExpiration * 24 * 60 * 60 * 1000,
        )
      : null;
    user.dateToPasswordExpiration = dateToPasswordExpiration;
    user.daysToPasswordExpiration = user.daysToPasswordExpiration || 90; // Asignar valor por defecto si no se proporciona

    // Procesar managerId y subordinateIds
    let manager: User | null = null;
    if (user.managerId) {
      const foundManager = await this.userRepository.findOne({
        where: { id: user.managerId },
      });
      if (!foundManager) {
        throw new NotFoundException(
          `Jefe con ID ${user.managerId} no encontrado`,
        );
      }
      manager = foundManager;
    }

    let subordinates: User[] = [];
    if (user.subordinateIds && Array.isArray(user.subordinateIds)) {
      const foundSubs = await this.userRepository.findByIds(
        user.subordinateIds,
      );
      if (foundSubs.length !== user.subordinateIds.length) {
        throw new NotFoundException('Uno o más subordinados no encontrados');
      }
      subordinates = foundSubs;
    }

    const newUser = this.userRepository.create({
      ...user,
      manager,
      subordinates,
    });
    const savedUser = (await this.userRepository.save(
      newUser,
    )) as unknown as User;

    // Registrar auditoría
    try {
      const userDataForAudit = {
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        roleId: savedUser.roleId,
        departmentId: savedUser.departmentId,
        active: savedUser.active,
        isBlocked: savedUser.isBlocked,
      };

      await this.auditService.logChange({
        entityType: 'User',
        entityId: savedUser.id,
        action: 'CREATE',
        authToken,
        oldValues: null,
        newValues: userDataForAudit,
        ipAddress,
        userAgent,
        description: `Nuevo usuario creado: ${savedUser.firstName} ${savedUser.lastName} (${savedUser.email})`,
      });
    } catch (auditError) {
      console.error('Error registrando auditoría de creación:', auditError);
    }

    // Enviar correo de bienvenida al nuevo usuario con credenciales
    try {
      const userName = `${savedUser.firstName} ${savedUser.lastName}`;
      await this.emailService.sendWelcomeEmail(
        savedUser.email,
        userName,
        savedUser.email,
        temporaryPassword || '***No disponible***',
      );
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
    }

    return savedUser;
  }

  async update(
    updateData: UpdateUserDto,
    authToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<User> {
    const userId = updateData.id;
    if (!userId) {
      throw new NotFoundException('User ID is required for update');
    }

    const user = await this.findById(userId);
    console.log('User found for update:', user);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Guardar datos originales para auditoría
    const originalUserData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      departmentId: user.departmentId,
      active: user.active,
      isBlocked: user.isBlocked,
      emoji: (user as any).emoji || null,
    };
    console.log('Original user data for update:', originalUserData);

    let passwordChanged = false;
    let temporaryPassword: string | null = null;

    // Si se proporciona una nueva contraseña, verificar si cambió
    if (updateData.password) {
      const isSamePassword = await bcrypt.compare(
        updateData.password,
        user.password,
      );
      if (!isSamePassword) {
        passwordChanged = true;
        temporaryPassword = updateData.password; // Guardar antes del hash
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(
          updateData.password,
          saltRounds,
        );
        user.isFirstLogin = true;
        user.isTwoFactorEnabled = false; // Deshabilitar 2FA si se cambia la contraseña
        user.twoFactorSecret = '';

        user.password = updateData.password; // Actualizar la contraseña en el objeto user
      } else {
        // Si es la misma, eliminamos del update para no rehashearla
        delete updateData.password;
      }
    }

    user.firstName = updateData.firstName || user.firstName;
    user.lastName = updateData.lastName || user.lastName;
    user.email = updateData.email || user.email;
    if (updateData.roleId && updateData.roleId !== user.roleId) {
      user.roleId = updateData.roleId;
      user.role = { id: updateData.roleId } as any;
    }
    if (
      updateData.departmentId &&
      updateData.departmentId !== user.departmentId
    ) {
      user.departmentId = updateData.departmentId;
      user.department = { id: updateData.departmentId } as any;
    }
    let dateToPasswordExpiration = updateData.daysToPasswordExpiration
      ? new Date(
          Date.now() +
            updateData.daysToPasswordExpiration * 24 * 60 * 60 * 1000,
        )
      : null;
    user.dateToPasswordExpiration = dateToPasswordExpiration;
    user.daysToPasswordExpiration =
      updateData.daysToPasswordExpiration || user.daysToPasswordExpiration;
    // user.roleId = updateData.roleId || user.roleId;
    // user.departmentId = updateData.departmentId || user.departmentId;
    user.active =
      updateData.active !== undefined ? updateData.active : user.active;
    user.isBlocked =
      updateData.isBlocked !== undefined
        ? updateData.isBlocked
        : user.isBlocked;

    // Emoji field support
    if (updateData.emoji !== undefined) {
      user.emoji = updateData.emoji || null;
    }

    // Avatar JSON/dataURL support
    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar || null;
    }

    // Procesar managerId
    if (updateData.managerId !== undefined) {
      if (updateData.managerId === null) {
        user.manager = null;
        user.managerId = null;
      } else {
        const manager = await this.userRepository.findOne({
          where: { id: updateData.managerId },
        });
        if (!manager) {
          throw new NotFoundException(
            `Jefe con ID ${updateData.managerId} no encontrado`,
          );
        }
        user.manager = manager;
        user.managerId = updateData.managerId;
      }
    }

    // Procesar subordinateIds
    if (updateData.subordinateIds !== undefined) {
      if (Array.isArray(updateData.subordinateIds)) {
        const subordinates = await this.userRepository.findByIds(
          updateData.subordinateIds,
        );
        if (subordinates.length !== updateData.subordinateIds.length) {
          throw new NotFoundException('Uno o más subordinados no encontrados');
        }
        user.subordinates = subordinates;
      } else {
        user.subordinates = [];
      }
    }

    // Object.assign(user, updateData);

    console.log('Updating user with data:', user);
    // Guardar el usuario actualizado
    const updatedUser = await this.userRepository.save(user);

    console.log('Updated user with data:', updatedUser);
    // Registrar auditoría
    try {
      const newUserData = {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        roleId: updatedUser.roleId,
        departmentId: updatedUser.departmentId,
        active: updatedUser.active,
        isBlocked: updatedUser.isBlocked,
        emoji: (updatedUser as any).emoji || null,
      };

      await this.auditService.logChange({
        entityType: 'User',
        entityId: userId,
        action: 'UPDATE',
        authToken,
        oldValues: originalUserData,
        newValues: newUserData,
        ipAddress,
        userAgent,
        description: `Usuario actualizado: ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.email})`,
      });
    } catch (auditError) {
      console.error(
        'Error registrando auditoría de actualización:',
        auditError,
      );
    }

    // Enviar email de notificación si se cambió la contraseña
    if (passwordChanged && temporaryPassword) {
      try {
        const userName = `${updatedUser.firstName} ${updatedUser.lastName}`;
        await this.emailService.sendPasswordChangeNotification(
          updatedUser.email,
          userName,
          temporaryPassword,
        );
        console.log(
          `Email de cambio de contraseña enviado a: ${updatedUser.email}`,
        );
      } catch (emailError) {
        console.error(
          'Error enviando email de cambio de contraseña:',
          emailError,
        );
        // No falla la actualización si no se puede enviar el email
      }
    }

    return updatedUser;
  }

  // async delete(userId: number): Promise<void> {
  //   const user = await this.findById(userId);
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   Object.assign(user, updateData);
  //   return this.userRepository.save(user);
  // }

  async delete(
    userId: number,
    authToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Guardar datos del usuario antes de eliminar para auditoría
    const userDataForAudit = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      departmentId: user.departmentId,
      active: user.active,
      isBlocked: user.isBlocked,
    };

    const result = await this.userRepository.delete({ id: userId });
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }

    // Registrar auditoría
    try {
      await this.auditService.logChange({
        entityType: 'User',
        entityId: userId,
        action: 'DELETE',
        authToken,
        oldValues: userDataForAudit,
        newValues: null,
        ipAddress,
        userAgent,
        description: `Usuario ${user.firstName} ${user.lastName} (${user.email}) eliminado del sistema`,
      });
    } catch (auditError) {
      console.error('Error registrando auditoría de eliminación:', auditError);
    }

    // Notificar por correo la eliminación de la cuenta
    if (user && user.email) {
      try {
        const userName = `${user.firstName} ${user.lastName}`;
        await this.emailService.sendAccountDeletionNotification(
          user.email,
          userName,
          'Eliminación solicitada por administrador',
        );
        console.log(`Email de eliminación de cuenta enviado a: ${user.email}`);
      } catch (error) {
        console.error('Error enviando email de eliminación de cuenta:', error);
      }
    }
  }

  async updateTwoFactorSecret(
    userId: number,
    twoFactorSecret: string,
    isTemp: boolean,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (isTemp) {
      user.temp2FASecret = twoFactorSecret;
    } else {
      user.temp2FASecret = '';
      user.twoFactorSecret = twoFactorSecret;
    }
    return this.userRepository.save(user);
  }

  async updateLast2FAVerifiedAt(userId: number, date: Date): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.last2FAVerifiedAt = date;
    return this.userRepository.save(user);
  }

  async updatePasswordAndFirstLogin(
    userId: number,
    hashedPassword: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.password = hashedPassword;
    user.isFirstLogin = false;
    return this.userRepository.save(user);
  }

  async enableTwoFactor(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isTwoFactorEnabled = true;
    user.last2FAVerifiedAt = new Date(); // Set current date as last verified
    return this.userRepository.save(user);
  }

  async disableTwoFactor(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = ''; // Clear the secret when disabling 2FA

    return this.userRepository.save(user);
  }

  /**
   * Generar y enviar código de restablecimiento de contraseña
   */
  async requestPasswordReset(
    email: string,
  ): Promise<{ message: string; success: boolean }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message:
          'Si el email existe en nuestro sistema, recibirás un código de verificación.',
        success: true,
      };
    }

    // Generar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // El código expira en 15 minutos
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Guardar código en la base de datos
    user.passwordResetCode = resetCode;
    user.passwordResetCodeExpiresAt = expiresAt;

    user.twoFactorSecret = ''; // Limpiar el secreto de 2FA si está habilitado
    user.isTwoFactorEnabled = false; // Deshabilitar 2FA temporalmente para
    let daysToPasswordExpiration = user.daysToPasswordExpiration || 90; // Asignar valor por defecto si no se proporciona
    user.dateToPasswordExpiration =
      user.dateToPasswordExpiration ||
      new Date(Date.now() + daysToPasswordExpiration * 24 * 60 * 60 * 1000); // Asignar valor por defecto si no se proporciona
    user.password = ''; // Limpiar la contraseña para evitar problemas de seguridad
    await this.userRepository.save(user);

    // Enviar código por email
    try {
      await this.emailService.sendPasswordResetCode(
        user.email,
        resetCode,
        user.firstName,
      );

      return {
        message: 'Código de verificación enviado a tu correo electrónico.',
        success: true,
      };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new BadRequestException(
        'Error al enviar el código de verificación.',
      );
    }
  }

  /**
   * Verificar código y restablecer contraseña
   */
  async verifyPasswordReset(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string; success: boolean }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Verificar si hay un código activo
    if (!user.passwordResetCode || !user.passwordResetCodeExpiresAt) {
      throw new BadRequestException(
        'No hay un código de restablecimiento activo. Solicita uno nuevo.',
      );
    }

    // Verificar si el código no ha expirado
    if (new Date() > user.passwordResetCodeExpiresAt) {
      // Limpiar código expirado
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpiresAt = undefined;
      await this.userRepository.save(user);

      throw new BadRequestException(
        'El código de verificación ha expirado. Solicita uno nuevo.',
      );
    }

    // Verificar el código
    if (user.passwordResetCode !== code) {
      throw new BadRequestException('Código de verificación inválido.');
    }

    // Encriptar nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y limpiar código
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpiresAt = undefined;
    await this.userRepository.save(user);

    // Enviar confirmación por email
    try {
      await this.emailService.sendPasswordResetConfirmation(
        user.email,
        user.firstName,
      );
    } catch (error) {
      console.error('Error sending password reset confirmation:', error);
      // No fallar el reset si no se puede enviar la confirmación
    }

    return {
      message: 'Contraseña restablecida exitosamente.',
      success: true,
    };
  }

  /**
   * Verificar contraseñas próximas a vencer y enviar notificaciones
   */
  async checkPasswordExpiration(): Promise<PasswordExpirationCheckResult> {
    try {
      // Obtener todos los usuarios activos con fecha de expiración de contraseña
      const users = await this.userRepository.find({
        where: {
          active: true,
          isBlocked: false,
        },
        relations: ['role', 'department'],
      });

      let notificationsSent = 0;
      const usersToNotify: UserNotificationItem[] = [];

      for (const user of users) {
        if (user.dateToPasswordExpiration) {
          const today = new Date();
          const expirationDate = new Date(user.dateToPasswordExpiration);

          // Calcular días restantes
          const timeDiff = expirationDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

          // Notificar si faltan 7, 3, 1 días o ya venció
          if (daysRemaining <= 7 && daysRemaining >= -1) {
            usersToNotify.push({
              user,
              daysRemaining: Math.max(0, daysRemaining),
            });
          }
        }
      }

      // Enviar notificaciones
      for (const item of usersToNotify) {
        try {
          const userName = `${item.user.firstName} ${item.user.lastName}`;

          if (item.daysRemaining === 0) {
            // Contraseña vence hoy
            await this.emailService.sendPasswordExpirationWarning(
              item.user.email,
              userName,
              item.daysRemaining,
              'Su contraseña vence HOY. Es necesario cambiarla inmediatamente.',
            );
          } else if (item.daysRemaining === 1) {
            // Contraseña vence mañana
            await this.emailService.sendPasswordExpirationWarning(
              item.user.email,
              userName,
              item.daysRemaining,
              'Su contraseña vence MAÑANA. Por favor, cámbiela lo antes posible.',
            );
          } else {
            // Contraseña vence en los próximos días
            await this.emailService.sendPasswordExpirationWarning(
              item.user.email,
              userName,
              item.daysRemaining,
              `Su contraseña vencerá en ${item.daysRemaining} días. Le recomendamos cambiarla pronto.`,
            );
          }

          notificationsSent++;
          console.log(
            `✓ Notificación enviada a: ${item.user.email} (${item.daysRemaining} días restantes)`,
          );
        } catch (emailError) {
          console.error(
            `Error enviando notificación a ${item.user.email}:`,
            emailError,
          );
        }
      }

      return {
        message: `Verificación de contraseñas completada. Se enviaron ${notificationsSent} notificaciones.`,
        notificationsSent,
        usersChecked: users.length,
      };
    } catch (error) {
      console.error('Error en verificación de contraseñas:', error);
      throw new BadRequestException(
        'Error al verificar las contraseñas próximas a vencer.',
      );
    }
  }

  /**
   * Obtener usuarios con contraseñas próximas a vencer (para administradores)
   */
  async getUsersWithExpiringPasswords(
    days: number = 7,
  ): Promise<ExpiringPasswordUser[]> {
    try {
      const users = await this.userRepository.find({
        where: {
          active: true,
          isBlocked: false,
        },
        relations: ['role', 'department'],
      });

      const expiringUsers: ExpiringPasswordUser[] = [];

      for (const user of users) {
        if (user.dateToPasswordExpiration) {
          const today = new Date();
          const expirationDate = new Date(user.dateToPasswordExpiration);

          // Calcular días restantes
          const timeDiff = expirationDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

          if (daysRemaining <= days && daysRemaining >= -1) {
            expiringUsers.push({
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role?.name || 'Sin rol',
              department: user.department?.name || 'Sin departamento',
              dateToPasswordExpiration: user.dateToPasswordExpiration,
              daysRemaining: Math.max(0, daysRemaining),
              status:
                daysRemaining <= 0
                  ? 'Vencida'
                  : daysRemaining === 1
                    ? 'Vence mañana'
                    : daysRemaining <= 3
                      ? 'Crítico'
                      : 'Próximo a vencer',
            });
          }
        }
      }

      // Ordenar por días restantes (más críticos primero)
      expiringUsers.sort((a, b) => a.daysRemaining - b.daysRemaining);

      return expiringUsers;
    } catch (error) {
      console.error(
        'Error obteniendo usuarios con contraseñas próximas a vencer:',
        error,
      );
      throw new BadRequestException('Error al obtener la lista de usuarios.');
    }
  }

  // ========================================
  // MÉTODOS PARA JERARQUÍA Y TIPOS DE SOPORTE
  // ========================================

  /**
   * Obtener subordinados de un usuario
   */
  async getSubordinates(userId: number): Promise<User[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'subordinates',
        'subordinates.role',
        'subordinates.department',
      ],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return user.subordinates || [];
  }

  /**
   * Obtener jefe directo de un usuario
   */
  async getManager(userId: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['manager', 'manager.role', 'manager.department'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return user.manager || null;
  }

  /**
   * Asignar jefe a un usuario
   */
  async assignManager(userId: number, managerId: number): Promise<User> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que el jefe existe
    const manager = await this.userRepository.findOne({
      where: { id: managerId },
    });
    if (!manager) {
      throw new NotFoundException(`Jefe con ID ${managerId} no encontrado`);
    }

    // Evitar bucles (el jefe no puede ser subordinado del usuario)
    if (await this.wouldCreateHierarchyLoop(userId, managerId)) {
      throw new BadRequestException(
        'Esta asignación crearía un bucle en la jerarquía',
      );
    }

    user.managerId = managerId;
    return await this.userRepository.save(user);
  }

  /**
   * Verificar si asignar un jefe crearía un bucle en la jerarquía
   */
  private async wouldCreateHierarchyLoop(
    userId: number,
    managerId: number,
  ): Promise<boolean> {
    let currentManagerId: number | undefined = managerId;
    const visitedIds = new Set<number>();

    while (currentManagerId) {
      if (visitedIds.has(currentManagerId)) {
        return true; // Bucle detectado
      }

      if (currentManagerId === userId) {
        return true; // El usuario sería jefe de su jefe
      }

      visitedIds.add(currentManagerId);

      const manager = await this.userRepository.findOne({
        where: { id: currentManagerId },
        select: ['managerId'],
      });

      currentManagerId = manager?.managerId || undefined;
    }

    return false;
  }

  /**
   * Obtener tipos de soporte que puede manejar un usuario
   */
  async getUserSupportTypes(userId: number): Promise<TicketType[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['supportTypes'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return user.supportTypes || [];
  }

  /**
   * Asignar tipos de soporte a un usuario
   */
  async assignSupportTypes(
    userId: number,
    supportTypeIds: number[],
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['supportTypes'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que todos los tipos de soporte existen
    const supportTypes =
      await this.ticketTypeRepository.findByIds(supportTypeIds);
    if (supportTypes.length !== supportTypeIds.length) {
      throw new BadRequestException('Algunos tipos de soporte no existen');
    }

    user.supportTypes = supportTypes;
    return await this.userRepository.save(user);
  }

  /**
   * Obtener usuarios que pueden dar soporte a un tipo específico
   */
  async getUsersBySupportType(ticketTypeId: number): Promise<User[]> {
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { id: ticketTypeId },
      relations: [
        'supportUsers',
        'supportUsers.role',
        'supportUsers.department',
      ],
    });

    if (!ticketType) {
      throw new NotFoundException(
        `Tipo de ticket con ID ${ticketTypeId} no encontrado`,
      );
    }

    return ticketType.supportUsers || [];
  }

  /**
   * Obtener usuarios disponibles para ser jefes (excluyendo subordinados del usuario actual)
   */
  async getAvailableManagers(userId: number): Promise<User[]> {
    // Obtener todos los subordinados del usuario (recursivamente) para excluirlos
    const subordinateIds = await this.getAllSubordinateIds(userId);
    subordinateIds.add(userId); // También excluir al usuario mismo

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.department', 'department')
      .where('user.active = :active', { active: true });

    if (subordinateIds.size > 0) {
      queryBuilder.andWhere('user.id NOT IN (:...excludeIds)', {
        excludeIds: Array.from(subordinateIds),
      });
    }

    return await queryBuilder
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();
  }

  /**
   * Obtener todos los IDs de subordinados de un usuario recursivamente
   */
  private async getAllSubordinateIds(userId: number): Promise<Set<number>> {
    const subordinateIds = new Set<number>();

    const processSubordinates = async (currentUserId: number) => {
      const user = await this.userRepository.findOne({
        where: { id: currentUserId },
        relations: ['subordinates'],
        select: ['id', 'subordinates'],
      });

      if (user && user.subordinates) {
        for (const subordinate of user.subordinates) {
          if (!subordinateIds.has(subordinate.id)) {
            subordinateIds.add(subordinate.id);
            await processSubordinates(subordinate.id);
          }
        }
      }
    };

    await processSubordinates(userId);
    return subordinateIds;
  }
    /**
   * Obtener todos los usuarios que pueden atender tickets (tienen tipos de soporte asignados)
   */
  async findAllSupportUsers(): Promise<any[]> {
    const users = await this.userRepository.find({
      relations: ['role', 'department', 'supportTypes'],
      where: { active: true, isBlocked: false },
    });
    console.log("Usuarios", users);
    // Solo usuarios con al menos un tipo de soporte asignado
    return users.filter(u => (u.supportTypes && u.supportTypes.length > 0)).map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.role?.id || 0,
      role: user.role?.name || '',
      departmentId: user.department?.id || 0,
      department: user.department?.name || '',
      supportTypes: (user.supportTypes || []).map(t => ({ id: t.id, name: t.name })),
    }));
  }
}

