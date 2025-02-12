import { Body, Controller, Get, Post } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto, RoomReturnDto } from './dto/room.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post('createRoom')
  createRoom(@Body() roomDto: CreateRoomDto) {
    const r: RoomReturnDto = this.roomService.createRoom(roomDto);
    return { code: 200, message: 'Success', room: r };
  }

  @Get('roomList')
  getRoomList() {
    return { roomList: this.roomService.getRoomList() };
  }
}
