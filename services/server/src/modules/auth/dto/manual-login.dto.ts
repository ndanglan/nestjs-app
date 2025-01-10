import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ManualLoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email người dùng',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'Mật khẩu người dùng',
  })
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
