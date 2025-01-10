import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetEventsQueryDto } from 'src/modules/events/dto/get-event.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';
import { Role } from 'src/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Events')
@Controller('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(Role.User)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Event created successfully.' })
  create(@Request() req, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(req.user.id, createEventDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Return list of events.' })
  findAll(@Request() req, @Query() query: GetEventsQueryDto) {
    return this.eventsService.findAll(req.user.id, query);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Return a single event.' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.eventsService.findOne(req.user.id, +id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Event updated successfully.' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(req.user.id, +id, updateEventDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Event deleted successfully.' })
  remove(@Request() req, @Param('id') id: string) {
    return this.eventsService.remove(req.user.id, +id);
  }
}
