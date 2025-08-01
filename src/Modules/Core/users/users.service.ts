import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';
import { Repository } from 'typeorm';
import { UserLoginDto } from '../auth/Dto/user-login.dto';
import { UserDto } from './Dto/user.dto';
import * as bcrypt from 'bcrypt';
import { RespUserDto } from './Dto/RespUser.dto';
import { isError } from 'util';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailerService, // Asegúrate de tener un servicio de correo
    private readonly emailService: EmailService, // Nuestro servicio de email mejorado
    private readonly auditService: AuditService, // Servicio de auditoría
  ) {}

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
        relations: ['role', 'department']
      });
      response.users = users.map((user) => {
        const respUser = new RespUserDto();
        respUser.id = user.id;
        respUser.firstName = user.firstName;
        respUser.lastName = user.lastName;
        respUser.email = user.email;
        respUser.role = user.role?.name || 'No asignado'; // Obtener el nombre del rol
        respUser.department = user.department?.name || 'No asignado'; // Obtener el nombre del departamento
        respUser.isTwoFactorEnabled = user.isTwoFactorEnabled;
        respUser.last2FAVerifiedAt = user.last2FAVerifiedAt;
        respUser.isBlocked = user.isBlocked || false;
        respUser.isActive = user.isActive || false;

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
      relations: ['role', 'department']
    });
  }
  async create(user: any, currentUserId?: number, ipAddress?: string, userAgent?: string): Promise<User> {
    // Encriptar la contraseña antes de crear el usuario
    if (user.password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(user.password, saltRounds);
    }

    const newUser = this.userRepository.create(user);
    const savedUser = (await this.userRepository.save(newUser) as unknown) as User;

    // Registrar auditoría
    try {
      const userDataForAudit = {
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        roleId: savedUser.roleId,
        departmentId: savedUser.departmentId,
        isActive: savedUser.isActive,
        isBlocked: savedUser.isBlocked,
      };

      await this.auditService.logChange({
        entityType: 'User',
        entityId: savedUser.id,
        action: 'CREATE',
        userId: currentUserId,
        oldValues: null,
        newValues: userDataForAudit,
        ipAddress,
        userAgent,
        description: `Nuevo usuario creado: ${savedUser.firstName} ${savedUser.lastName} (${savedUser.email})`,
      });
    } catch (auditError) {
      console.error('Error registrando auditoría de creación:', auditError);
    }

    // Enviar correo de notificación al nuevo usuario
    try {
      const loginUrl = process.env.APP_LOGIN_URL || 'https://tu-app.com/login';
      const subject = '¡Tu usuario ha sido creado!';
      const html = `
        <p>Hola ${savedUser.firstName},</p>
        <p>Tu usuario ha sido creado exitosamente. Ya puedes acceder a la aplicación.</p>
        <a href="${loginUrl}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Ir al login</a>
        <p>Si no solicitaste este registro, ignora este mensaje.</p>
      `;
      await this.mailService.sendMail({
        to: savedUser.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Error enviando email de notificación:', error);
    }

    return savedUser;
  }

  async update(updateData: UserDto, currentUserId?: number, ipAddress?: string, userAgent?: string): Promise<User> {
    const userId = updateData.id;
    if (!userId) {
      throw new NotFoundException('User ID is required for update');
    }

    const user = await this.findById(userId);
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
      isActive: user.isActive,
      isBlocked: user.isBlocked,
    };

    // Si se proporciona una nueva contraseña, verificar si cambió
    if (updateData.password) {
      const isSamePassword = await bcrypt.compare(
        updateData.password,
        user.password,
      );
      if (!isSamePassword) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(
          updateData.password,
          saltRounds,
        );
      } else {
        // Si es la misma, eliminamos del update para no rehashearla
        delete updateData.password;
      }
    }

    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);

    // Registrar auditoría
    try {
      const newUserData = {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        roleId: updatedUser.roleId,
        departmentId: updatedUser.departmentId,
        isActive: updatedUser.isActive,
        isBlocked: updatedUser.isBlocked,
      };

      await this.auditService.logChange({
        entityType: 'User',
        entityId: userId,
        action: 'UPDATE',
        userId: currentUserId,
        oldValues: originalUserData,
        newValues: newUserData,
        ipAddress,
        userAgent,
        description: `Usuario actualizado: ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.email})`,
      });
    } catch (auditError) {
      console.error('Error registrando auditoría de actualización:', auditError);
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

  async delete(userId: number, currentUserId?: number, ipAddress?: string, userAgent?: string): Promise<void> {
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
      isActive: user.isActive,
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
        userId: currentUserId,
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
        const subject = 'Tu cuenta ha sido eliminada';
        const html = `
          <p>Hola ${user.firstName},</p>
          <p>Tu cuenta ha sido eliminada del sistema. Si tienes dudas, contacta al administrador.</p>
        `;
        await this.mailService.sendMail({
          to: user.email,
          subject,
          html,
        });
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
  async requestPasswordReset(email: string): Promise<{ message: string; success: boolean }> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message: 'Si el email existe en nuestro sistema, recibirás un código de verificación.',
        success: true
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
    await this.userRepository.save(user);

    // Enviar código por email
    try {
      await this.emailService.sendPasswordResetCode(user.email, resetCode, user.firstName);
      
      return {
        message: 'Código de verificación enviado a tu correo electrónico.',
        success: true
      };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new BadRequestException('Error al enviar el código de verificación.');
    }
  }

  /**
   * Verificar código y restablecer contraseña
   */
  async verifyPasswordReset(email: string, code: string, newPassword: string): Promise<{ message: string; success: boolean }> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Verificar si hay un código activo
    if (!user.passwordResetCode || !user.passwordResetCodeExpiresAt) {
      throw new BadRequestException('No hay un código de restablecimiento activo. Solicita uno nuevo.');
    }

    // Verificar si el código no ha expirado
    if (new Date() > user.passwordResetCodeExpiresAt) {
      // Limpiar código expirado
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpiresAt = undefined;
      await this.userRepository.save(user);
      
      throw new BadRequestException('El código de verificación ha expirado. Solicita uno nuevo.');
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
      await this.emailService.sendPasswordResetConfirmation(user.email, user.firstName);
    } catch (error) {
      console.error('Error sending password reset confirmation:', error);
      // No fallar el reset si no se puede enviar la confirmación
    }

    return {
      message: 'Contraseña restablecida exitosamente.',
      success: true
    };
  }
}
