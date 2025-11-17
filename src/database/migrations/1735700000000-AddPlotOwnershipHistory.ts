import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddPlotOwnershipHistory1735700000000 implements MigrationInterface {
    name = 'AddPlotOwnershipHistory1735700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'plot_ownership_history',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'plotId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'customerId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'bookingId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'ownershipType',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'salePrice',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'registrationDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'transferDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'registrationNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'transferDocumentNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'recordedBy',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            'plot_ownership_history',
            new TableForeignKey({
                columnNames: ['plotId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'plots',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'plot_ownership_history',
            new TableForeignKey({
                columnNames: ['customerId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'customers',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'plot_ownership_history',
            new TableForeignKey({
                columnNames: ['bookingId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'bookings',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'plot_ownership_history',
            new TableForeignKey({
                columnNames: ['recordedBy'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('plot_ownership_history');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey('plot_ownership_history', fk);
            }
        }
        await queryRunner.dropTable('plot_ownership_history');
    }
}

