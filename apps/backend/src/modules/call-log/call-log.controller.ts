import { Controller, Post, Req, Res, Body, Query, Param } from '@nestjs/common';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';
import { CallLogService } from './call-log.service';
import { CallLog } from '@/type/database';

@Controller('call-log')
export class CallLogController extends BaseCrudController<CallLog> {
  constructor(private readonly callLogService: CallLogService) {
    super(callLogService);
  }

  @Post('outbound-call-handler')
  async handleOutboundCall(@Res() response: any) {
    await this.callLogService.handleOutboundCallWebhook(response);
  }

  @Post('make-outbound-call/:id')
  async makeOutboundCall(@Param('id') id: number) {
    const callLog = await this.callLogService.findOne(id);
    const callRes = await this.callLogService.makeOutboundCall(callLog.number);
    await this.callLogService.update(id, { call_sid: callRes.sid });

    return { data: callRes.sid };
  }
}
