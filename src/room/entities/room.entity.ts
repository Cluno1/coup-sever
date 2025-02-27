import { CommonUserDto, ReadyRoomUserDto } from 'src/user/dto/user.dto';
import { CreateRoomDto, PlayerDto } from '../dto/room.dto';
export class Room {
  //这是一个准备房间的
  id: string;
  roomName: string;
  playerCount: number; //房间人数
  isPublic: boolean;
  password: string | null;
  owner: CommonUserDto;
  players: Array<ReadyRoomUserDto>; //实际加入的玩家
  courtDeck: Array<number>; //[2, 2, 2, 2, 2, 5], //牌堆牌数

  constructor(createRoomDto: CreateRoomDto) {
    this.roomName = createRoomDto.roomName;
    this.playerCount = createRoomDto.playerCount;
    this.isPublic = createRoomDto.isPublic;
    this.password = createRoomDto.password;
    this.owner = createRoomDto.owner;
    this.players = [];
    this.courtDeck = [2, 2, 2, 2, 2, 5];
  }
}

export class RoomBase {
  roomId: string; //房间id
  playerNum: number; //玩家人数
  time: string | null;
  round: number; //第几回合
  treasuryReserve: number; //国库里的金币数量
  courtDeckNum: number; //牌数
  courtDeck: Array<number>; //[2, 2, 2, 2, 2, 5], //牌堆牌数
  gameOver: boolean; //是否游戏结束
  winnerId: number | null; //胜利的玩家的id

  constructor(
    roomId: string,
    playerNum: number,
    courtDeckNum: number,
    courtDeck: Array<number>,
  ) {
    this.roomId = roomId;
    this.playerNum = playerNum;
    this.courtDeckNum = courtDeckNum;
    this.courtDeck = courtDeck;
    this.time = null;
    this.round = 1;
    this.treasuryReserve = 0;
    this.gameOver = false;
    this.winnerId = null;
  }
}

export class Player {
  //对局玩家信息
  id: number;
  avatar: string;
  name: string;
  characterCardNum: number;
  characterCards: Array<number>;
  coin: number;
  allegiance: boolean;
  //对局信息
  isDead: boolean;
  assists: number; //助攻
  kill: number; //击杀数
  challenge: number; //提出质疑数
  assistsKilledId: number; // 被助攻杀的人的id，即被人砍半条命的人的id
  KilledId: number; //被最后一击的人的id
  constructor(
    user: ReadyRoomUserDto,
    id: number,
    characterCards: Array<number>,
    allegiance: boolean,
  ) {
    this.id = id;
    this.avatar = user.avatar;
    this.name = user.name;
    this.characterCards = characterCards;
    this.characterCardNum = characterCards.length;
    this.coin = 2;
    this.allegiance = allegiance;
    this.isDead = false;
    this.assists = 0; //助攻
    this.kill = 0; //击杀数
    this.challenge = 0; //提出质疑数
    this.assistsKilledId = 0; // 被助攻杀的人的id，即被人砍半条命的人的id
    this.KilledId = 0; //被最后一击的人的id
  }
}

export class ChallengeConclusion {
  challenger: PlayerDto; //质疑的玩家
  actor: PlayerDto; //行动的玩家
  actorCharacter: Character; //行动玩家声明的角色
  isSuccess: boolean; //是否成功质疑
  constructor(
    actor: Player,
    challenger: Player,
    actorCharacter: Character,
    isSuccess: boolean,
  ) {
    this.actor = new PlayerDto(actor);
    this.challenger = new PlayerDto(challenger);
    this.actorCharacter = actorCharacter;
    this.isSuccess = isSuccess;
  }
}

export enum Period { //各个阶段
  Act = 'Act',
  ActChallenge = 'ActChallenge',
  ChallengeConclusion = 'ChallengeConclusion',
  ActConclusion = 'ActConclusion',
  Block = 'Block',
  BlockChallenge = 'BlockChallenge',
}

