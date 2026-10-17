import { INestApplication, ValidationPipe } from '@nestjs/common';

// Totéž, co by bylo v main.ts. Test volá tuhle funkci, aby se globální
// pipes neduplikovaly (a nezapomněly) mezi main.ts a testem.
export function configureApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // zahodí pole bez dekorátoru
      forbidNonWhitelisted: true, // ...nebo spíš rovnou 400
      transform: true, // plain object → instance DTO (+ query stringy → typy)
    }),
  );
  return app;
}
