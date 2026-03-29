import { Injectable } from "@nestjs/common";
import { ConversationDto } from "../contracts/dto/conversation.dto";
import { CreateConversationCommand } from "../contracts/commands/create-conversation.command";
import { GetConversationDetailQuery } from "../contracts/queries/get-conversation-detail.query";
import { ListConversationsQuery } from "../contracts/queries/list-conversations.query";
import { AssistantInstanceRepositoryImpl } from "@packages/infrastructure/src/repositories/assistant-instance.repository.impl";
import { ConversationRepositoryImpl } from "@packages/infrastructure/src/repositories/conversation.repository.impl";

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepositoryImpl,
    private readonly assistantInstanceRepository: AssistantInstanceRepositoryImpl,
  ) {}

  async createConversation(command: CreateConversationCommand): Promise<ConversationDto> {
    const assistantInstance = await this.assistantInstanceRepository.findById(
      command.assistant_instance_id,
    );

    const saved = await this.conversationRepository.save({
      conversation_id: `conv-${Date.now()}`,
      assistant_instance_id: command.assistant_instance_id,
      user_id: command.user_id,
      organization_id: assistantInstance?.organization_id ?? "org-demo-001",
      conversation_status: "active",
      channel: command.channel ?? "web",
    });

    return {
      conversation_id: saved.conversation_id,
      assistant_instance_id: saved.assistant_instance_id,
      conversation_status: saved.conversation_status,
      channel: saved.channel ?? undefined,
      last_activity_at: saved.last_activity_at?.toISOString(),
    };
  }

  async listConversations(query: ListConversationsQuery): Promise<ConversationDto[]> {
    const conversations = await this.conversationRepository.listByUser(query.user_id, {
      assistant_instance_id: query.assistant_instance_id,
      status: query.status,
    });

    return conversations.map((conversation) => ({
      conversation_id: conversation.conversation_id,
      assistant_instance_id: conversation.assistant_instance_id,
      conversation_status: conversation.conversation_status,
      channel: conversation.channel ?? undefined,
      last_activity_at: conversation.last_activity_at?.toISOString(),
    }));
  }

  async getConversationDetail(query: GetConversationDetailQuery) {
    const conversation = await this.conversationRepository.findById(query.conversation_id);

    if (!conversation || conversation.user_id !== query.user_id) {
      return null;
    }

    return {
      conversation_id: conversation.conversation_id,
      assistant_instance_id: conversation.assistant_instance_id,
      conversation_status: conversation.conversation_status,
      channel: conversation.channel ?? undefined,
      last_activity_at: conversation.last_activity_at?.toISOString(),
      events: conversation.events.map((event) => ({
        conversation_event_id: event.conversation_event_id,
        event_type: event.event_type,
        actor_type: event.actor_type,
        content_json: event.content_json,
        created_at: event.created_at.toISOString(),
      })),
    };
  }
}
