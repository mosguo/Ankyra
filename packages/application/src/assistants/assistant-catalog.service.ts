import { Injectable } from "@nestjs/common";
import { GetAssistantDefinitionQuery } from "../contracts/queries/get-assistant-definition.query";
import { ListAssistantCatalogQuery } from "../contracts/queries/list-assistant-catalog.query";
import { AssistantDefinitionRepositoryImpl } from "@packages/infrastructure/src/repositories/assistant-definition.repository.impl";

@Injectable()
export class AssistantCatalogService {
  constructor(
    private readonly assistantDefinitionRepository: AssistantDefinitionRepositoryImpl,
  ) {}

  async listVisibleAssistants(query: ListAssistantCatalogQuery) {
    const definitions = await this.assistantDefinitionRepository.listVisible(
      query.organization_id,
      query.work_type,
      query.capability_level,
    );

    return definitions.map((definition) => ({
      assistant_definition_id: definition.assistant_definition_id,
      assistant_code: definition.assistant_code,
      assistant_name: definition.assistant_name,
      assistant_description: definition.assistant_description,
      work_type: definition.work_type,
      capability_level: definition.capability_level,
      active_version_id: definition.versions[0]?.assistant_version_id,
      active_version_number: definition.versions[0]?.version_number ?? null,
      active_version_label: definition.versions[0]?.version_label ?? null,
      requires_approval: Boolean(definition.versions[0]?.approval_policy_id),
      supports_memory: Boolean(definition.versions[0]?.memory_policy_id),
      supports_tools: Boolean(definition.versions[0]?.tool_policy_id),
    }));
  }

  async getAssistantDefinition(query: GetAssistantDefinitionQuery) {
    const definition = await this.assistantDefinitionRepository.findById(
      query.assistant_definition_id,
    );

    return definition
      ? {
          assistant_definition_id: definition.assistant_definition_id,
          assistant_code: definition.assistant_code,
          assistant_name: definition.assistant_name,
          assistant_description: definition.assistant_description,
          work_type: definition.work_type,
          capability_level: definition.capability_level,
          latest_version: definition.versions[0]?.version_number ?? null,
          latest_version_label: definition.versions[0]?.version_label ?? null,
          active_version_id: definition.versions[0]?.assistant_version_id ?? null,
          prompt_refs: {
            system_prompt_ref: definition.versions[0]?.system_prompt_ref ?? null,
            developer_prompt_ref: definition.versions[0]?.developer_prompt_ref ?? null,
          },
          runtime_capabilities: {
            requires_approval: Boolean(definition.versions[0]?.approval_policy_id),
            supports_memory: Boolean(definition.versions[0]?.memory_policy_id),
            supports_tools: Boolean(definition.versions[0]?.tool_policy_id),
          },
        }
      : null;
  }
}
