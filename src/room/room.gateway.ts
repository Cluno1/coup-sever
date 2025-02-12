import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AddInRoomDto } from './dto/room.dto';
import { RoomService } from './room.service';
import { clientMessage, serverMessage } from './room.message';

@WebSocketGateway({
  namespace: 'room',
  cors: {
    origin: 'http://localhost:3001', // 允许的前端地址
    methods: ['GET', 'POST'],
    credentials: false,
  },
})
export class RoomGateway {
  @WebSocketServer()
  server: Server;
  constructor(private readonly roomService: RoomService) {}

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
    const { room } = data;
    const result = this.roomService.addInRoom(data);
    if (typeof result !== 'object' || !('error' in result)) {
      client.join(room.id); // 加入房间
      console.log('come to server广播消息');
      this.server
        .to(room.id)
        .emit(clientMessage.playerJoined, { players: result });
    } else {
      client.emit(clientMessage.failAddInRoom, result.error); // 发送失败消息
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
    const a = this.roomService.leaveRoom(data);
    if (a !== false) {
      client.leave(room.id);
      this.server.to(room.id).emit(clientMessage.playerLeft, { players: a });
    }
  }

  @SubscribeMessage(serverMessage.setReady)
  handleReady(@MessageBody() data: AddInRoomDto) {
    if (this.roomService.setIsReady(data, true)) {
      this.server.to(data.room.id).emit(clientMessage.playersAllReady);
    }
  }

  @SubscribeMessage(serverMessage.setUnready)
  handleUnready(@MessageBody() data: AddInRoomDto) {
    this.roomService.setIsReady(data, false);
  }
}
