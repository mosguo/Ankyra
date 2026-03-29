import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationMessageRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  listByUser(userId: string, filters?: { status?: string; message_type?: string }) {
    return this.prisma.notificationMessage.findMany({
      where: {
        user_id: userId,
        ...(filters?.status ? { delivery_status: filters.status } : {}),
        ...(filters?.message_type ? { message_type: filters.message_type } : {}),
      },
      include: {
        channel: true,
      },
      orderBy: { sent_at: "desc" },
    });
  }

  create(message: {
    notification_message_id: string;
    user_id: string;
    organization_id: string;
    channel_id: string;
    assistant_instance_id?: string | null;
    job_id?: string | null;
    message_type: string;
    message_subject?: string | null;
    message_body_ref?: string | null;
    delivery_status: string;
  }) {
    return this.prisma.notificationMessage.create({
      data: {
        notification_message_id: message.notification_message_id,
        user_id: message.user_id,
        organization_id: message.organization_id,
        channel_id: message.channel_id,
        assistant_instance_id: message.assistant_instance_id ?? null,
        job_id: message.job_id ?? null,
        message_type: message.message_type,
        message_subject: message.message_subject ?? null,
        message_body_ref: message.message_body_ref ?? null,
        delivery_status: message.delivery_status,
        sent_at: new Date(),
      },
    });
  }

  listByJobId(jobId: string) {
    return this.prisma.notificationMessage.findMany({
      where: { job_id: jobId },
      include: { channel: true },
      orderBy: { sent_at: "desc" },
    });
  }
}
