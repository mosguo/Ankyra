import { Controller, Get, Param, Query } from "@nestjs/common";
import { AssistantCatalogService } from "@packages/application/src/assistants/assistant-catalog.service";
import { GetAssistantDefinitionQuery } from "@packages/application/src/contracts/queries/get-assistant-definition.query";
import { ListAssistantCatalogQuery } from "@packages/application/src/contracts/queries/list-assistant-catalog.query";

@Controller("assistants/catalog")
export class AssistantCatalogController {
  constructor(private readonly catalogService: AssistantCatalogService) {}

  @Get()
  listCatalog(@Query() query: ListAssistantCatalogQuery) {
    return this.catalogService.listVisibleAssistants(query);
  }

  @Get(":assistant_definition_id")
  getDetail(@Param("assistant_definition_id") assistantDefinitionId: string) {
    const query: GetAssistantDefinitionQuery = {
      assistant_definition_id: assistantDefinitionId,
    };

    return this.catalogService.getAssistantDefinition(query);
  }
}
