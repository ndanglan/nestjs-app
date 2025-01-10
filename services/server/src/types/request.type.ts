import { User } from '@prisma/client';
import { Request } from 'express';

export type RequestWithUser = Request & {
  user: User;
};
