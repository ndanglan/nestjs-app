import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetEventsQueryDto } from './dto/get-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        userId,
        startTime: new Date(createEventDto.startTime),
        endTime: new Date(createEventDto.endTime),
      },
    });
  }

  async findAll(userId: number, query: GetEventsQueryDto) {
    const { startDate, endDate, categoryId } = query;

    return this.prisma.event.findMany({
      where: {
        userId,
        startTime: startDate ? { gte: new Date(startDate) } : undefined,
        endTime: endDate ? { lte: new Date(endDate) } : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
      },
      include: {
        category: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async findOne(userId: number, id: number) {
    const event = await this.prisma.event.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!event) {
      throw new NotFoundException(`Event #${id} not found`);
    }

    return event;
  }

  async update(userId: number, id: number, updateEventDto: UpdateEventDto) {
    await this.findOne(userId, id); // Check if exists and belongs to user

    return this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        startTime: updateEventDto.startTime
          ? new Date(updateEventDto.startTime)
          : undefined,
        endTime: updateEventDto.endTime
          ? new Date(updateEventDto.endTime)
          : undefined,
      },
    });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id); // Check if exists and belongs to user

    return this.prisma.event.delete({
      where: { id },
    });
  }
}
