import { Injectable } from "@nestjs/common";
import { AssistantInstanceDto } from "../contracts/dto/assistant-instance.dto";
import { CreateAssistantInstanceCommand } from "../contracts/commands/create-assistant-instance.command";
import { SuspendAssistantInstanceCommand } from "../contracts/commands/suspend-assistant-instance.command";
import { UpgradeAssistantInstanceCommand } from "../contracts/commands/upgrade-assistant-instance.command";
import { AssistantDefinitionRepositoryImpl } from "@packages/infrastructure/src/repositories/assistant-definition.repository.impl";
import { AssistantInstanceRepositoryImpl } from "@packages/infrastructure/src/repositories/assistant-instance.repository.impl";

@Injectable()
export class AssistantInstanceService {
  constructor(
    private readonly assistantDefinitionRepository: AssistantDefinitionRepositoryImpl,
    private readonly assistantInstanceRepository: AssistantInstanceRepositoryImpl,
  ) {}

  async createAssistantInstance(
    command: CreateAssistantInstanceCommand,
  ): Promise<AssistantInstanceDto> {
    const definition = await this.assistantDefinitionRepository.findById(
      command.assistant_definition_id,
    );

    const saved = await this.assistantInstanceRepository.save({
      assistant_instance_id: `asst-inst-${Date.now()}`,
      assistant_definition_id: command.assistant_definition_id,
      assistant_version_id:
        definition?.versions[0]?.assistant_version_id ?? "assistant-version-demo-001",
      user_id: command.user_id,
      organization_id: command.organization_id,
      instance_name: command.instance_name,
      instance_status: "active",
      approval_status: "not_required",
      activated_at: new Date(),
      last_used_at: null,
    });

    return {
      assistant_instance_id: saved.assistant_instance_id,
      assistant_definition_id: saved.assistant_definition_id,
      assistant_version_id: saved.assistant_version_id,
      instance_name: saved.instance_name ?? undefined,
      instance_status: saved.instance_status,
      approval_status: saved.approval_status,
    };
  }

  async listAssistantInstances(userId: string): Promise<AssistantInstanceDto[]> {
    const instances = await this.assistantInstanceRepository.listByUser(userId);

    return instances.map((instance) => ({
      assistant_instance_id: instance.assistant_instance_id,
      assistant_definition_id: instance.assistant_definition_id,
      assistant_version_id: instance.assistant_version_id,
      instance_name: instance.instance_name ?? undefined,
      instance_status: instance.instance_status,
      approval_status: instance.approval_status,
    }));
  }

  async upgradeAssistantInstance(
    command: UpgradeAssistantInstanceCommand,
  ): Promise<AssistantInstanceDto> {
    const current = await this.assistantInstanceRepository.findById(
      command.assistant_instance_id,
    );
    const targetDefinition = await this.assistantDefinitionRepository.findById(
      command.target_assistant_definition_id,
    );

    const saved = await this.assistantInstanceRepository.save({
      assistant_instance_id: command.assistant_instance_id,
      assistant_definition_id: command.target_assistant_definition_id,
      assistant_version_id:
        targetDefinition?.versions[0]?.assistant_version_id ??
        current?.assistant_version_id ??
        "assistant-version-demo-001",
      user_id: current?.user_id ?? "user-demo-001",
      organization_id: current?.organization_id ?? "org-demo-001",
      instance_name: current?.instance_name ?? undefined,
      instance_status: "active",
      approval_status: current?.approval_status ?? "approved",
      activated_at: current?.activated_at ?? new Date(),
      last_used_at: new Date(),
    });

    return {
      assistant_instance_id: saved.assistant_instance_id,
      assistant_definition_id: saved.assistant_definition_id,
      assistant_version_id: saved.assistant_version_id,
      instance_name: saved.instance_name ?? undefined,
      instance_status: saved.instance_status,
      approval_status: saved.approval_status,
    };
  }

  async suspendAssistantInstance(
    command: SuspendAssistantInstanceCommand,
  ): Promise<AssistantInstanceDto> {
    const current = await this.assistantInstanceRepository.findById(
      command.assistant_instance_id,
    );

    const saved = await this.assistantInstanceRepository.save({
      assistant_instance_id: command.assistant_instance_id,
      assistant_definition_id: current?.assistant_definition_id ?? "assistant-def-demo-001",
      assistant_version_id: current?.assistant_version_id ?? "assistant-version-demo-001",
      user_id: current?.user_id ?? "user-demo-001",
      organization_id: current?.organization_id ?? "org-demo-001",
      instance_name: current?.instance_name ?? undefined,
      instance_status: "suspended",
      approval_status: current?.approval_status ?? "approved",
      activated_at: current?.activated_at ?? new Date(),
      last_used_at: current?.last_used_at ?? null,
    });

    return {
      assistant_instance_id: saved.assistant_instance_id,
      assistant_definition_id: saved.assistant_definition_id,
      assistant_version_id: saved.assistant_version_id,
      instance_name: saved.instance_name ?? undefined,
      instance_status: saved.instance_status,
      approval_status: saved.approval_status,
    };
  }
}
