import { Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { Agent, Database } from '@/type/database';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';

@Injectable()
export class AgentService extends BaseCrudService<Agent> {
  constructor(@InjectKysely() readonly db: Kysely<Database>) {
    super(db, 'agent'); // Assuming your table name is 'call_logs'
  }
}
  