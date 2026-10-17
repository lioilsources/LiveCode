import { INestApplication } from '@nestjs/common';

// Totéž, co by bylo v main.ts — test volá tuhle funkci.
// TODO: zaregistruj globální ValidationPipe (jaké options a proč?).
export function configureApp(app: INestApplication): INestApplication {
  return app;
}
