import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MembershipRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.membership.findMany({
      where: {
        user_id: userId,
        membership_status: "active",
      },
      orderBy: [{ is_primary: "desc" }, { joined_at: "asc" }],
    });
  }
}
