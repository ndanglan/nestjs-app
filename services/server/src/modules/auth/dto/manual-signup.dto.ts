import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';

export class ManualSignupDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Tên người dùng',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email người dùng',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Mật khẩu người dùng. Phải có ít nhất 8 ký tự, chứa ít nhất một chữ cái viết hoa, một số và một ký tự đặc biệt.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  // @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/, {
  //   message:
  //     'Mật khẩu phải có ít nhất một chữ cái viết hoa, một số và một ký tự đặc biệt.',
  // })
  password: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Xác nhận mật khẩu',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Match('password')
  confirm_password: string;
}
