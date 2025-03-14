import {
  Character,
  Player,
  RoomBase,
  RoomMessage,
} from './entities/room.entity';

export function judgeGameOver(rm: RoomMessage): boolean {
  if (rm.roomBase.gameOver) {
    return;
  }
  let deadNum = 0;
  let winnerId = -1;
  rm.players.forEach((p) => {
    if (p.isDead || p.characterCardNum <= 0 || p.characterCards.length <= 0) {
      deadNum++;
    } else {
      winnerId = p.id;
    }
  });
  if (deadNum + 1 >= rm.roomBase.playerNum) {
    rm.roomBase.gameOver = true;
    rm.roomBase.winnerId = winnerId;
    return true;
  }
  return false;
}

/**
 *Duke,
  Assassin,
  Captain,
  Ambassador,
  Contessa,
  Inquisitor,
 */
export function getCharacterIndexByName(character: Character) {
  switch (character) {
    case Character.Duke:
      return 0;
    case Character.Assassin:
      return 1;
    case Character.Captain:
      return 2;
    case Character.Ambassador:
      return 3;
    case Character.Contessa:
      return 4;
    case Character.Inquisitor:
      return 5;
  }
}

export function getCharacterNameByIndex(index: number) {
  switch (index) {
    case 0:
      return Character.Duke;
    case 1:
      return Character.Assassin;
    case 2:
      return Character.Captain;
    case 3:
      return Character.Ambassador;
    case 4:
      return Character.Contessa;
    case 5:
      return Character.Inquisitor;
  }
}

/**获取卡下标并且减掉相对应的courtDeck的牌，也修改courtDeckNum*/
export function getCardIndex(num: number, roomBase: RoomBase) {
  const cCards: Array<number> = [];
  for (let i = 0; i < num; i++) {
    let court: number;
    try {
      court = getRandomCardsIndex(roomBase);
      cCards.push(court);
    } catch (err) {
      console.log(err);
      //牌不够，没有剩余的牌了
      console.log('牌不够，没有剩余的牌了');
      break;
    }
  }
  console.log('获得了卡牌：', cCards);
  return cCards;
}
function getRandomCardsIndex(roomBase: RoomBase) {
  // 计算总牌数
  const totalCards = roomBase.courtDeckNum;
  if (totalCards <= 0) {
    throw new Error('no courtDeck');
  }
  // 生成一个0到总牌数-1的随机索引
  let randomIndex = Math.floor(Math.random() * totalCards);

  // 根据随机索引找到对应的牌
  let card = 0;
  for (let i = 0; i < roomBase.courtDeck.length; i++) {
    if (roomBase.courtDeck[i] === 0) {
      continue; // 跳过值为0的牌
    }
    if (randomIndex < roomBase.courtDeck[i]) {
      card = i;
      //牌库-1
      roomBase.courtDeck[i]--;
      roomBase.courtDeckNum--;
      break;
    }
    randomIndex -= roomBase.courtDeck[i];
  }

  return card;
}

//随机获取一个阵营 true or false
export function getAllegiance() {
  return Math.random() >= 0.5;
}

//  给id 返回 player
export function getPlayerById(players: Array<Player>, playerId: number) {
  return players.find((p) => p.id === playerId);
}

export function income(room: RoomMessage) {
  const player = getPlayerById(room.players, room.actionRecord.actionPlayerId);
  player.coin++;
}
export function foreignAid(room: RoomMessage) {
  //外援
  const player = getPlayerById(room.players, room.actionRecord.actionPlayerId);
  player.coin += 2;
}
/**
 * 让受击玩家失去一点势力
 * @param player 行动玩家
 * @param victim 受击玩家
 * @param character 失去的卡牌名称
 */
export function victimKilled(
  player: Player,
  victim: Player,
  character: Character | null,
) {
  if (victim.characterCardNum <= 0) {
    return;
  }
  victim.characterCardNum--;
  if (victim.characterCardNum <= 0) {
    victim.isDead = true;
    victim.KilledId = player.id;
    player.kill++;
    victim.characterCards = [];
  } else {
    victim.assistsKilledId = player.id;
    player.assists++;

    let find = false;
    const array = [];
    victim.characterCards.forEach((c) => {
      if (c === getCharacterIndexByName(character)) {
        if (!find) {
          find = true;
        } else {
          array.push(c);
        }
      } else {
        array.push(c);
      }
    });
    victim.characterCards = array;
  }
}
/**
 *coup  受害者可以一张牌也可以两张牌
 * @param room roomMessage房间信息
 * @param character 需要砍杀的角色名称 当受害者就一点势力时可以为null，此时不检测character
 */
export function coup(room: RoomMessage, character: Character | null) {
  const player = getPlayerById(room.players, room.actionRecord.actionPlayerId);
  const victim = getPlayerById(room.players, room.actionRecord.victimPlayerId);
  player.coin -= 7;
  victimKilled(player, victim, character);
}

/**
 * 付钱1改自己 or 2改其他玩家 转换阵营
 * @param room RoomMessage
 */
export function conversion(room: RoomMessage) {
  const player = getPlayerById(room.players, room.actionRecord.actionPlayerId);

  if (room.actionRecord.victimPlayerId === room.actionRecord.actionPlayerId) {
    player.allegiance = !player.allegiance;
    player.coin -= 1;
    room.roomBase.treasuryReserve += 1;
  } else {
    const victim = getPlayerById(
      room.players,
      room.actionRecord.victimPlayerId,
    );
    victim.allegiance = !victim.allegiance;
    player.coin -= 2;
    room.roomBase.treasuryReserve += 2;
  }
}

/**
 * 独吞
 * @param room
 */
export function embezzlement(room: RoomMessage) {
  const player = getPlayerById(room.players, room.actionRecord.actionPlayerId);
  player.coin += room.roomBase.treasuryReserve;
  room.roomBase.treasuryReserve = 0;
}

export function tax(room: RoomMessage) {
  const player = getPlayerById(room.players, room.actionRecord.actionPlayerId);
  player.coin += 3;
}

export function assassinate(room: RoomMessage, character: Character | null) {
  const player = getPlayerById(room.players, room.actionRecord.actionPlayerId);
  const victim = getPlayerById(room.players, room.actionRecord.victimPlayerId);
  player.coin -= 3;
  victimKilled(player, victim, character);
}

export function steal(room: RoomMessage) {
  const player = getPlayerById(room.players, room.actionRecord.actionPlayerId);
  const victim = getPlayerById(room.players, room.actionRecord.victimPlayerId);
  player.coin += 2;
  victim.coin -= 2;
}

/**
 * 交换手牌行动，传入的是数组，该数组会直接替换到受击玩家手牌
 * @param room 房间信息
 * @param newCharacterArray  传入留下的手牌的角色名称，直接更新到手牌就好 传入的可以是一张
 */
export function exchange(
  room: RoomMessage,
  newCharacterArray: Array<Character>,
) {
  console.log('进入交换行动');
  const player = getPlayerById(room.players, room.actionRecord.actionPlayerId);
  player.characterCards = newCharacterArray.map((c) => {
    return getCharacterIndexByName(c);
  });
}

/**
 * 确定更换受害者的手牌 ,随机更新手牌,更新几张看受击玩家有多少张
 * @param room roomMessage
 */
export function examineTrue(room: RoomMessage) {
  const victim = getPlayerById(room.players, room.actionRecord.victimPlayerId);
  if (victim.characterCardNum === 1) {
    victim.characterCards = getCardIndex(1, room.roomBase);
  } else if (victim.characterCardNum === 2) {
    victim.characterCards = getCardIndex(2, room.roomBase);
  }
}
