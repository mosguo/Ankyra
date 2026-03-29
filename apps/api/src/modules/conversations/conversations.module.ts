import { Module } from "@nestjs/common";
import { AIRuntimeService } from "@packages/application/src/ai/ai-runtime.service";
import { ConversationService } from "@packages/application/src/conversations/conversation.service";
import { MemoryService } from "@packages/application/src/conversations/memory.service";
import { AssistantInstanceRepositoryImpl } from "@packages/infrastructure/src/repositories/assistant-instance.repository.impl";
import { ConversationEventRepositoryImpl } from "@packages/infrastructure/src/repositories/conversation-event.repository.impl";
import { ConversationRepositoryImpl } from "@packages/infrastructure/src/repositories/conversation.repository.impl";
import { ConversationController } from "./conversation.controller";
import { MemoryController } from "./memory.controller";

@Module({
  controllers: [ConversationController, MemoryController],
  providers: [
    ConversationService,
    MemoryService,
    AIRuntimeService,
    ConversationRepositoryImpl,
    ConversationEventRepositoryImpl,
    AssistantInstanceRepositoryImpl,
  ],
  exports: [ConversationService, MemoryService, AIRuntimeService],
})
export class ConversationsModule {}
