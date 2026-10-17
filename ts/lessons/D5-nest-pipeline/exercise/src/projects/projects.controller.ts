import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { User } from '../auth/users';
import { ProjectsService } from './projects.service';

// Tenhle soubor NEMĚŇ — dekorátory jsou už použité, ty je jen implementuješ.

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

@Controller()
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return user;
  }

  @Get('projects')
  list(@CurrentUser('id') userId: string) {
    return this.projects.listFor(userId);
  }

  @Get('projects/:id')
  get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projects.getFor(userId, id);
  }

  @Post('projects')
  create(@CurrentUser('id') userId: string, @Body() body: { name: string }) {
    return this.projects.create(userId, body.name);
  }
}
