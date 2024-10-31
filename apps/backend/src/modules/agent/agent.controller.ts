import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';
import { AgentService } from './agent.service';
import { Agent } from '@/type/database';

@Controller('agent')
export class AgentController extends BaseCrudController<Agent> {
  constructor(private readonly agentService: AgentService) {
    super(agentService);
  }

  // Add any additional methods specific to Agent here
}
