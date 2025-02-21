import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter, TransformInterceptor } from './app.filter';
import { RoomModule } from './room/room.module';
import { mysqlUrl } from './url';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: mysqlUrl.host,
      port: mysqlUrl.port,
      username: mysqlUrl.username,
      password: mysqlUrl.password,
      database: mysqlUrl.database,
      entities: [User], // 实体
      retryDelay: 500,
      retryAttempts: 10,
      autoLoadEntities: true,
      synchronize: false,
    }),
    UserModule,
    RoomModule,
    ScheduleModule.forRoot(), // 导入并初始化 ScheduleModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
