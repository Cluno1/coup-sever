import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 启用 CORS
  app.enableCors({
    origin: 'http://localhost:3001', // 允许的前端地址
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // 允许携带凭证（如 cookies）
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
