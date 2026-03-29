import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrganizationRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findById(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: { organization_id: organizationId },
    });
  }
}
