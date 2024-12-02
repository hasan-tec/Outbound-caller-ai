import { CallLog, Database } from '@/type/database';
import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import twilio from 'twilio';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class CallLogService extends BaseCrudService<CallLog> {
  private twilioClient: twilio.Twilio;

  constructor(
    @InjectKysely() readonly db: Kysely<Database>,
    private systemConfigService: SystemConfigService,
  ) {
    super(db, 'call_log');
  }

  private async initializeTwilioClient() {
    /**
     * Keep it runable even if the credentials are not correct
     */
    try {
      const accountSid =
        await this.systemConfigService.getConfigByKey('twilio_account_sid');
      const authToken =
        await this.systemConfigService.getConfigByKey('twilio_auth_token');

      console.log('accountSid', accountSid);
      console.log('authToken', authToken);

      if (!accountSid || !authToken) {
        throw new Error('Missing Twilio credentials');
      }

      this.twilioClient = twilio(accountSid, authToken);
      return this.twilioClient;
    } catch (error) {
      console.error(
        '\x1b[31mError initializing Twilio client:',
        error,
        '\x1b[0m',
      );

      throw error;
    }
  }

  private async getTwilioClient() {
    if (!this.twilioClient) {
      return this.initializeTwilioClient();
    }
    return this.twilioClient;
  }

  async logIncomingCall(callData: Partial<CallLog>): Promise<CallLog> {
    // Implement logic to log incoming call
    return this.create(callData);
  }

  async makeOutboundCall(toPhoneNumber: string, name: string): Promise<any> {
    const twilioPhoneNumber = await this.systemConfigService.getConfigByKey(
      'twilio_phone_number',
    );
    const apiUrl = await this.systemConfigService.getConfigByKey('server_url');

    if (!apiUrl) {
      throw new Error('Missing server URL');
    }

    if (!twilioPhoneNumber) {
      throw new Error('Missing Twilio phone number or API URL');
    }

    try {
      const twilioClient = await this.getTwilioClient();
      const call = await twilioClient.calls.create({
        url: `${apiUrl}/api/call-log/outbound-call-handler`,
        to: toPhoneNumber,
        from: twilioPhoneNumber,
      });
      return call;
    } catch (error) {
      console.error('Error making outbound call:', error);
      throw error;
    }
  }

  async handleOutboundCallWebhook(reply: any) {
    const serverUrl =
      await this.systemConfigService.getConfigByKey('server_url');

    if (!serverUrl) {
      throw new Error('Missing server URL');
    }

    const wsUrl = serverUrl.replace('http', 'ws');
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                          <Response>
                              <Connect>
                                  <Stream url="${wsUrl}/media-stream" />
                              </Connect>
                          </Response>`;

    reply.type('text/xml').send(twimlResponse);
  }
}
