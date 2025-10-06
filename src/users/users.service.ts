import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/commons/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true },
    });
    return user;
  }
}
