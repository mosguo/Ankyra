import { Module } from "@nestjs/common";
import { AssistantCatalogController } from "./assistant-catalog.controller";
import { AssistantInstanceController } from "./assistant-instance.controller";
import { AssistantCatalogService } from "@packages/application/src/assistants/assistant-catalog.service";
import { AssistantInstanceService } from "@packages/application/src/assistants/assistant-instance.service";
import { AssistantDefinitionRepositoryImpl } from "@packages/infrastructure/src/repositories/assistant-definition.repository.impl";
import { AssistantInstanceRepositoryImpl } from "@packages/infrastructure/src/repositories/assistant-instance.repository.impl";

@Module({
  controllers: [AssistantCatalogController, AssistantInstanceController],
  providers: [
    AssistantCatalogService,
    AssistantInstanceService,
    AssistantDefinitionRepositoryImpl,
    AssistantInstanceRepositoryImpl,
  ],
  exports: [AssistantCatalogService, AssistantInstanceService],
})
export class AssistantsModule {}
