import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CursorPaginationDto {
  @ApiPropertyOptional({
    default: 10,
    description: 'Số lượng item muốn lấy',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 10;

  @ApiPropertyOptional({
    default: 0,
    description: 'ID của item cuối cùng trong lần fetch trước',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo ...',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Chiều sắp xếp',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo name hoặc email',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
