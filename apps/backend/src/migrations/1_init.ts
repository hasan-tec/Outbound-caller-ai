import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create agent table
  await db.schema
    .createTable('agent')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('prompt', 'text')
    .execute();

  // Create call_log table
  await db.schema
    .createTable('call_log') 
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('number', 'varchar(255)', (col) => col.notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull()) // Add name column
    .addColumn('status', 'varchar(255)', (col) => 
      col.notNull().defaultTo('pending'))
    .addColumn('duration', 'varchar(255)')
    .addColumn('agent', 'varchar(255)', (col) => col.notNull())
    .addColumn('records', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('call_sid', 'varchar(255)')
    .execute();

  await db.schema
    .createTable('system_config')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('key', 'varchar(255)', (col) => col.notNull())
    .addColumn('value', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('call_log').execute();
  await db.schema.dropTable('agent').execute();
  await db.schema.dropTable('system_config').execute();
}

