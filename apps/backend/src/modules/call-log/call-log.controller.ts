import { Controller, Post, Req, Res, Body, Query, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';
import { CallLogService } from './call-log.service';
import { CallLog } from '@/type/database';
import { Multer } from 'multer';

interface UploadedFile extends Multer.File {
  buffer: Buffer;
}

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
    const callRes = await this.callLogService.makeOutboundCall(callLog.number, callLog.name);
    await this.callLogService.update(id, { call_sid: callRes.sid });

    return { data: callRes.sid };
  }

  @Post('import-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: UploadedFile, @Body('agentId') agentId: string): Promise<CallLog[]> {
    const csvData = file.buffer.toString();
    const rows = csvData.split('\n').slice(1); // Skip header row
    const callLogs = rows.filter(row => row.trim()).map(row => {
      const [name, number] = row.split(',');
      return {
        name: name.trim(),
        number: this.formatPhoneNumber(number.trim()),
        agent: parseInt(agentId), // Ensure integer conversion
        status: 'pending'
      };
    });
    return this.callLogService.createMany(callLogs);
  }

  private formatPhoneNumber(number: string): string {
    const digitsOnly = number.replace(/\D/g, '');
    return digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`;
  }
}