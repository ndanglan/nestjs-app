import { Module } from '@nestjs/common';
import { UserController } from 'src/modules/users/user.controller';
import { UserService } from 'src/modules/users/user.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
