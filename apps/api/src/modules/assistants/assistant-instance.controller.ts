import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AssistantInstanceService } from "@packages/application/src/assistants/assistant-instance.service";
import { CreateAssistantInstanceCommand } from "@packages/application/src/contracts/commands/create-assistant-instance.command";
import { SuspendAssistantInstanceCommand } from "@packages/application/src/contracts/commands/suspend-assistant-instance.command";
import { UpgradeAssistantInstanceCommand } from "@packages/application/src/contracts/commands/upgrade-assistant-instance.command";

@Controller("assistant-instances")
export class AssistantInstanceController {
  constructor(private readonly assistantInstanceService: AssistantInstanceService) {}

  @Get()
  list(@Query("user_id") userId: string) {
    return this.assistantInstanceService.listAssistantInstances(userId);
  }

  @Post()
  create(@Body() command: CreateAssistantInstanceCommand) {
    return this.assistantInstanceService.createAssistantInstance(command);
  }

  @Patch(":assistant_instance_id/upgrade")
  upgrade(
    @Param("assistant_instance_id") assistantInstanceId: string,
    @Body() command: Omit<UpgradeAssistantInstanceCommand, "assistant_instance_id">,
  ) {
    return this.assistantInstanceService.upgradeAssistantInstance({
      ...command,
      assistant_instance_id: assistantInstanceId,
    });
  }

  @Patch(":assistant_instance_id/suspend")
  suspend(
    @Param("assistant_instance_id") assistantInstanceId: string,
    @Body() command: Omit<SuspendAssistantInstanceCommand, "assistant_instance_id">,
  ) {
    return this.assistantInstanceService.suspendAssistantInstance({
      ...command,
      assistant_instance_id: assistantInstanceId,
    });
  }
}
