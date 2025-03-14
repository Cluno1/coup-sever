import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  actionDto,
  AddInRoomDto,
  PlayerDto,
  RoomBaseDto,
} from './dto/room.dto';
import { RoomService } from './room.service';
import { clientMessage, serverMessage } from './room.message';
import { webSocketUrl } from 'src/url';
import { RoomMessageService } from './room.roomMessage.service';
import {
  Actions,
  Blocks,
  Character,
  Period,
  Player,
} from './entities/room.entity';
import {
  assassinate,
  coup,
  examineTrue,
  exchange,
  judgeGameOver,
  victimKilled,
} from './room.actRule';

@WebSocketGateway({
  namespace: 'room',
  cors: {
    origin: webSocketUrl.originAllow, // 允许的前端地址
    methods: ['GET', 'POST'],
    credentials: false,
  },
})
export class RoomGateway {
  @WebSocketServer()
  server: Server;
  constructor(
    private readonly roomService: RoomService,
    private readonly roomMessageService: RoomMessageService,
  ) {}

  /**
   * 添加到房间,更新所有玩家的数组 ReadyRoomUserDto
   * @param data AddInRoomDto 用玩家信息和房间信息，验证并加入房间
   * @param client Socket
   */
  @SubscribeMessage(serverMessage.joinRoom)
  handleJoinRoom(
    @MessageBody() data: AddInRoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log(data.player.name + ' want to join room ' + data.room.roomName);
    if (!data.room?.roomName) {
      client.emit(clientMessage.joinRoomFail, 'join room fail');
      return;
    }
    const { room } = data;
    const result = this.roomService.addInRoom(data);
    if (typeof result !== 'object' || !('error' in result)) {
      client.join(room.id); // 加入房间
      this.roomService.setClientByUserName(data.player.name, client); //存储用户的client
      console.log(data.player.name + ' join in room');
      this.server
        .to(room.id)
        .emit(clientMessage.playerJoined, { players: result });
    } else {
      client.emit(result.type, result.error); // 发送失败消息
    }
  }

  /**
   * 离开房间,更新所有玩家的玩家数组 ReadyRoomUserDto
   * @param data
   * @param client
   */
  @SubscribeMessage(serverMessage.leaveRoom)
  handleLeaveRoom(
    @MessageBody() data: AddInRoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { room } = data;
    const result = this.roomService.leaveRoom(data);
    if (typeof result !== 'object' || !('error' in result)) {
      client.leave(room.id);
      this.roomService.deleteClientByUserName(data.player.name); //删除client
      console.log(data.player.name + ' leave room');
      this.server
        .to(room.id)
        .emit(clientMessage.playerLeft, { players: result });
    } else {
      client.emit(result.type, result.error); // 发送失败消息
    }
  }

