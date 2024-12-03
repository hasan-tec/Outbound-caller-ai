import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { IncomingMessage } from 'http';
import { Server, WebSocket } from 'ws';
import { CallLogService } from './call-log.service';
import { AgentService } from '../agent/agent.service';
import { SystemConfigService } from '../system-config/system-config.service';

const VOICE = 'alloy';
const LOG_EVENT_TYPES = [
  'response.content.done',
  'rate_limits.updated',
  'response.done',
  'input_audio_buffer.committed',
  'input_audio_buffer.speech_stopped',
  'input_audio_buffer.speech_started',
  'session.created',
];

@WebSocketGateway({
  path: '/media-stream',
  transports: ['websocket'],
})
export class CallLogGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly callLogService: CallLogService,
    private readonly agentService: AgentService,
    private systemConfigService: SystemConfigService,
  ) {}

  @WebSocketServer()
  server: Server;

  private openAiWs: WebSocket;
  private streamSid: string | null = null;
  private callSid: string | null = null;
  private callRecords: string[] = [];



  afterInit() {
    console.log('WebSocket server initialized');
  }

  async handleConnection(client: WebSocket, request: IncomingMessage): Promise<void> {
    const openAiApiKey = await this.systemConfigService.getConfigByKey('openai_api_key');
    console.log(openAiApiKey);

    this.openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    this.setupOpenAiWebSocket(client);

    client.on('message', (message: WebSocket.Data) => {
      this.handleMessage(client, message);
    });

    client.on('close', () => {
      this.handleDisconnect(client);
    });
  }

  private async setupOpenAiWebSocket(client: WebSocket): Promise<void> {
    this.openAiWs.on('open', async () => {
      console.log('Connected to the OpenAI Realtime API');
      const callLog = await this.callLogService.findAll({
        where: [{ key: 'call_sid', operator: '=', value: this.callSid }],
      });
      if (callLog.length === 0) throw new Error('Call log not found');
      const agent = callLog[0].agent;
      const agentPrompt = await this.agentService.findOne(agent);
      if (!agentPrompt) throw new Error('Agent not found');
      
      await new Promise(resolve => setTimeout(resolve, 250));
      this.sendSessionUpdate(agentPrompt.prompt, callLog[0].name); // Pass the name to sendSessionUpdate
      this.callLogService.update(callLog[0].id, {
        status: 'called',
      });
    });


    this.openAiWs.on('message', (data: WebSocket.Data) => {
      this.handleOpenAiMessage(client, data);
    });

    this.openAiWs.on('close', () => {
      console.log('Disconnected from the OpenAI Realtime API');
    });

    this.openAiWs.on('error', (error) => {
      console.error('Error in the OpenAI WebSocket:', error);
    });
  }

  private sendSessionUpdate(systemMessage: string, personName: string): void {
    const sessionUpdate = {
      type: 'session.update',
      session: {
        turn_detection: { type: 'server_vad' },
        input_audio_format: 'g711_ulaw',
        output_audio_format: 'g711_ulaw',
        voice: VOICE,
        instructions: `${systemMessage}\nYou are calling ${personName}. Start the conversation by asking if ${personName} is available.`,
        modalities: ['text', 'audio'],
        temperature: 0.8,
      },
    };

    console.log('Sending session update:', JSON.stringify(sessionUpdate));
    this.openAiWs.send(JSON.stringify(sessionUpdate));
  }

  private handleOpenAiMessage(client: WebSocket, data: WebSocket.Data): void {
    try {
      const response = JSON.parse(data.toString());

      if (LOG_EVENT_TYPES.includes(response.type)) {
        console.log(`Received event: ${response.type}`, response);
      }

      if (response.type === 'session.updated') {
        console.log('Session updated successfully:', response);
      }

      if (response.type === 'response.content.delta' && response.delta) {
        this.callRecords.push(response.delta);
      }

      if (response.type === 'response.audio.delta' && response.delta) {
        const audioDelta = {
          event: 'media',
          streamSid: this.streamSid,
          media: {
            payload: Buffer.from(response.delta, 'base64').toString('base64'),
          },
        };
        client.send(JSON.stringify(audioDelta));
      }

      if (response.type === 'response.done') {
        this.updateCallLogWithRecords();
      }
    } catch (error) {
      console.error(
        'Error processing OpenAI message:',
        error,
        'Raw message:',
        data,
      );
    }
  }

  private async updateCallLogWithRecords(): Promise<void> {
    if (this.callSid) {
      const records = this.callRecords.join('');
      console.log(`Updating call log for callSid: ${this.callSid}`);
      console.log(`Records to be saved: ${records}`);
      try {
        const updatedRecord = await this.callLogService.updateCallRecord(this.callSid, { records });
        console.log(`Call log updated successfully: ${JSON.stringify(updatedRecord)}`);
      } catch (error) {
        console.error(`Error updating call log: ${error.message}`);
      }
      this.callRecords = []; // Reset records for the next interaction
    } else {
      console.warn('Attempted to update call log but callSid is null');
    }
  }



  private async handleMessage(
    client: WebSocket,
    message: WebSocket.Data,
  ): Promise<void> {
    try {
      const data = JSON.parse(message.toString());

      switch (data.event) {
        case 'media':
          if (this.openAiWs.readyState === WebSocket.OPEN) {
            const audioAppend = {
              type: 'input_audio_buffer.append',
              audio: data.media.payload,
            };
            this.openAiWs.send(JSON.stringify(audioAppend));
          }
          break;
        case 'start':
          this.streamSid = data.start.streamSid;
          this.callSid = data.start.callSid;
          console.log('Incoming stream has started', this.streamSid);
          console.log('Call SID', this.callSid);
          break;
        default:
          console.log('Received non-media event:', data.event);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error, 'Message:', message);
    }
  }

  handleDisconnect(client: WebSocket) {
    console.log('Client disconnected');
    if (this.openAiWs?.readyState === WebSocket.OPEN) this.openAiWs.close();
  }
}