export enum Character { //卡牌姓名
  Duke = 'Duke', //男爵
  Assassin = 'Assassin', //刺客
  Captain = 'Captain', //队长
  Ambassador = 'Ambassador', //大使
  Contessa = 'Contessa', //伯爵夫人
  Inquisitor = 'Inquisitor', //审判官
}

export enum Actions { //行动名
  Tax = 'Tax', //收税 男爵                         -》ActChallenge -》ChallengeConclusion -》ActConclusion
  Assassinate = 'Assassinate', //刺杀 刺客         -》ActChallenge -》ChallengeConclusion -》Block -》BlockChallenge-》ChallengeConclusion-》ActConclusion
  Steal = 'Steal', //偷钱 队长                     -》ActChallenge -》ChallengeConclusion -》Block -》BlockChallenge-》ChallengeConclusion-》ActConclusion
  Exchange2 = 'Exchange 2 cards', //大使 换自己牌  -》ActChallenge -》ChallengeConclusion -》ActConclusion
  Exchange1 = 'Exchange 1 card', //审判官 换自己牌 -》ActChallenge -》ChallengeConclusion -》ActConclusion
  Examine = 'Examine', //看人牌，换人牌 审判官     -》ActChallenge -》ChallengeConclusion -》ActConclusion

  //下面是不需要角色就可以行动的普通行动

  Income = 'Income', //1块钱                                  -》ActConclusion
  ForeignAid = 'Foreign Aid', //外援 无受害对象，可被所有人阻止  -》Block -》BlockChallenge-》ChallengeConclusion-》ActConclusion
  Coup = 'Coup', //政变  有受害对象  // TODO二次提交，受害者提交失去的势力                           -》ActConclusion
  Conversion = 'Conversion', //改变阵营自己或他人                -》ActConclusion
  Embezzlement = 'Embezzlement', // 独吞 无受害对象 被质疑有男爵  -》ActChallenge-》ChallengeConclusion-》ActConclusion
}
export enum Blocks { //阻止的行动名
  BlocksForeignAid = 'Blocks Foreign Aid',
  BlocksStealing = 'Blocks Stealing',
  BlocksAssassination = 'Blocks Assassination',
  NoBlock = '',
}

//行动记录  当被质疑成功/阻止成功，就更新actConclusion为false，其他都为true。
export class ActionRecord {
  actionPlayerId: number; //行动玩家id
  period: Period | null; //'Act','ActChallenge','ChallengeConclusion','ActConclusion','Block','BlockChallenge',''ChallengeConclusion'','ActConclusion'
  victimPlayerId: number; //被攻击玩家id
  character: Character | null; //行动玩家声明的角色
  actionName: Actions | null; //行动玩家作的行动
  victimCharacter: Character | null; //被攻击玩家的声明角色
  victimBlock: Blocks | null; //被攻击玩家所阻止的行动
  actConclusion: boolean; //行动是否要成功执行 ，行动结果结算阶段唯一判定依据
  checkCourt: Array<Character> | null; //如果是执行交换牌或看牌的行动,该数组里面是牌的名称
  //'ChallengeConclusion'时候需要更新质疑结果
  challengeConclusion: ChallengeConclusion | null;

  constructor() {
    this.actionPlayerId = 1;
    this.victimPlayerId = -1;
    this.period = Period.Act;
    this.character = null;
    this.actionName = null;
    this.victimCharacter = null;
    this.victimBlock = null;
    this.actConclusion = true;
    this.checkCourt = null;
    this.challengeConclusion = null;
  }
}

//已开局的房间信息
export class RoomMessage {
  id: string;
  isChallenge: boolean; //是否质疑时间，如果true，可以接受用户提交质疑信息到质疑数组 11s
  isBlock: boolean; //是否阻止时间，如果true，可以接受用户提交质疑信息  11s
  challengeArray: Array<number>;
  roomBase: RoomBase;
  players: Array<Player>;
  actionRecord: ActionRecord;
}
