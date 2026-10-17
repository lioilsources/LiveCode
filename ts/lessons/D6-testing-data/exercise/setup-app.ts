// DANÉ — tohle by volal main.ts i e2e test. Jeden zdroj pravdy pro globální pipes.
import { INestApplication, ValidationPipe } from '@nestjs/common';

export function setupApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // zahodí pole bez dekorátoru
      forbidNonWhitelisted: true, // ...a místo zahození vrátí 400
      transform: true, // vytvoří instanci DTO → fungují @Type a defaulty
    }),
  );
  return app;
}
