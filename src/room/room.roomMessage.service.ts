import { Injectable } from '@nestjs/common';
import {
  ActionRecord,
  Actions,
  ChallengeConclusion,
  Character,
  Period,
  Player,
  Room,
  RoomBase,
  RoomMessage,
} from './entities/room.entity';
import { actionDto } from './dto/room.dto';
import {
  conversion,
  embezzlement,
  foreignAid,
  getAllegiance,
  getCardIndex,
  getCharacterIndexByName,
  getCharacterNameByIndex,
  getPlayerById,
  income,
  steal,
  tax,
} from './room.actRule';

@Injectable()
export class RoomMessageService {
  private roomMessageList: Array<RoomMessage> = [];
  //初始化 roomMessage
  roomMessageIndex(room: Room) {
    const roomMessage = new RoomMessage();
    roomMessage.id = room.id;
    let cdNum = 0;
    room.courtDeck.forEach((cd) => {
      cdNum += cd;
    });
    //roomBase创建
    const rBase = new RoomBase(
      room.id,
      room.playerCount,
      cdNum,
      room.courtDeck,
    );
    roomMessage.roomBase = rBase;
    //ActionRecord 创建
    const aRecord = new ActionRecord();
    roomMessage.actionRecord = aRecord;

    //Players 创建
    const Players = room.players.map((user, index) => {
      return new Player(
        user,
        index + 1,
        getCardIndex(2, roomMessage.roomBase),
        getAllegiance(),
      );
    });
    roomMessage.players = Players;
    //创建challengeArray
    roomMessage.isChallenge = false; //默认不是挑战时间
    roomMessage.challengeArray = [];

    // is block
    roomMessage.isBlock = false; //默认不是阻止时间
    //创建结束，加入list
    console.log('已经创建好roomMessage:', roomMessage);
    this.roomMessageList.push(roomMessage);
    return roomMessage;
  }
  //获取一个roomMessage
  getRoomMessageById(id: string) {
    return this.roomMessageList.find((room) => room.id === id);
  }

  //Act阶段进来后进入该函数，更新ActionRecord 用于行动玩家提交行动后
  judgeAction(data: actionDto): ActionRecord {
    const roomMessage = this.getRoomMessageById(data.roomId);
    if (roomMessage.actionRecord.period === Period.Act) {
      //改period,victimPlayerId,character,actionName
      const ar = roomMessage.actionRecord;

      //现在是act阶段，需要判定玩家的action
      //改period,victimPlayerId,character
      switch (data.actionName) {
        case Actions.Income:
          ar.period = Period.ActConclusion;
          ar.victimPlayerId = -1;
          ar.character = null;
          break;
        case Actions.Coup:
          if (
            data.actionVictimId <= 0 ||
            data.actionVictimId === ar.actionPlayerId
          ) {
            throw new Error('no found player');
          } else {
            ar.victimPlayerId = data.actionVictimId;
            ar.period = Period.ActConclusion;
            ar.character = null;
          }
          break;
        case Actions.Conversion:
          if (data.actionVictimId <= 0) {
            throw new Error('no found player');
          } else {
            ar.victimPlayerId = data.actionVictimId;
            ar.period = Period.ActConclusion;
            ar.character = null;
          }
          break;
        case Actions.ForeignAid:
          ar.period = Period.Block;
          ar.victimPlayerId = -1;
          ar.character = null;
          break;
        case Actions.Embezzlement:
          ar.period = Period.ActChallenge;
          ar.victimPlayerId = -1;
          ar.character = null;
          break;
        case Actions.Tax:
          if (data.character === Character.Duke) {
            ar.period = Period.ActChallenge;
            ar.victimPlayerId = -1;
            ar.character = data.character;
          } else {
            throw new Error(
              'character ' + data.character + ' can not ' + data.actionName,
            );
          }
          break;
        case Actions.Assassinate:
          if (data.character === Character.Assassin) {
            if (
              data.actionVictimId <= 0 ||
              data.actionVictimId === ar.actionPlayerId
            ) {
              throw new Error('player not right');
            }
            ar.period = Period.ActChallenge;
            ar.victimPlayerId = data.actionVictimId;
            ar.character = data.character;
          } else {
            throw new Error(
              'character ' + data.character + ' can not ' + data.actionName,
            );
          }
          break;
        case Actions.Steal:
          if (data.character === Character.Captain) {
            if (
              data.actionVictimId <= 0 ||
              data.actionVictimId === ar.actionPlayerId
            ) {
              throw new Error('player not right');
            }
            ar.period = Period.ActChallenge;
            ar.victimPlayerId = data.actionVictimId;
            ar.character = data.character;
          } else {
            throw new Error(
              'character ' + data.character + ' can not ' + data.actionName,
            );
          }
          break;
        case Actions.Exchange2:
          if (data.character === Character.Ambassador) {
            if (
              data.actionVictimId <= 0 ||
              data.actionVictimId === ar.actionPlayerId
            ) {
              throw new Error('player not right');
            }
            ar.period = Period.ActChallenge;
            ar.victimPlayerId = data.actionVictimId;
            ar.character = data.character;
          } else {
            throw new Error(
              'character ' + data.character + ' can not ' + data.actionName,
            );
          }
          break;
        case Actions.Exchange1:
          if (data.character === Character.Inquisitor) {
            ar.period = Period.ActChallenge;
            ar.victimPlayerId = -1;
            ar.character = data.character;
          } else {
            throw new Error(
              'character ' + data.character + ' can not ' + data.actionName,
            );
          }
          break;
        case Actions.Examine:
          if (data.character === Character.Inquisitor) {
            if (
              data.actionVictimId <= 0 ||
              data.actionVictimId === ar.actionPlayerId
            ) {
              throw new Error('no found player');
            } else {
              ar.period = Period.ActChallenge;
              ar.victimPlayerId = data.actionVictimId;
              ar.character = data.character;
            }
          } else {
            throw new Error(
              'character ' + data.character + ' can not ' + data.actionName,
            );
          }
          break;
      }
      ar.actionName = data.actionName; //把该行动名称放入roomMessage
    } else {
      throw new Error('period no act');
    }
    return roomMessage.actionRecord;
  }

