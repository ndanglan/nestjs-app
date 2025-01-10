import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { decrypt } from 'crypto-js/aes';
import * as UTF8 from 'crypto-js/enc-utf8';
import * as bcrypt from 'bcrypt';
import { Strategy } from 'passport-local';
import { AuthService } from 'src/modules/auth/auth.service';
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      usernameField: 'email', // Vì bạn dùng email thay vì username
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    const bytes = decrypt(password, this.configService.get('cryptojs.secret'));
    const decryptedPassword = bytes.toString(UTF8);
    const user = await this.authService.validateUser(email);
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }
    if (!(await bcrypt.compare(decryptedPassword, user.password))) {
      throw new UnauthorizedException('Mật khẩu sai');
    }
    return user;
  }
}
