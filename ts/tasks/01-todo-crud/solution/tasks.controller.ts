import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTaskDto, ListTasksQuery, UpdateTaskDto } from './task.dto';
import { Task, TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post() // POST vrací 201 automaticky
  create(@Body() dto: CreateTaskDto): Task {
    return this.tasks.create(dto);
  }

  @Get()
  findAll(@Query() query: ListTasksQuery): Task[] {
    return this.tasks.findAll(query.status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Task {
    return this.tasks.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto): Task {
    return this.tasks.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.tasks.remove(id);
  }
}
