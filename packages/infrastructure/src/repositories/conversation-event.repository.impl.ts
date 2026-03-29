import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConversationEventRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  listByConversationId(conversationId: string) {
    return this.prisma.conversationEvent.findMany({
      where: { conversation_id: conversationId },
      orderBy: { event_sequence: "asc" },
    });
  }

  async getNextSequence(conversationId: string): Promise<number> {
    const latest = await this.prisma.conversationEvent.findFirst({
      where: { conversation_id: conversationId },
      orderBy: { event_sequence: "desc" },
    });

    return (latest?.event_sequence ?? 0) + 1;
  }

  createEvent(event: {
    conversation_event_id: string;
    conversation_id: string;
    event_type: string;
    event_sequence: number;
    actor_type: string;
    actor_id?: string;
    content_json?: string;
    tool_name?: string;
    policy_ref?: string;
    trace_id?: string;
  }) {
    return this.prisma.conversationEvent.create({
      data: {
        conversation_event_id: event.conversation_event_id,
        conversation_id: event.conversation_id,
        event_type: event.event_type,
        event_sequence: event.event_sequence,
        actor_type: event.actor_type,
        actor_id: event.actor_id ?? null,
        content_json: event.content_json ?? null,
        tool_name: event.tool_name ?? null,
        policy_ref: event.policy_ref ?? null,
        trace_id: event.trace_id ?? null,
        created_at: new Date(),
      },
    });
  }
}
