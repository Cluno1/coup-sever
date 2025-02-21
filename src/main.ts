import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { clientUrl } from './url';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 启用 CORS
  app.enableCors({
    origin: clientUrl.originAllow, // 允许的前端地址
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // 允许携带凭证（如 cookies）
  });
  await app.listen(process.env.PORT ?? 3100);
}
bootstrap();
