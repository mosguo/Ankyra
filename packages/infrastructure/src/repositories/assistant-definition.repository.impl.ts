import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AssistantDefinitionRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findById(assistantDefinitionId: string) {
    return this.prisma.assistantDefinition.findUnique({
      where: { assistant_definition_id: assistantDefinitionId },
      include: {
        versions: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });
  }

  listVisible(_organizationId: string, workType?: string, capabilityLevel?: string) {
    return this.prisma.assistantDefinition.findMany({
      where: {
        status: "active",
        ...(workType ? { work_type: workType } : {}),
        ...(capabilityLevel ? { capability_level: capabilityLevel } : {}),
      },
      orderBy: [
        { work_type: "asc" },
        { capability_level: "asc" },
        { assistant_name: "asc" },
      ],
      include: {
        versions: {
          where: { status: "active" },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });
  }
}
