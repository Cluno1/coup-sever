import { CommonUserDto } from 'src/user/dto/user.dto';
import {
  Actions,
  Character,
  Player,
  Room,
  RoomBase,
} from '../entities/room.entity';

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

export class PlayerDto {
  //对局玩家信息
  id: number;
  avatar: string;
  name: string;
  characterCardNum: number;
  characterCards: null | Array<number>;
  coin: number;
  allegiance: boolean;
  //对局信息
  isDead: boolean;
  assists: number; //助攻
  kill: number; //击杀数
  challenge: number; //提出质疑数
  assistsKilledId: number; // 被助攻杀的人的id，即被人砍半条命的人的id
  KilledId: number; //被最后一击的人的id
  constructor(player: Player) {
    this.coin = player.coin;
    this.id = player.id;
    this.avatar = player.avatar;
    this.name = player.name;
    this.characterCards = null;
    this.characterCardNum = player.characterCardNum;
    this.allegiance = player.allegiance;
    this.isDead = player.isDead;
    this.assists = player.assists; //助攻
    this.kill = player.kill; //击杀数
    this.challenge = player.challenge; //提出质疑数
    this.assistsKilledId = player.assistsKilledId; // 被助攻杀的人的id，即被人砍半条命的人的id
    this.KilledId = player.KilledId; //被最后一击的人的id
  }
}

export class RoomBaseDto {
  roomId: string; //房间id
  playerNum: number; //玩家人数
  time: string | null;
  round: number; //第几回合
  treasuryReserve: number; //国库里的金币数量
  courtDeckNum: number; //牌数
  courtDeck: Array<number> | null; //[2, 2, 2, 2, 2, 5], //牌堆牌数
  gameOver: boolean; //是否游戏结束
  winnerId: number | null; //胜利的玩家的id
  constructor(rb: RoomBase) {
    this.roomId = rb.roomId;
    this.playerNum = rb.playerNum;
    this.time = rb.time;
    this.round = rb.round;
    this.treasuryReserve = rb.treasuryReserve;
    this.courtDeckNum = rb.courtDeckNum;
    this.courtDeck = null;
    this.gameOver = rb.gameOver;
    this.winnerId = rb.winnerId;
  }
}
export class actionDto {
  character: Character | null;
  actionName: Actions;
  actionVictimId: number; //为 -1 是不存在
  roomId: string;
}
