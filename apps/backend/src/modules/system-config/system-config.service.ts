import { Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { Database, SystemConfig } from '@/type/database';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';

@Injectable()
export class SystemConfigService extends BaseCrudService<SystemConfig> {
  constructor(@InjectKysely() readonly db: Kysely<Database>) {
    super(db, 'system_config');
  }

  async getConfigByKey(searchKeyInput: string): Promise<string | null> {
    const config = await this.findAll({
      where: [{ key: 'key', 'operator': '=', 'value': searchKeyInput }],
    });
    return config[0]?.value || null;
  }
}
