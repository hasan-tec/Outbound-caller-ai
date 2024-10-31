import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { KyselyModule } from 'nestjs-kysely';
import { join } from 'path';
import { AgentModule } from './modules/agent/agent.module';
import { CallLogModule } from './modules/call-log/call-log.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { promises } from 'fs';
import { FileMigrationProvider, Migrator } from 'kysely';
import * as path from 'path';

@Module({
  imports: [
    // Load .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    KyselyModule.forRoot({
      dialect: new SqliteDialect({
        database: new Database('.sqlite_db'),
      }),
    }),

    // Serve the frontend build from apps/frontend/dist
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'frontend', 'dist'),
    }),

    CallLogModule,
    AgentModule,
    SystemConfigModule,
  ],
  providers: [
    // DatabaseService,
  ],
  exports: [
    // DatabaseService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor() {}

  async onModuleInit() {
    const db = new Database('.sqlite_db');
    try {
      const result = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='agent'",
        )
        .get();
      if (!result) {
        console.warn('Agent table does not exist - running migrations');
        
        const kyselyDb = new Kysely<any>({
          dialect: new SqliteDialect({
            database: new Database('.sqlite_db'),
          }),
        });

        const migrator = new Migrator({
          db: kyselyDb,
          provider: new FileMigrationProvider({
            fs: promises as any,
            path,
            migrationFolder: path.join(__dirname, 'migrations'),
          }),
        });

        const { error, results } = await migrator.migrateToLatest();

        results?.forEach((it) => {
          if (it.status === 'Success') {
            console.log(`migration "${it.migrationName}" was executed successfully`);
          } else if (it.status === 'Error') {
            console.error(`failed to execute migration "${it.migrationName}"`);
          }
        });

        if (error) {
          console.error('failed to migrate');
          console.error(error);
          throw error;
        }

        await kyselyDb.destroy();

        console.log('\x1b[32m%s\x1b[0m', 'Migrations completed successfully! Please restart your application for changes to take effect...');
        process.exit(0);
      }
    } catch (error) {
      console.error('Error checking for agent table:', error);
    } finally {
      db.close();
    }
  }
}
