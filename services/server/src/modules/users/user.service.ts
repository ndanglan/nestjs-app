import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { CursorPaginationHelper } from 'src/helpers/pagination';
import { CursorPaginationDto } from 'src/helpers/pagination/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async findByEmail(params: { email: string }): Promise<User | null> {
    const { email } = params;
    return this.prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  async findAll(params: CursorPaginationDto) {
    const { take, cursor, sortBy, sortOrder } =
      CursorPaginationHelper.getCursorParams(params);

    // Tạo điều kiện sắp xếp
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const cursorCondition = cursor
      ? {
          cursor: {
            id: cursor,
          },
          skip: 1, // Skip cursor
        }
      : undefined;

    // Thực hiện truy vấn
    const data = await this.prisma.user.findMany({
      ...cursorCondition,
      take,
      orderBy,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return CursorPaginationHelper.createCursorPaginatedResponse(data, params);
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    userId: number;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { userId, data } = params;
    return this.prisma.user.update({
      data,
      where: {
        id: userId,
      },
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
