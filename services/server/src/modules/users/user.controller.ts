import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Role } from 'src/enums/role.enum';
import { CursorPaginationDto } from 'src/helpers/pagination/dto';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(Role.Admin)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng với cursor pagination' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách người dùng thành công',
  })
  async getUsers(@Query() query: CursorPaginationDto) {
    try {
      return this.userService.findAll(query);
    } catch (_) {
      throw new BadRequestException('Không thể lấy danh sách người dùng');
    }
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.user({ id });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Tạo người dùng thành công' })
  async createUser(
    @Body() userData: Pick<User, 'email' | 'name' | 'password'>,
  ) {
    try {
      const existingUser = await this.userService.findByEmail({
        email: userData.email,
      });

      if (existingUser) {
        throw new BadRequestException('Email đã tồn tại');
      }

      return await this.userService.createUser(userData);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Không thể tạo người dùng');
    }
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'Cập nhật người dùng thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<Pick<User, 'email' | 'name' | 'password'>>,
  ) {
    try {
      // Kiểm tra user tồn tại
      const existingUser = await this.userService.user({ id });
      if (!existingUser) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      // Kiểm tra email trùng lặp nếu có cập nhật email
      if (updateData.email) {
        const userWithEmail = await this.userService.findByEmail({
          email: updateData.email,
        });
        if (userWithEmail && userWithEmail.id !== id) {
          throw new BadRequestException('Email đã tồn tại');
        }
      }

      return await this.userService.updateUser({
        userId: id,
        data: updateData,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể cập nhật người dùng');
    }
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Xóa người dùng thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    try {
      // Kiểm tra user tồn tại
      const existingUser = await this.userService.user({ id });
      if (!existingUser) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      return await this.userService.deleteUser({ id });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể xóa người dùng');
    }
  }

  @Get('email/:email')
  @ApiResponse({
    status: 200,
    description: 'Tìm người dùng theo email thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.userService.findByEmail({ email });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }
}
