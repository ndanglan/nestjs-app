import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LocalAuthGuard } from 'src/common/guards/local-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Role } from 'src/enums/role.enum';
import { AuthService } from 'src/modules/auth/auth.service';
import { GoogleAuthDto } from 'src/modules/auth/dto/google-auth.dto';
import { ManualSignupDto } from 'src/modules/auth/dto/manual-signup.dto';
import { RoleDto } from 'src/modules/auth/dto/role.dto';
import { RequestWithUser } from 'src/types/request.type';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google/verify')
  async googleAuthVerify(@Body() googleAuthBody: GoogleAuthDto) {
    return this.authService.googleAuth(googleAuthBody.id_token);
  }

  @Post('signup')
  async register(@Body() signupBody: ManualSignupDto) {
    return this.authService.register(
      signupBody.name,
      signupBody.email,
      signupBody.password,
    );
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @Request() req: RequestWithUser,
    @Headers('user-agent') userAgent: string,
  ) {
    const data = await this.authService.login(
      req.user,
      userAgent, // Truyền thông tin thiết bị
    );
    return data;
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(token);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getSessions(@Request() req) {
    return this.authService.getUserSessions(req.user.id);
  }

  @Delete('sessions/:sessionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async revokeSession(@Param('sessionId') sessionId: string, @Request() req) {
    return this.authService.revokeSession(parseInt(sessionId), req.user.id);
  }

  @Post('sessions/revoke-all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async revokeAllSessions(@Request() req) {
    return this.authService.revokeAllSessions(req.user.id);
  }

  @Post('role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async setRole(@Request() req, @Body() roleBody: RoleDto) {
    return this.authService.assignRoleToUser(req.user, roleBody.role);
  }

  @Get('admin/profile')
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAdminProfile(@Request() req: any) {
    return req.user;
  }

  @Roles(Role.User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user/profile')
  @ApiBearerAuth()
  getUserProfile(@Request() req: any) {
    return req.user;
  }
}
