import { Body, Controller, Get, Post } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto, RoomReturnDto } from './dto/room.dto';
import { RoomMessageService } from './room.roomMessage.service';

@Controller('room')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly roomMessageService: RoomMessageService,
  ) {}

  @Post('createRoom')
  createRoom(@Body() roomDto: CreateRoomDto) {
    const roomIdArray = this.roomService.findRoomByOwnerName(
      roomDto.owner.name,
    );
    if (roomIdArray.length >= 1) {
      for (let i = 0; i < roomIdArray.length; i++) {
        console.log('删除房间开始');
        this.roomService.deleteRoom(roomIdArray[i]);
        this.roomMessageService.deleteRoomMessage(roomIdArray[i]);
      }
    }
    const r: RoomReturnDto = this.roomService.createRoom(roomDto);
    console.log('success create room ' + r.roomName + r.id);
    return { code: 200, message: 'Success', room: r };
  }

  @Get('roomList')
  getRoomList() {
    return { roomList: this.roomService.getRoomList() };
  }
}
