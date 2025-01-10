import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Role } from 'src/enums/role.enum';

export class RoleDto {
  @ApiProperty({
    example: 'admin',
    description: 'Vai trò người dùng',
  })
  @IsNotEmpty()
  role: Role;
}
