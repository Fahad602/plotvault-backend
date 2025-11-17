import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddExpenseEntity1735700001000 implements MigrationInterface {
    name = 'AddExpenseEntity1735700001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'expenses',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'expenseName',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'category',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'amount',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'paidAmount',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        default: "'pending'",
                    },
                    {
                        name: 'expenseDate',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'dueDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'paidDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'vendorName',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'vendorContact',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'invoiceNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'receiptNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'paymentMethod',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'referenceNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'accountId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'submittedBy',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'approvedBy',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'approvedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'rejectionReason',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            'expenses',
            new TableForeignKey({
                columnNames: ['submittedBy'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'expenses',
            new TableForeignKey({
                columnNames: ['approvedBy'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('expenses');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey('expenses', fk);
            }
        }
        await queryRunner.dropTable('expenses');
    }
}

