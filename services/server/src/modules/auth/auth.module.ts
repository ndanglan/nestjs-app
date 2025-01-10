import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/modules/users/user.module';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { JwtStrategy } from 'src/modules/auth/strategy/jwt.strategy';
import { LocalStrategy } from 'src/modules/auth/strategy/local.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret', 'default-secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn', '1d'),
        },
      }),
    }),
    UserModule,
    PrismaModule, // Thêm dòng này nếu PrismaModule không phải là global
  ],
  providers: [JwtStrategy, LocalStrategy, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
