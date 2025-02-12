import { CommonUserDto } from 'src/user/dto/user.dto';
import { Room } from '../entities/room.entity';

export class CreateRoomDto {
  roomName: string;
  playerCount: number;
  isPublic: boolean;
  password: string | null;
  owner: CommonUserDto;
}

export class RoomReturnDto {
  id: string;
  roomName: string;
  playerCount: number;
  isPublic: boolean;
  password: string | null; //有密码
  owner: CommonUserDto;

  constructor(room: Room) {
    this.id = room.id;
    this.roomName = room.roomName;
    this.playerCount = room.playerCount;
    this.isPublic = room.isPublic;
    this.password = null;
    this.owner = room.owner;
  }
}

export class AddInRoomDto {
  room: RoomReturnDto;
  player: CommonUserDto;
}
