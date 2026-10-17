import { Module } from '@nestjs/common';
import { TasksModule } from './tasks.module';

@Module({
  imports: [TasksModule],
})
export class AppModule {}
