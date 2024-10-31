import { Module } from '@nestjs/common';
import { CallLogController } from './call-log.controller';
import { CallLogService } from './call-log.service';
import { CallLogGateway } from './call-log.gateway';
import { AgentService } from '../agent/agent.service';
import { SystemConfigService } from '../system-config/system-config.service';

@Module({
  imports: [],
  controllers: [CallLogController],
  providers: [CallLogService, CallLogGateway, AgentService, SystemConfigService],
  exports: [CallLogService],
})
export class CallLogModule {}
