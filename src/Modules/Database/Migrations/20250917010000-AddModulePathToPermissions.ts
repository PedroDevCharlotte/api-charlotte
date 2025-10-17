                                                                    import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModulePathToPermissions20250917010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the column (nullable to avoid issues on existing rows)
    await queryRunner.query(`ALTER TABLE permissions ADD COLUMN modulePath VARCHAR(255) NULL`);

    // Populate modulePath for known modules (handle plural/singular permission name variants)
    await queryRunner.query(`UPDATE permissions SET modulePath = '/apps/banners/list' WHERE name LIKE 'banners.%' OR name LIKE 'banner.%'`);
    await queryRunner.query(`UPDATE permissions SET modulePath = '/apps/kanban/list' WHERE name LIKE 'kanban.%'`);
    await queryRunner.query(`UPDATE permissions SET modulePath = '/apps/non-conformities/list' WHERE name LIKE 'non-conformities.%' OR name LIKE 'nonconformities.%' OR name LIKE 'non_conformities.%'`);
    await queryRunner.query(`UPDATE permissions SET modulePath = '/apps/profiles/list' WHERE name LIKE 'profiles.%' OR name LIKE 'profile.%'`);
    await queryRunner.query(`UPDATE permissions SET modulePath = '/apps/role-types/list' WHERE name LIKE 'role-types.%' OR name LIKE 'roletypes.%' OR name LIKE 'roles.%'`);
    await queryRunner.query(`UPDATE permissions SET modulePath = '/apps/ticket/list' WHERE name LIKE 'ticket.%' OR name LIKE 'tickets.%'`);
    await queryRunner.query(`UPDATE permissions SET modulePath = '/apps/user/user-list' WHERE name LIKE 'user.%' OR name LIKE 'users.%'`);

    // As a fallback, set modulePath to '/apps' for any permission without a mapping (optional)
    await queryRunner.query(`UPDATE permissions SET modulePath = '/apps' WHERE modulePath IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN modulePath`);
  }
}
