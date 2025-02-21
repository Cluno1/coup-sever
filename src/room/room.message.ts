export const serverMessage = {
  joinRoom: 'joinRoom',
  leaveRoom: 'leaveRoom',
  sendMessage: 'sendMessage',
  setReady: 'setReady',
  setUnready: 'setUnready',
  ////////////////////////////////
  getOwner: 'getOwner', //获取到带有卡牌的player玩家信息
  getOtherPlayers: 'getOtherPlayers',
  getRoomBase: 'getRoomBase',
  getActionRecord: 'getActionRecord',
  ///////////////////////////////
  /**action发送的信息：{
   *    character, 可以为null
        actionName: 不为空,
        actionVictimId: -1 为不存在,
        roomId
      } */
  action: 'action', //行动玩家提交的行动信息，
  /**playerId:ownerId, 
      roomId */
  challenge: 'challenge', //玩家提交的质疑信息
  /**blockName:b,  b是string ,''时为不阻止
   * character,
     roomId, */
  block: 'block', //玩家提交阻止的信息
  /**
   * 当质疑失败或行动失败，玩家需要提交一个势力并失去。
   */
  challengeKilled: 'challengeKilled', // 当质疑失败或行动失败，玩家需要提交一个势力并失去
  coupOrAssassinateConclusion: 'coupOrAssassinateConclusion', //玩家提交被coup后选择失去的角色
  examineConclusion: 'examineConclusion',
  exchangeConclusion: 'exchangeConclusion',
};

export const clientMessage = {
  playerJoined: 'playerJoined',
  playerLeft: 'playerLeft',
  playersAllReady: 'playersAllReady',
  joinRoomFail: 'joinRoomFail',
  leaveRoomFail: 'leaveRoomFail',
  updatePlayers: 'updatePlayers',
  roomIsFull: 'roomIsFull',
  ///////////////////////////////
  actError: 'actError', //通用错误，如行动错误，阻止错误，质疑错误，保持原样通知前端
  roomBase: 'roomBase', //发送房间基本信息
  allOtherPlayers: 'allOtherPlayers', //这个players数组
  actionRecord: 'actionRecord', //发送对局记录
  owner: 'owner', //返回owner玩家的信息
  challengeIdArray: 'challengeIdArray', //这个返回质疑的玩家Id数组
};
