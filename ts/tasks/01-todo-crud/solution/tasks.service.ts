import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateTaskDto, TaskStatus, UpdateTaskDto } from './task.dto';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TasksService {
  // Map místo pole: O(1) lookup podle id a zachovává pořadí vložení.
  private readonly tasks = new Map<string, Task>();

  create(dto: CreateTaskDto): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.Todo,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  findAll(status?: TaskStatus): Task[] {
    const all = [...this.tasks.values()];
    return status ? all.filter((t) => t.status === status) : all;
  }

  findOne(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  update(id: string, dto: UpdateTaskDto): Task {
    const task = this.findOne(id);
    // Pozor: @IsOptional() pustí i `null` (přeskočí validaci pro null/undefined),
    // takže PATCH {"title": null} by prostým `{ ...task, ...dto }` smazal title.
    const changes = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined && v !== null),
    ) as Partial<Task>;
    const updated: Task = { ...task, ...changes, updatedAt: new Date().toISOString() };
    this.tasks.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.tasks.delete(id)) {
      throw new NotFoundException(`Task ${id} not found`);
    }
  }
}
