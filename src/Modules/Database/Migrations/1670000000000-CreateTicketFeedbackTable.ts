import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTicketFeedbackTable1670000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ticket_feedbacks',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'ticketId', type: 'varchar', length: '64' },
          { name: 'knowledge', type: 'int' },
          { name: 'timing', type: 'int' },
          { name: 'escalation', type: 'int' },
          { name: 'resolved', type: 'int' },
          { name: 'comment', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ticket_feedbacks');
  }
}
