import { Controller, Post, Body, Put, Get } from '@nestjs/common';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';
import { SystemConfigService } from './system-config.service';
import { SystemConfig } from '@/type/database';

@Controller('system-config')
export class SystemConfigController extends BaseCrudController<SystemConfig> {
  constructor(private readonly systemConfigService: SystemConfigService) {
    super(systemConfigService);
  }

  @Put('update-by-key')
  async updateByKey(@Body() body: { key: string; value: string }) {
    const configs = await this.systemConfigService.findAll({
      where: [{ key: 'key', operator: '=', value: body.key }]
    });

    if (configs.length === 0) {
      return await this.systemConfigService.create({
        key: body.key,
        value: body.value
      });
    }

    const config = configs[0];
    return await this.systemConfigService.update(config.id, {
      value: body.value,
      updated_at: new Date().toISOString()
    });
  }
}


