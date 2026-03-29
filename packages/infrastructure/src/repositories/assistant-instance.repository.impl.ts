import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AssistantInstanceRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findById(assistantInstanceId: string) {
    return this.prisma.assistantInstance.findUnique({
      where: { assistant_instance_id: assistantInstanceId },
    });
  }

  listByUser(userId: string) {
    return this.prisma.assistantInstance.findMany({
      where: { user_id: userId },
      orderBy: { activated_at: "desc" },
    });
  }

  save(assistantInstance: {
    assistant_instance_id: string;
    assistant_definition_id: string;
    assistant_version_id: string;
    user_id: string;
    organization_id: string;
    instance_name?: string;
    instance_status: string;
    approval_status: string;
    activated_at?: Date | null;
    last_used_at?: Date | null;
  }) {
    return this.prisma.assistantInstance.upsert({
      where: { assistant_instance_id: assistantInstance.assistant_instance_id },
      update: {
        assistant_definition_id: assistantInstance.assistant_definition_id,
        assistant_version_id: assistantInstance.assistant_version_id,
        instance_name: assistantInstance.instance_name ?? null,
        instance_status: assistantInstance.instance_status,
        approval_status: assistantInstance.approval_status,
        activated_at: assistantInstance.activated_at ?? null,
        last_used_at: assistantInstance.last_used_at ?? null,
      },
      create: {
        assistant_instance_id: assistantInstance.assistant_instance_id,
        assistant_definition_id: assistantInstance.assistant_definition_id,
        assistant_version_id: assistantInstance.assistant_version_id,
        user_id: assistantInstance.user_id,
        organization_id: assistantInstance.organization_id,
        instance_name: assistantInstance.instance_name ?? null,
        instance_status: assistantInstance.instance_status,
        approval_status: assistantInstance.approval_status,
        activated_at: assistantInstance.activated_at ?? null,
        last_used_at: assistantInstance.last_used_at ?? null,
      },
    });
  }
}
