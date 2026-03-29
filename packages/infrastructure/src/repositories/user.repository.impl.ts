import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { user_id: userId },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  save(user: {
    user_id: string;
    user_code: string;
    display_name: string;
    email?: string;
    status: string;
    default_organization_id?: string | null;
  }) {
    return this.prisma.user.upsert({
      where: { user_id: user.user_id },
      update: {
        display_name: user.display_name,
        email: user.email ?? null,
        status: user.status,
        default_organization_id: user.default_organization_id ?? null,
        updated_at: new Date(),
      },
      create: {
        user_id: user.user_id,
        user_code: user.user_code,
        display_name: user.display_name,
        email: user.email ?? null,
        status: user.status,
        default_organization_id: user.default_organization_id ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }
}
