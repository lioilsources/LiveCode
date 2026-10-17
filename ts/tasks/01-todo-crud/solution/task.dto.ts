import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
}

export class CreateTaskDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}

// PartialType = všechna pole volitelná, validátory zůstávají.
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class ListTasksQuery {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
