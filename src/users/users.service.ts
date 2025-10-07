import { Injectable } from '@nestjs/common';
import { SignUpDto } from 'src/auth/schema/sign-up.schema';
import { PrismaService } from 'src/commons/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: SignUpDto) {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
      },
      select: { id: true, email: true, name: true },
    });
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true },
    });
    return user;
  }
}
