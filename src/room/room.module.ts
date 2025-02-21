import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { RoomMessageService } from './room.roomMessage.service';

@Module({
  controllers: [RoomController],
  providers: [RoomService, RoomGateway, RoomMessageService],
})
export class RoomModule {}