  //当用户重连,需要发送这个到map
  @SubscribeMessage(serverMessage.setClientToMap)
  handleSetClientToMap(
    @MessageBody() data: { userName: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('重新连接 server', data);
    client.join(data.roomId); // 加入房间

    this.roomService.setClientByUserName(data.userName, client);
  }

  // 当客户端断开时自动触发
  async handleDisconnect(client: Socket) {
    // 从 Map 中移除用户
    console.log('从 Map 中移除用户');
    this.roomService.deleteClientBySocket(client);
  }

  @SubscribeMessage(serverMessage.setReady)
  handleReady(@MessageBody() data: AddInRoomDto) {
    const isAllReady = this.roomService.setIsReady(data, true);

    console.log(data.player.name + ' set ready is ok');
    this.server.to(data.room.id).emit(clientMessage.updatePlayers, {
      players: this.roomService.getPlayersByRoomId(data.room.id),
    });

    if (isAllReady) {
      //全部人都已经设置了准备好
      console.log('all ready');
      this.server.to(data.room.id).emit(clientMessage.playersAllReady); //发送所有人都准备好了
      //初始化房间对局信息
      const roomMessage = this.roomMessageService.roomMessageIndex(
        this.roomService.getRoomById(data.room.id),
      );
      //发送
      console.log('ready to send');
      this.server
        .to(data.room.id)
        .emit(clientMessage.roomBase, { roomBase: roomMessage.roomBase });

      this.server.to(data.room.id).emit(clientMessage.actionRecord, {
        actionRecord: roomMessage.actionRecord,
      });
      console.log('ok send');
    }
  }

  @SubscribeMessage(serverMessage.setUnready)
  handleUnready(@MessageBody() data: AddInRoomDto) {
    this.roomService.setIsReady(data, false);
    console.log(data.player.name + ' set unready is ok');
    this.server.to(data.room.id).emit(clientMessage.updatePlayers, {
      players: this.roomService.getPlayersByRoomId(data.room.id),
    });
  }

  ///////////////////////////////////

  @SubscribeMessage(serverMessage.getOwner) //获取owner玩家的信息
  handleGetOwner(
    @MessageBody() data: { name: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('获取owner玩家的信息', data);
    if (!data || !data?.name || !data?.roomId) {
      return;
    }
    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      return;
    }
    const player = rm.players.find((p) => p.name === data.name);
    client.emit(clientMessage.owner, { owner: player });
  }

  @SubscribeMessage(serverMessage.getActionRecord) //获取ActionRecord的信息
  handleGetActionRecord(
    @MessageBody() data: { name: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('获取ActionRecord的信息', data);
    if (!data || !data?.name || !data?.roomId) {
      return;
    }
    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      console.log('rm no find');
      return;
    }
    client.emit(clientMessage.actionRecord, { actionRecord: rm.actionRecord });
  }

  @SubscribeMessage(serverMessage.getRoomBase) //获取roomBase的信息
  handleGetRoomBase(
    @MessageBody() data: { name: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('获取roomBase的信息', data);
    if (!data || !data?.name || !data?.roomId) {
      return;
    }
    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      return;
    }
    const rb = new RoomBaseDto(rm.roomBase);
    client.emit(clientMessage.roomBase, { roomBase: rb });
  }

  @SubscribeMessage(serverMessage.getOtherPlayers) //获取其他玩家的信息
  handleGetOtherPlayers(
    @MessageBody() data: { name: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('获取其他玩家的信息');
    if (!data || !data?.name || !data?.roomId) {
      return;
    }
    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      return;
    }
    const otherPlayers = rm.players.filter((p) => p.name !== data.name);
    const psDto = otherPlayers.map((p) => {
      return new PlayerDto(p);
    });
    client.emit(clientMessage.allOtherPlayers, { allOtherPlayers: psDto });
  }

  @SubscribeMessage(serverMessage.action) //提交行动信息
  handleAction(
    @MessageBody()
    data: actionDto,
    @ConnectedSocket()
    client: Socket,
  ) {
    console.log('玩家提交行动信息', data);
    try {
      const rm = this.roomMessageService.getRoomMessageById(data.roomId);
      if (rm === undefined) {
        return;
      }
      const actionRecord = this.roomMessageService.judgeAction(data);

      if (actionRecord.period === Period.ActConclusion) {
        //直接跳到结果判定了
        console.log('结果直接判定');
        actionRecord.actConclusion = true;
        this.roomMessageService.directJudgeActConclusion(data.roomId); //进入行动结果阶段，更新actionRecord
        //更新前端对局信息
        this.server
          .to(data.roomId)
          .emit(clientMessage.actionRecord, { actionRecord: actionRecord });
        this.server
          .to(data.roomId)
          .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
        console.log('send 成功');
        //如果行动是coup 会收取二次提交 , 改阵营 和税收需要 5s后设置下一个玩家行动
        if (actionRecord.actionName != Actions.Coup) {
          console.log('设置5s后到下一个玩家');
          setTimeout(() => {
            this.roomMessageService.setNextPlayerAct(rm.id);
            console.log('开始下一个玩家', rm, data);
            // // 获取房间中的客户端数量
            // const roomClients = this.server.sockets.adapter.rooms.get(rm.id);
            // const clientCount = roomClients ? roomClients.size : 0;
            // console.log(`Room ${rm.id} now has ${clientCount} clients.`);
            this.server.to(data.roomId).emit(clientMessage.actionRecord, {
              actionRecord: rm.actionRecord,
            });
            this.server
              .to(data.roomId)
              .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
          }, 5000);
        }
      } else if (actionRecord.period === Period.Block) {
        //是外援
        rm.isBlock = true;
        const recordTemp = rm.actionRecord; //记录一个暂时的actionRecord地址，15s后如果地址相同，则认为相同的对局
        //更新前端对局信息
        this.server
          .to(data.roomId)
          .emit(clientMessage.actionRecord, { actionRecord: rm.actionRecord });
        this.server
          .to(data.roomId)
          .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
        setTimeout(() => {
          if (rm.actionRecord === recordTemp && rm.isBlock) {
            //11s后actionRecord地址没有变且还是阻止阶段，就可以执行行动了
            rm.isBlock = false;
            this.roomMessageService.directJudgeActConclusion(rm.id);
            rm.actionRecord.period = Period.ActConclusion;

            this.server.to(data.roomId).emit(clientMessage.actionRecord, {
              actionRecord: rm.actionRecord,
            });
            this.server
              .to(data.roomId)
              .emit(clientMessage.roomBase, { roomBase: rm.roomBase });

            setTimeout(() => {
              this.roomMessageService.setNextPlayerAct(rm.id);
              this.server.to(data.roomId).emit(clientMessage.actionRecord, {
                actionRecord: rm.actionRecord,
              });
              this.server
                .to(data.roomId)
                .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
            }, 5000);
          }
        }, 15000);
      } else {
        //刺杀，偷钱,独吞，收税，换牌，看牌会进入

        console.log('发送行动信息给玩家，让玩家质疑');
        rm.isChallenge = true;
        rm.challengeArray = []; //初始化 质疑数组
        this.server
          .to(data.roomId)
          .emit(clientMessage.actionRecord, { actionRecord: rm.actionRecord });

        this.server.to(data.roomId).emit(clientMessage.challengeIdArray, {
          challengeIdArray: rm.challengeArray,
        }); //发送质疑数组
        //进入11秒倒计时，倒计时结束不再接受玩家质疑并且更新质疑结果给玩家
        setTimeout(() => {
          rm.isChallenge = false;
          if (rm.challengeArray.length > 0) {
            //有人质疑
            this.roomMessageService.handleToChallengeConclusion(rm.id);
            this.server.to(data.roomId).emit(clientMessage.actionRecord, {
              actionRecord: rm.actionRecord,
            });
            this.server
              .to(data.roomId)
              .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
          } else {
            //无人质疑
            if (
              rm.actionRecord.actionName === Actions.Embezzlement ||
              rm.actionRecord.actionName === Actions.Tax ||
              rm.actionRecord.actionName === Actions.Examine ||
              rm.actionRecord.actionName === Actions.Exchange1 ||
              rm.actionRecord.actionName === Actions.Exchange2
            ) {
              this.roomMessageService.directJudgeActConclusion(rm.id);
              rm.actionRecord.period = Period.ActConclusion;
              //更新前端对局信息
              this.server.to(data.roomId).emit(clientMessage.actionRecord, {
                actionRecord: rm.actionRecord,
              });
              this.server
                .to(data.roomId)
                .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
              if (
                rm.actionRecord.actionName === Actions.Embezzlement ||
                rm.actionRecord.actionName === Actions.Tax
              ) {
                setTimeout(() => {
                  this.roomMessageService.setNextPlayerAct(rm.id);
                  this.server.to(data.roomId).emit(clientMessage.actionRecord, {
                    actionRecord: rm.actionRecord,
                  });
                  this.server
                    .to(data.roomId)
                    .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
                }, 5000);
              }
            } else {
              //TODO 刺杀 偷钱
              rm.isBlock = true;
              rm.actionRecord.period = Period.Block;

              const recordTemp = rm.actionRecord; //记录一个暂时的actionRecord地址，15s后如果地址相同，则认为相同的对局
              //更新前端对局信息
              this.server.to(data.roomId).emit(clientMessage.actionRecord, {
                actionRecord: rm.actionRecord,
              });
              this.server
                .to(data.roomId)
                .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
              setTimeout(() => {
                if (rm.actionRecord === recordTemp && rm.isBlock) {
                  rm.isBlock = false;
                  //无人提交阻止
                  this.roomMessageService.directJudgeActConclusion(rm.id);
                  rm.actionRecord.period = Period.ActConclusion;
                  this.server.to(data.roomId).emit(clientMessage.actionRecord, {
                    actionRecord: rm.actionRecord,
                  });
                  this.server
                    .to(data.roomId)
                    .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
                  if (rm.actionRecord.actionName === Actions.Steal) {
                    setTimeout(() => {
                      this.roomMessageService.setNextPlayerAct(rm.id);
                      this.server
                        .to(data.roomId)
                        .emit(clientMessage.actionRecord, {
                          actionRecord: rm.actionRecord,
                        });
                      this.server.to(data.roomId).emit(clientMessage.roomBase, {
                        roomBase: rm.roomBase,
                      });
                    }, 5000);
                  }
                }
              }, 15000); //15s 的质疑时间
            }
          }
        }, 15000);
      }
    } catch (err) {
      console.log('error', err);

      client.emit(clientMessage.actError, { actError: err.message });
    }
  }

  @SubscribeMessage(serverMessage.challenge) //提交质疑信息 很多玩家都提交的
  handleChallenge(
    @MessageBody()
    data: {
      playerId: number;
      roomId: string;
    },
  ) {
    console.log(data, '玩家提交challenge质疑信息');
    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      return;
    }
    if (rm.isChallenge) {
      rm.challengeArray.push(data.playerId);
      this.server.to(data.roomId).emit(clientMessage.challengeIdArray, {
        challengeIdArray: rm.challengeArray,
      }); //更新前端质疑数组
    } else {
      this.server.to(data.roomId).emit(clientMessage.actError, {
        actError: '质疑超时，当前时间不能质疑',
      });
    }
  }

