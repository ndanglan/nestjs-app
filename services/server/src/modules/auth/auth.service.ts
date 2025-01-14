import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { decrypt } from 'crypto-js/aes';
import * as UTF8 from 'crypto-js/enc-utf8';
import { auth } from 'firebase-admin';
import { Role } from 'src/enums/role.enum';
import { catchAsync } from 'src/helpers/catch-async';
import { UserService } from 'src/modules/users/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class AuthService {
  constructor(
    private user: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService, // Thêm PrismaService
  ) {}

  private validatePassword(password: string) {
    if (
      !/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(
        password,
      )
    ) {
      throw new BadRequestException(
        'Mật khẩu phải có ít nhất một chữ cái viết hoa, một số và một ký tự đặc biệt.',
      );
    }
  }

  private async generateToken(
    user: Omit<User, 'password'>,
    deviceInfo?: string,
  ) {
    // Nếu có deviceInfo, vô hiệu hóa các phiên trước đó từ cùng thiết bị
    if (deviceInfo) {
      await this.prisma.session.updateMany({
        where: {
          userId: user.id,
          deviceInfo: deviceInfo,
          isValid: true,
        },
        data: {
          isValid: false,
        },
      });
    }
    // Tạo access token
    const accessToken = this.jwtService.sign(user, {
      secret: this.configService.get('jwt.secrets'),
      expiresIn: this.configService.get('jwt.expiresInn', '15m'),
    });

    // Tạo refresh token
    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshTokenExpires', '7d'),
      },
    );

    const { exp: accessExp } = this.jwtService.decode(accessToken) as {
      exp: number;
    };
    const { exp: refreshExp } = this.jwtService.decode(refreshToken) as {
      exp: number;
    };
    const refreshExpiresAt = new Date(refreshExp * 1000);

    // Lưu session với refresh token
    await this.prisma.session.create({
      data: {
        token: accessToken,
        refreshToken,
        userId: user.id,
        deviceInfo: deviceInfo || 'Unknown device',
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExp,
    };
  }

  async validateExistingUser(email: string): Promise<User | null> {
    const user = await this.user.findByEmail({ email });
    if (!user) {
      return null;
    }
    return user;
  }

  async validateFirebaseUid(firebaseUid: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid },
    });
    if (!user) {
      return null;
    }
    return user;
  }

  async validateToken(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Cập nhật lastActivity
    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    return session.user;
  }

  async validateUser(email: string): Promise<User | null> {
    const user = await this.user.findByEmail({ email });
    if (user) {
      return user;
    }
    return null;
  }

  private async prepareAuthResponse(user: User, deviceInfo?: string) {
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      ...(await this.generateToken(userWithoutPassword, deviceInfo)),
    };
  }
  // AUTHENTICATION
  async register(name: string, email: string, password: string) {
    const existingUser = await this.validateExistingUser(email);
    if (existingUser) {
      throw new BadRequestException('User with email already exists');
    }
    // Giải mã password từ CryptoJS
    const bytes = decrypt(password, this.configService.get('cryptojs.secret'));
    const decryptedPassword = bytes.toString(UTF8);
    this.validatePassword(decryptedPassword);
    const hashedPassword = await bcrypt.hash(decryptedPassword, 10);
    const user = await this.user.createUser({
      email,
      password: hashedPassword,
      name,
    });

    return this.prepareAuthResponse(user);
  }

  async login(user: User, deviceInfo?: string) {
    return this.prepareAuthResponse(user, deviceInfo);
  }

  async googleAuthWithFirebase(idToken: string) {
    const decodedToken = await catchAsync(async () => {
      return await auth().verifyIdToken(idToken);
    }, null);

    if (!decodedToken) {
      throw new BadRequestException('Không thể xác thực user');
    }

    const email = decodedToken.email;
    const name = decodedToken.name || email.split('@')[0];
    if (!name || !decodedToken.uid) {
      throw new BadRequestException('Không thể xác thực user');
    }

    // Kiểm tra user đã tồn tại chưa
    let user = await this.validateFirebaseUid(decodedToken.uid);

    if (!user) {
      // Tạo user mới nếu chưa tồn tại
      const password = await bcrypt.hash('Abc@1234', 10);
      user = await this.user.createUser({
        email,
        password,
        name,
        firebaseUid: decodedToken.uid, // Lưu thêm Firebase UID
      });
    }
    return this.prepareAuthResponse(user);
  }

  async logout(token: string) {
    await this.prisma.session.update({
      where: { token },
      data: { isValid: false },
    });
    return { message: 'Logged out successfully' };
  }

  async refresh(refreshToken: string) {
    try {
      // Tìm session hợp lệ với refresh token
      const session = await this.prisma.session.findFirst({
        where: {
          refreshToken,
          isValid: true,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token
      const payload = await this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      if (payload.userId !== session.userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Vô hiệu hóa session cũ
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isValid: false },
      });

      // Tạo tokens mới
      const { password: _, ...userWithoutPassword } = session.user;
      return this.generateToken(userWithoutPassword, session.deviceInfo);
    } catch (_) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    // Giải mã mật khẩu từ CryptoJS
    const bytesCurrentPw = decrypt(
      currentPassword,
      this.configService.get('cryptojs.secret'),
    );
    const bytesNewPw = decrypt(
      newPassword,
      this.configService.get('cryptojs.secret'),
    );
    const decryptedCurrentPassword = bytesCurrentPw.toString(UTF8);
    const decryptedNewPassword = bytesNewPw.toString(UTF8);

    // Validate mật khẩu mới
    this.validatePassword(decryptedNewPassword);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(
      decryptedCurrentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    // Hash và cập nhật mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(decryptedNewPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Vô hiệu hóa tất cả các phiên hiện tại
    await this.revokeAllSessions(userId);

    return { message: 'Đổi mật khẩu thành công' };
  }

  async assignRoleToUser(user: any, role: Role) {
    const updatedUser = await this.user.updateUser({
      userId: user.id,
      data: {
        role: role,
      },
    });

    return this.prepareAuthResponse(updatedUser);
  }

  async forgotPassword(email: string) {
    const user = await this.validateExistingUser(email);
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    // Tạo reset token với JWT, hết hạn sau 1 giờ
    const resetToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'password_reset',
      },
      {
        secret: this.configService.get('jwt.resetPasswordSecret'),
        expiresIn: '1h',
      },
    );

    // TODO: Gửi email với link reset password
    // Link sẽ có dạng: frontend-url/reset-password?token={resetToken}

    return {
      resetToken,
      message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn',
    };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    try {
      // Verify token
      const payload = this.jwtService.verify(resetToken, {
        secret: this.configService.get('jwt.resetPasswordSecret'),
      });

      // Kiểm tra loại token
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Token không hợp lệ');
      }

      // Giải mã và validate mật khẩu mới
      const bytesNewPw = decrypt(
        newPassword,
        this.configService.get('cryptojs.secret'),
      );
      const decryptedNewPassword = bytesNewPw.toString(UTF8);
      this.validatePassword(decryptedNewPassword);

      // Hash và cập nhật mật khẩu
      const hashedNewPassword = await bcrypt.hash(decryptedNewPassword, 10);

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedNewPassword },
      });

      // Vô hiệu hóa tất cả các phiên hiện tại
      await this.revokeAllSessions(payload.sub);

      return { message: 'Đặt lại mật khẩu thành công' };
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
      }
      throw error;
    }
  }

  //SESSIONS
  async getUserSessions(userId: number) {
    return await this.prisma.session.findMany({
      where: {
        userId,
        isValid: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        lastActivity: true,
        createdAt: true,
      },
    });
  }

  async revokeSession(sessionId: number, userId: number) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isValid: false },
    });

    return { message: 'Session revoked successfully' };
  }

  async revokeAllSessions(userId: number) {
    await this.prisma.session.updateMany({
      where: { userId, isValid: true },
      data: { isValid: false },
    });

    return { message: 'All sessions revoked successfully' };
  }
}
