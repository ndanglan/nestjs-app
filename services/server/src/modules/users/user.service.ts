import { Injectable, Logger } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { CursorPaginationHelper } from 'src/helpers/pagination';
import { CursorPaginationDto } from 'src/helpers/pagination/dto';
import { CursorPaginatedResult } from 'src/helpers/pagination/type';
import { RedisService } from 'src/modules/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}
  private readonly logger = new Logger('HTTP');
  async getUserById(id: number): Promise<User | null> {
    // Thử lấy từ cache trước
    const cachedUser = await this.redisService.get<User>(`user:${id}`);
    if (cachedUser) {
      this.logger.log(`Lấy người dùng từ cache: ${JSON.stringify(cachedUser)}`);
      return cachedUser;
    }

    // Nếu không có trong cache, lấy từ database
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) {
      this.logger.log(`Lưu người dùng vào cache: ${JSON.stringify(user)}`);
      // Lưu vào cache với TTL 1 giờ (3600 giây)
      await this.redisService.set(`user:${id}`, user, 3600);
    }
    return user;
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
    // Tạo cache key dựa trên các tham số
    const cacheKey = `users:list:${JSON.stringify(params)}`;

    // Kiểm tra cache trước
    const cachedData =
      await this.redisService.get<CursorPaginatedResult<User>>(cacheKey);
    if (cachedData) {
      this.logger.log(`Lấy danh sách người dùng từ cache với key: ${cacheKey}`);
      return cachedData;
    }
    const { take, cursor, sortBy, sortOrder, search } =
      CursorPaginationHelper.getCursorParams(params);

    // Tạo điều kiện sắp xếp
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const where: Prisma.UserWhereInput = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
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
      where,
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
    const result = CursorPaginationHelper.createCursorPaginatedResponse(
      data,
      params,
    );

    await this.redisService.set(cacheKey, result, 300);
    this.logger.log(`Lưu danh sách người dùng vào cache với key: ${cacheKey}`);

    return result;
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
