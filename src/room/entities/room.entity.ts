import { CommonUserDto, ReadyRoomUserDto } from 'src/user/dto/user.dto';
import { CreateRoomDto } from '../dto/room.dto';

export class Room {
  id: string; //多的
  roomName: string;
  playerCount: number;
  isPublic: boolean;
  password: string | null;
  owner: CommonUserDto;
  players: Array<ReadyRoomUserDto>; //多的

  constructor(createRoomDto: CreateRoomDto) {
    this.roomName = createRoomDto.roomName;
    this.playerCount = createRoomDto.playerCount;
    this.isPublic = createRoomDto.isPublic;
    this.password = createRoomDto.password;
    this.owner = createRoomDto.owner;
    this.players = [];
  }
}
