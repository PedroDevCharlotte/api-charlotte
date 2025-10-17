import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionsAndRolePermissions1694956800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        description VARCHAR(255),
        isActive TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles_permissions (
        roleId INT NOT NULL,
        permissionId INT NOT NULL,
        PRIMARY KEY (roleId, permissionId),
        CONSTRAINT FK_roles_permissions_role FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT FK_roles_permissions_permission FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Insert basic CRUD permissions for frontend app modules
    await queryRunner.query(`INSERT INTO permissions (name, description) VALUES
      ('banners.create','Create banners'),
      ('banners.read','Read banners'),
      ('banners.update','Update banners'),
      ('banners.delete','Delete banners'),
      ('kanban.create','Create kanban'),
      ('kanban.read','Read kanban'),
      ('kanban.update','Update kanban'),
      ('kanban.delete','Delete kanban'),
      ('non-conformities.create','Create non-conformities'),
      ('non-conformities.read','Read non-conformities'),
      ('non-conformities.update','Update non-conformities'),
      ('non-conformities.delete','Delete non-conformities'),
      ('profiles.create','Create profiles'),
      ('profiles.read','Read profiles'),
      ('profiles.update','Update profiles'),
      ('profiles.delete','Delete profiles'),
      ('role-types.create','Create role-types'),
      ('role-types.read','Read role-types'),
      ('role-types.update','Update role-types'),
      ('role-types.delete','Delete role-types'),
      ('ticket.create','Create tickets'),
      ('ticket.read','Read tickets'),
      ('ticket.update','Update tickets'),
      ('ticket.delete','Delete tickets'),
      ('user.create','Create users'),
      ('user.read','Read users'),
      ('user.update','Update users'),
      ('user.delete','Delete users')
    ON DUPLICATE KEY UPDATE name = name;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS roles_permissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions;`);
  }
}
