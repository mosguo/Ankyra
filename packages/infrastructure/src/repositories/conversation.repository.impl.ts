import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConversationRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findById(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { conversation_id: conversationId },
      include: {
        events: {
          orderBy: { event_sequence: "asc" },
        },
      },
    });
  }

  listByUser(userId: string, filters?: { assistant_instance_id?: string; status?: string }) {
    return this.prisma.conversation.findMany({
      where: {
        user_id: userId,
        ...(filters?.assistant_instance_id
          ? { assistant_instance_id: filters.assistant_instance_id }
          : {}),
        ...(filters?.status ? { conversation_status: filters.status } : {}),
      },
      orderBy: { last_activity_at: "desc" },
    });
  }

  save(conversation: {
    conversation_id: string;
    assistant_instance_id: string;
    user_id: string;
    organization_id: string;
    conversation_status: string;
    channel?: string;
  }) {
    return this.prisma.conversation.upsert({
      where: { conversation_id: conversation.conversation_id },
      update: {
        conversation_status: conversation.conversation_status,
        channel: conversation.channel ?? null,
        last_activity_at: new Date(),
      },
      create: {
        conversation_id: conversation.conversation_id,
        assistant_instance_id: conversation.assistant_instance_id,
        user_id: conversation.user_id,
        organization_id: conversation.organization_id,
        conversation_status: conversation.conversation_status,
        channel: conversation.channel ?? null,
        started_at: new Date(),
        last_activity_at: new Date(),
      },
    });
  }

  markActivity(conversationId: string) {
    return this.prisma.conversation.update({
      where: { conversation_id: conversationId },
      data: {
        last_activity_at: new Date(),
      },
    });
  }
}