  @SubscribeMessage(serverMessage.block) //提交阻止信息
  handleBlock(
    @MessageBody()
    data: {
      playerId: number | null;
      character: Character;
      blockName: Blocks;
      roomId: string;
    },
  ) {
    //TODO block
    console.log(data, 'block');

    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      return;
    }
    if (rm.isBlock) {
      rm.isBlock = false;
      if (rm.actionRecord.actionName === Actions.ForeignAid) {
        rm.actionRecord.victimPlayerId = data.playerId;
      }
      rm.actionRecord.victimCharacter = data.character;
      rm.actionRecord.victimBlock = data.blockName;
      rm.actionRecord.period = Period.BlockChallenge;
      rm.isChallenge = true; //被挑战 开
      rm.challengeArray = [];
      //发送新的对局消息
      this.server
        .to(data.roomId)
        .emit(clientMessage.actionRecord, { actionRecord: rm.actionRecord });
      setTimeout(() => {
        rm.isChallenge = false;
        if (rm.challengeArray.length > 0) {
          //have some one challenge
          //有人质疑
          this.roomMessageService.handleToChallengeConclusion(rm.id);
          this.server.to(data.roomId).emit(clientMessage.actionRecord, {
            actionRecord: rm.actionRecord,
          });
          this.server
            .to(data.roomId)
            .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
        } else {
          // 无人质疑
          rm.actionRecord.actConclusion = false;
          rm.actionRecord.period = Period.ActConclusion;
          this.server.to(data.roomId).emit(clientMessage.actionRecord, {
            actionRecord: rm.actionRecord,
          });
          this.server
            .to(data.roomId)
            .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
          setTimeout(() => {
            this.roomMessageService.setNextPlayerAct(rm.id);
            this.server.to(data.roomId).emit(clientMessage.actionRecord, {
              actionRecord: rm.actionRecord,
            });
            this.server
              .to(data.roomId)
              .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
          }, 5000);
        }
      }, 15000);
    } else {
      this.server.to(data.roomId).emit(clientMessage.actError, {
        actError: '阻止超时，当前时间已不能阻止',
      });
    }
  }

  @SubscribeMessage(serverMessage.challengeKilled) //提交因为质疑失去势力的信息
  handleChallengeKilled(
    @MessageBody()
    data: {
      playerId: number;
      roomId: string;
      character: Character | null; //失去的势力
    },
  ) {
    // killed 更新player信息并且更新到下一个阶段
    console.log(data, 'challengeKilled');
    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      return;
    }
    if (rm.actionRecord.period != Period.ChallengeConclusion) {
      console.log('该阶段不是挑战结果阶段');
      return;
    }
    const actorId = rm.actionRecord.challengeConclusion.actor.id;
    const challengerId = rm.actionRecord.challengeConclusion.challenger.id; //挑战者

    let actor: Player, challenger: Player;
    rm.players.forEach((p) => {
      if (p.id === actorId) {
        actor = p;
      }
      if (p.id === challengerId) {
        challenger = p;
      }
    });

    if (data.playerId === actor.id) {
      victimKilled(challenger, actor, data.character);
    } else if (data.playerId === challenger.id) {
      victimKilled(actor, challenger, data.character);
    }

    if (judgeGameOver(rm)) {
      this.server
        .to(data.roomId)
        .emit(clientMessage.actionRecord, { actionRecord: rm.actionRecord });
      this.server
        .to(data.roomId)
        .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
      return;
    }
    rm.challengeArray = [];
    rm.actionRecord.challengeConclusion = null;

    //如果已经行动失败了,就没有继续的意义了,直接结尾
    if (!rm.actionRecord.actConclusion) {
      rm.actionRecord.period = Period.ActConclusion;
      this.server.to(data.roomId).emit(clientMessage.actionRecord, {
        actionRecord: rm.actionRecord,
      });
      this.server.to(data.roomId).emit(clientMessage.roomBase, {
        roomBase: rm.roomBase,
      });
      setTimeout(() => {
        this.roomMessageService.setNextPlayerAct(rm.id);
        this.server.to(data.roomId).emit(clientMessage.actionRecord, {
          actionRecord: rm.actionRecord,
        });
        this.server.to(data.roomId).emit(clientMessage.roomBase, {
          roomBase: rm.roomBase,
        });
      }, 5000);
    }

    if (
      rm.actionRecord.actionName === Actions.Assassinate ||
      rm.actionRecord.actionName === Actions.Steal
    ) {
      console.log('偷钱或刺杀 行动被质疑');
      //判定是block 还是 act
      if (actor.id === rm.actionRecord.actionPlayerId) {
        //行动玩家被质疑后
        console.log('偷钱或刺杀 行动被质疑 但是没有被质疑成功');

        rm.isBlock = true;
        rm.actionRecord.period = Period.Block;
        const recordTemp = rm.actionRecord; //记录一个暂时的actionRecord地址，15s后如果地址相同，则认为相同的对局
        //更新前端对局信息
        this.server.to(data.roomId).emit(clientMessage.actionRecord, {
          actionRecord: rm.actionRecord,
        });
        this.server
          .to(data.roomId)
          .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
        setTimeout(() => {
          if (rm.actionRecord === recordTemp && rm.isBlock) {
            rm.isBlock = false;
            //无人提交阻止
            this.roomMessageService.directJudgeActConclusion(rm.id);
            rm.actionRecord.period = Period.ActConclusion;
            this.server.to(data.roomId).emit(clientMessage.actionRecord, {
              actionRecord: rm.actionRecord,
            });
            this.server
              .to(data.roomId)
              .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
            if (rm.actionRecord.actionName === Actions.Steal) {
              setTimeout(() => {
                this.roomMessageService.setNextPlayerAct(rm.id);
                this.server.to(data.roomId).emit(clientMessage.actionRecord, {
                  actionRecord: rm.actionRecord,
                });
                this.server.to(data.roomId).emit(clientMessage.roomBase, {
                  roomBase: rm.roomBase,
                });
              }, 5000);
            }
          }
        }, 15000); //15s 的质疑时间
      } else {
        console.log('阻止的玩家被质疑,没有被质疑成功');
        //阻止玩家被质疑
        this.roomMessageService.directJudgeActConclusion(rm.id);
        rm.actionRecord.period = Period.ActConclusion;
        this.server.to(data.roomId).emit(clientMessage.actionRecord, {
          actionRecord: rm.actionRecord,
        });
        this.server
          .to(data.roomId)
          .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
        if (rm.actionRecord.actionName === Actions.Steal) {
          setTimeout(() => {
            this.roomMessageService.setNextPlayerAct(rm.id);
            this.server.to(data.roomId).emit(clientMessage.actionRecord, {
              actionRecord: rm.actionRecord,
            });
            this.server.to(data.roomId).emit(clientMessage.roomBase, {
              roomBase: rm.roomBase,
            });
          }, 5000);
        }
      }
    } else {
      console.log('开始行动 外援  独吞，收税，换牌，看牌');
      // 外援  独吞，收税，换牌，看牌
      this.roomMessageService.directJudgeActConclusion(rm.id);
      this.server.to(data.roomId).emit(clientMessage.actionRecord, {
        actionRecord: rm.actionRecord,
      });
      this.server.to(data.roomId).emit(clientMessage.roomBase, {
        roomBase: rm.roomBase,
      });
      if (
        rm.actionRecord.actionName === Actions.Embezzlement ||
        rm.actionRecord.actionName === Actions.Tax ||
        rm.actionRecord.actionName === Actions.ForeignAid
      ) {
        setTimeout(() => {
          this.roomMessageService.setNextPlayerAct(rm.id);
          this.server.to(data.roomId).emit(clientMessage.actionRecord, {
            actionRecord: rm.actionRecord,
          });
          this.server.to(data.roomId).emit(clientMessage.roomBase, {
            roomBase: rm.roomBase,
          });
        }, 5000);
      }
    }
  }

  @SubscribeMessage(serverMessage.coupOrAssassinateConclusion) //提交因为coup 或刺杀失去势力的信息
  handleCoupOrAssassinateConclusion(
    @MessageBody()
    data: {
      roomId: string;
      character: Character;
    },
  ) {
    console.log(data, 'coupOrAssassinateConclusion');
    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      return;
    }
    if (rm.actionRecord.period !== Period.ActConclusion) {
      return;
    }
    if (rm.actionRecord.actionName === Actions.Coup) {
      coup(rm, data.character);
    } else {
      assassinate(rm, data.character);
    }

    if (judgeGameOver(rm)) {
      this.server
        .to(data.roomId)
        .emit(clientMessage.actionRecord, { actionRecord: rm.actionRecord });
      this.server
        .to(data.roomId)
        .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
      return;
    }
    //结果已经完毕 让下一个玩家行动
    this.roomMessageService.setNextPlayerAct(rm.id);
    //发送新的对局消息
    this.server
      .to(data.roomId)
      .emit(clientMessage.actionRecord, { actionRecord: rm.actionRecord });
    this.server
      .to(data.roomId)
      .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
  }

  @SubscribeMessage(serverMessage.examineConclusion)
  handleExamineConclusion(
    @MessageBody()
    data: {
      roomId: string;
      isExamine: boolean;
    },
  ) {
    console.log(data, 'examineConclusion');
    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      return;
    }
    if (data.isExamine) {
      if (
        rm.actionRecord.actConclusion &&
        rm.actionRecord.actionName === Actions.Examine
      ) {
        examineTrue(rm);
      }
    }
    //结果已经完毕 让下一个玩家行动
    this.roomMessageService.setNextPlayerAct(rm.id);
    //发送新的对局消息
    this.server
      .to(data.roomId)
      .emit(clientMessage.actionRecord, { actionRecord: rm.actionRecord });
    this.server
      .to(data.roomId)
      .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
  }

  @SubscribeMessage(serverMessage.exchangeConclusion)
  handleExchangeConclusion(
    @MessageBody()
    data: {
      roomId: string;
      newCharacterArray: Array<Character>;
    },
  ) {
    console.log(data, 'exchangeConclusion');
    const rm = this.roomMessageService.getRoomMessageById(data.roomId);
    if (rm === undefined) {
      return;
    }
    exchange(rm, data.newCharacterArray);
    //TODO

    //结果已经完毕 让下一个玩家行动
    this.roomMessageService.setNextPlayerAct(rm.id);
    //发送新的对局消息
    this.server
      .to(data.roomId)
      .emit(clientMessage.actionRecord, { actionRecord: rm.actionRecord });
    this.server
      .to(data.roomId)
      .emit(clientMessage.roomBase, { roomBase: rm.roomBase });
  }

  @SubscribeMessage(serverMessage.deleteRoom)
  handleDeleteRoom(
    @MessageBody()
    data: {
      roomId: string;
    },
  ) {
    this.server
      .to(data.roomId)
      .emit(clientMessage.deleteRoomOk, { deleteRoomOk: 'ok' });
    console.log(data, 'deleteRoom');
    this.roomService.deleteRoom(data.roomId);
    this.roomMessageService.deleteRoomMessage(data.roomId);
  }
}
