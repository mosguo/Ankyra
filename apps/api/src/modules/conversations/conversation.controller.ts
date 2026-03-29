import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AIRuntimeService } from "@packages/application/src/ai/ai-runtime.service";
import { ConversationService } from "@packages/application/src/conversations/conversation.service";
import { CreateConversationCommand } from "@packages/application/src/contracts/commands/create-conversation.command";
import { SendConversationMessageCommand } from "@packages/application/src/contracts/commands/send-conversation-message.command";
import { GetConversationDetailQuery } from "@packages/application/src/contracts/queries/get-conversation-detail.query";
import { ListConversationsQuery } from "@packages/application/src/contracts/queries/list-conversations.query";

@Controller("conversations")
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly aiRuntimeService: AIRuntimeService,
  ) {}

  @Get()
  list(@Query() query: ListConversationsQuery) {
    return this.conversationService.listConversations(query);
  }

  @Post()
  create(@Body() command: CreateConversationCommand) {
    return this.conversationService.createConversation(command);
  }

  @Get(":conversation_id")
  detail(
    @Param("conversation_id") conversationId: string,
    @Query("user_id") userId: string,
  ) {
    const query: GetConversationDetailQuery = {
      conversation_id: conversationId,
      user_id: userId,
    };
    return this.conversationService.getConversationDetail(query);
  }

  @Post(":conversation_id/messages")
  sendMessage(
    @Param("conversation_id") conversationId: string,
    @Body() command: Omit<SendConversationMessageCommand, "conversation_id">,
  ) {
    return this.aiRuntimeService.runAssistantTurn({
      ...command,
      conversation_id: conversationId,
    });
  }
}