  /**
   * 结果判定
   * 税收和改变阵营，
   * 独吞 收税 偷窃 看牌 换牌1&2
   * 外援
   * @param roomId 房间id
   */
  directJudgeActConclusion(roomId: string) {
    const roomMessage = this.getRoomMessageById(roomId);
    roomMessage.actionRecord.period = Period.ActConclusion;
    if (!roomMessage.actionRecord.actConclusion) {
      return;
    }
    switch (roomMessage.actionRecord.actionName) {
      case Actions.Income:
        income(roomMessage);
        break;
      case Actions.Conversion:
        conversion(roomMessage);
        break;
      case Actions.Embezzlement:
        embezzlement(roomMessage);
        break;
      case Actions.Tax:
        tax(roomMessage);
        break;
      case Actions.Steal:
        steal(roomMessage);
        break;
      case Actions.ForeignAid:
        foreignAid(roomMessage);
        break;
      case Actions.Examine: //看牌
        let court = [];
        roomMessage.players.forEach((p) => {
          if (p.id === roomMessage.actionRecord.victimPlayerId) {
            court = p.characterCards;
          }
        });
        court = court.map((c) => {
          return getCharacterNameByIndex(c);
        });
        roomMessage.actionRecord.checkCourt = court;
        break;
      case Actions.Exchange1:
        const checkCourt = getCardIndex(1, roomMessage.roomBase);
        roomMessage.actionRecord.checkCourt = checkCourt.map((c) => {
          return getCharacterNameByIndex(c);
        });
        break;
      case Actions.Exchange2:
        const cct = getCardIndex(2, roomMessage.roomBase);
        roomMessage.actionRecord.checkCourt = cct.map((c) => {
          return getCharacterNameByIndex(c);
        });
        break;
      default:
        break;
    }
  }

  //设置下一个玩家行动
  setNextPlayerAct(rooId: string) {
    const rm = this.getRoomMessageById(rooId);
    const pId = rm.actionRecord.actionPlayerId;
    const finePlayers = rm.players.filter(
      (p) => !p.isDead && p.characterCardNum > 0 && p.characterCards.length > 0,
    );
    let overPlayers = finePlayers.filter((p) => p.id > pId);

    overPlayers = overPlayers.sort((a, b) => a.id - b.id);

    let p: Player;
    if (overPlayers.length != 0) {
      p = overPlayers.shift();
    } else {
      let lessPlayers = finePlayers.filter((p) => p.id < pId);
      lessPlayers = lessPlayers.sort((a, b) => a.id - b.id);
      p = lessPlayers.shift();
      rm.roomBase.round++; //如果是在低id的数组找人，意味着新的一回合了
    }

    rm.actionRecord = new ActionRecord(); //初始化新的action record
    rm.actionRecord.actionPlayerId = p.id;
    rm.isBlock = false;
    rm.isChallenge = false;
    rm.challengeArray = [];
  }

  /**
   * 当有人质疑，然后进入到质疑结果公布阶段，要更新challengeConclusion对象
   * @param roomId  id
   */
  handleToChallengeConclusion(roomId: string) {
    const rm = this.getRoomMessageById(roomId);
    function isCharacterIsInPlayer(player: Player, character: Character) {
      return player.characterCards.some(
        (c) => c === getCharacterIndexByName(character),
      );
    }

    //判定质疑结果，
    //首先判定是block challenge 还是 act challenge
    const challenger = getPlayerById(rm.players, rm.challengeArray.shift());
    let actor: Player, isSuccess: boolean, cName: Character;

    if (rm.actionRecord.period === Period.ActChallenge) {
      actor = getPlayerById(rm.players, rm.actionRecord.actionPlayerId);
      if (rm.actionRecord.actionName === Actions.Embezzlement) {
        //独吞，另外判定
        cName = Character.Duke;
        isSuccess = isCharacterIsInPlayer(actor, cName);
        if (isSuccess) {
          rm.actionRecord.actConclusion = false;
        }
      } else {
        cName = rm.actionRecord.character;
        isSuccess = !isCharacterIsInPlayer(actor, cName);
        if (isSuccess) {
          rm.actionRecord.actConclusion = false;
        }
      }
    } else if (rm.actionRecord.period === Period.BlockChallenge) {
      //判定阻止玩家被质疑
      actor = getPlayerById(rm.players, rm.actionRecord.victimPlayerId);
      cName = rm.actionRecord.victimCharacter;
      isSuccess = !isCharacterIsInPlayer(actor, cName);
      if (!isSuccess) {
        rm.actionRecord.actConclusion = false;
      }
    }

    const cc = new ChallengeConclusion(actor, challenger, cName, isSuccess);
    rm.actionRecord.challengeConclusion = cc;
    rm.actionRecord.period = Period.ChallengeConclusion; //阶段设置为结果阶段
  }
}
