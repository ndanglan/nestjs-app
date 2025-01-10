import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { RecurrenceType, ReminderType } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ example: 'Team Meeting' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-03-20T11:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({ enum: RecurrenceType, default: RecurrenceType.NONE })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrence?: RecurrenceType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @ApiProperty({ enum: ReminderType, default: ReminderType.NONE })
  @IsOptional()
  @IsEnum(ReminderType)
  reminderType?: ReminderType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  reminderTime?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({ required: false, example: '#FF5733' })
  @IsOptional()
  @IsString()
  color?: string;
}
