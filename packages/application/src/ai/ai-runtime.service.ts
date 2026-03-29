import { Injectable } from "@nestjs/common";
import { SendConversationMessageCommand } from "../contracts/commands/send-conversation-message.command";
import { ConversationEventRepositoryImpl } from "@packages/infrastructure/src/repositories/conversation-event.repository.impl";
import { ConversationRepositoryImpl } from "@packages/infrastructure/src/repositories/conversation.repository.impl";

@Injectable()
export class AIRuntimeService {
  constructor(
    private readonly conversationRepository: ConversationRepositoryImpl,
    private readonly conversationEventRepository: ConversationEventRepositoryImpl,
  ) {}

  async runAssistantTurn(command: SendConversationMessageCommand) {
    const traceId = `trace-${Date.now()}`;
    const userSequence = await this.conversationEventRepository.getNextSequence(
      command.conversation_id,
    );

    await this.conversationEventRepository.createEvent({
      conversation_event_id: `evt-user-${Date.now()}`,
      conversation_id: command.conversation_id,
      event_type: "user_message",
      event_sequence: userSequence,
      actor_type: "user",
      actor_id: command.user_id,
      content_json: JSON.stringify({ text: command.content }),
      trace_id: traceId,
    });

    const assistantMessage = "Ankyra accepted the message and queued the AI runtime.";
    const assistantSequence = userSequence + 1;

    await this.conversationEventRepository.createEvent({
      conversation_event_id: `evt-assistant-${Date.now()}`,
      conversation_id: command.conversation_id,
      event_type: "assistant_message",
      event_sequence: assistantSequence,
      actor_type: "assistant",
      actor_id: "ankyra-runtime",
      content_json: JSON.stringify({ text: assistantMessage }),
      trace_id: traceId,
    });

    await this.conversationRepository.markActivity(command.conversation_id);

    return {
      conversation_id: command.conversation_id,
      user_message: command.content,
      assistant_message: assistantMessage,
      runtime_status: "accepted",
      trace_id: traceId,
      responded_at: new Date().toISOString(),
    };
  }
}
