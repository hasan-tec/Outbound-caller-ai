// src/modules/call-log/call-log.gateway.ts
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { IncomingMessage } from 'http';
import WebSocket from 'ws';  // Changed to default import
import { CallLogService } from './call-log.service';
import { AgentService } from '../agent/agent.service';
import { SystemConfigService } from '../system-config/system-config.service';

// WebSocket ready states
const WS_READY_STATES = {
  OPEN: 1
};

interface WebSocketWithMetadata extends WebSocket {
  connectionId?: string;
  streamSid?: string;
  callSid?: string;
}

interface OpenAIConnection {
  ws: WebSocket;
  streamSid?: string;
  callSid?: string;
  records: string[];
}

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
  @WebSocketServer()
  server: WebSocket.Server;

  private connections: Map<string, OpenAIConnection> = new Map();

  constructor(
    private readonly callLogService: CallLogService,
    private readonly agentService: AgentService,
    private systemConfigService: SystemConfigService,
  ) {}

  afterInit() {
    console.log('WebSocket server initialized');
  }

  async handleConnection(client: WebSocketWithMetadata, request: IncomingMessage) {
    const openAiApiKey = await this.systemConfigService.getConfigByKey('openai_api_key');
    console.log(openAiApiKey);

    const connectionId = Math.random().toString(36).substring(7);
    client.connectionId = connectionId;

    const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    this.connections.set(connectionId, {
      ws: openAiWs,
      records: [],
    });

    this.setupOpenAiWebSocket(client, connectionId);

    client.on('message', (message: WebSocket.Data) => {
      this.handleMessage(client, message, connectionId);
    });

    client.on('close', () => {
      this.handleDisconnect(client);
    });
  }

  private async setupOpenAiWebSocket(client: WebSocketWithMetadata, connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { ws: openAiWs } = connection;

    openAiWs.on('open', async () => {
      console.log('Connected to the OpenAI Realtime API');
      
      if (!client.callSid) {
        console.error('No call SID found');
        return;
      }

      const callLog = await this.callLogService.findAll({
        where: [{ key: 'call_sid', operator: '=', value: client.callSid }],
      });
      
      if (callLog.length === 0) throw new Error('Call log not found');
      const agent = callLog[0].agent;
      const agentPrompt = await this.agentService.findOne(agent);
      if (!agentPrompt) throw new Error('Agent not found');
      
      await new Promise(resolve => setTimeout(resolve, 250));
      this.sendSessionUpdate(openAiWs, agentPrompt.prompt, callLog[0].name);
      
      this.callLogService.update(callLog[0].id, {
        status: 'called',
      });
    });

    openAiWs.on('message', (data: WebSocket.Data) => {
      this.handleOpenAiMessage(client, connectionId, data);
    });

    openAiWs.on('close', () => {
      console.log('Disconnected from the OpenAI Realtime API');
      this.connections.delete(connectionId);
    });

    openAiWs.on('error', (error) => {
      console.error('Error in the OpenAI WebSocket:', error);
    });
  }

  private sendSessionUpdate(ws: WebSocket, systemMessage: string, personName: string) {
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
    ws.send(JSON.stringify(sessionUpdate));
  }

  private handleOpenAiMessage(client: WebSocketWithMetadata, connectionId: string, data: WebSocket.Data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const response = JSON.parse(data.toString());

      if (LOG_EVENT_TYPES.includes(response.type)) {
        console.log(`Received event: ${response.type}`, response);
      }

      if (response.type === 'response.content.delta' && response.delta) {
        connection.records.push(response.delta);
      }

      if (response.type === 'response.audio.delta' && response.delta) {
        const audioDelta = {
          event: 'media',
          streamSid: connection.streamSid,
          media: {
            payload: Buffer.from(response.delta, 'base64').toString('base64'),
          },
        };
        client.send(JSON.stringify(audioDelta));
      }

      if (response.type === 'response.done') {
        this.updateCallLogWithRecords(connectionId);
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

  private async updateCallLogWithRecords(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection?.callSid) return;

    const records = connection.records.join('');
    console.log(`Updating call log for callSid: ${connection.callSid}`);
    console.log(`Records to be saved: ${records}`);
    
    try {
      const updatedRecord = await this.callLogService.updateCallRecord(connection.callSid, { records });
      console.log(`Call log updated successfully: ${JSON.stringify(updatedRecord)}`);
      connection.records = []; // Reset records for the next interaction
    } catch (error) {
      console.error(`Error updating call log: ${error.message}`);
    }
  }

  private async handleMessage(
    client: WebSocketWithMetadata,
    message: WebSocket.Data,
    connectionId: string,
  ) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const data = JSON.parse(message.toString());

      switch (data.event) {
        case 'media':
          if (connection.ws.readyState === WS_READY_STATES.OPEN) {
            const audioAppend = {
              type: 'input_audio_buffer.append',
              audio: data.media.payload,
            };
            connection.ws.send(JSON.stringify(audioAppend));
          }
          break;
        case 'start':
          connection.streamSid = data.start.streamSid;
          connection.callSid = data.start.callSid;
          client.streamSid = data.start.streamSid;
          client.callSid = data.start.callSid;
          console.log('Incoming stream has started', connection.streamSid);
          console.log('Call SID', connection.callSid);
          break;
        default:
          console.log('Received non-media event:', data.event);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error, 'Message:', message);
    }
  }

  handleDisconnect(client: WebSocketWithMetadata) {
    console.log('Client disconnected');
    if (client.connectionId) {
      const connection = this.connections.get(client.connectionId);
      if (connection?.ws.readyState === WS_READY_STATES.OPEN) {
        connection.ws.close();
      }
      this.connections.delete(client.connectionId);
    }
  }
}