import { Module } from '@nestjs/common';
import { HealthController, ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';

@Module({
  controllers: [HealthController, ProjectsController],
  providers: [
    ProjectsService,
    // TODO: zaregistruj globálně guard, interceptor a filter tak, aby šly přes DI
  ],
})
export class AppModule {}
