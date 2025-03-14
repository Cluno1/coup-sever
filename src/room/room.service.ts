import { clientMessage } from './room.message';
import { Injectable } from '@nestjs/common';
import { Room } from './entities/room.entity';
import { CreateRoomDto, RoomReturnDto, AddInRoomDto } from './dto/room.dto';
import { ReadyRoomUserDto } from 'src/user/dto/user.dto';
import { Socket } from 'socket.io';

@Injectable()
export class RoomService {
  private roomList: Array<Room> = []; //准备房间
  private clientMap = new Map<string, Socket>(); // 用于存储客户端信息

  setClientByUserName(userName: string, client: Socket) {
    this.deleteClientByUserName(userName);
    this.clientMap.set(userName, client);
  }
  getClientByUserName(userName: string): Socket {
    return this.clientMap.get(userName);
  }
  deleteClientByUserName(userName: string) {
    this.clientMap.delete(userName);
  }
  // 遍历 Map，删除指定 Socket 对应的条目
  deleteClientBySocket(targetSocket: Socket): boolean {
    for (const [userName, socket] of this.clientMap.entries()) {
      if (socket === targetSocket) {
        this.clientMap.delete(userName); // 删除对应的条目
        return true; // 返回 true 表示找到并删除了
      }
    }
    return false; // 返回 false 表示未找到
  }

  // 生成随机的九位数 roomId，包含字母和数字
  private generateRandomId(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 9; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  // 检查 roomId 是否已经存在
  private isIdUnique(id: string): boolean {
    return !this.roomList.some((room) => room.id === id);
  }

  // 获取唯一的 roomId
  private getId(): string {
    let newId: string;
    do {
      newId = this.generateRandomId();
    } while (!this.isIdUnique(newId));
    return newId;
  }

  /**
   * 返回房间id数组
   * @param ownerName 房主名字
   * @returns 房间id数组
   */
  findRoomByOwnerName(ownerName: string): Array<string> {
    return this.roomList
      .filter((room) => {
        if (room.owner.name === ownerName) {
          console.log('寻找到有相同的用户要创建房间');
          return true;
        }
        return false;
      })
      .map((room) => {
        return room.id;
      });
  }
  createRoom(roomDto: CreateRoomDto): RoomReturnDto {
    const room = new Room(roomDto);
    room.id = this.getId(); //加入room id
    this.roomList.push(room);
    return new RoomReturnDto(room);
  }

  addInRoom(
    addDto: AddInRoomDto,
  ): ReadyRoomUserDto[] | { error: string; type: string } {
    const room = this.roomList.find(
      (r) =>
        r.id === addDto.room.id &&
        (r.password == addDto.room.password || r.isPublic),
    );
    if (!room) {
      return {
        error: 'Room not found or password incorrect',
        type: clientMessage.joinRoomFail,
      };
    }

    if (room.players.length === room.playerCount) {
      return {
        error: 'Room is full',
        type: clientMessage.roomIsFull,
      };
    }
    const isHave = room.players.some((p) => p.name === addDto.player.name);
    if (!isHave) {
      room.players.push(new ReadyRoomUserDto(addDto.player, false));
    }
    return room.players;
  }

  leaveRoom(
    addDto: AddInRoomDto,
  ): ReadyRoomUserDto[] | { error: string; type: string } {
    const room = this.roomList.find((r) => r.id === addDto.room.id);
    if (room) {
      room.players = room.players.filter((p) => p.name !== addDto.player.name);
      return room.players;
    } else {
      return { error: 'fail to leave room', type: clientMessage.leaveRoomFail };
    }
  }

  deleteRoom(roomId: string) {
    this.roomList = this.roomList.filter((r) => {
      if (r.id === roomId) {
        return false;
      }
      return true;
    });
  }

  getPlayersByRoomId(id: string) {
    debugger;
    const room = this.roomList.filter((room) => room.id === id)[0];
    return room.players;
  }

  /**
   *
   * @param addDto
   * @param isReady
   * @returns 当所有人都准备好了，返回true，否则返回false
   */
  setIsReady(addDto: AddInRoomDto, isReady: boolean) {
    const room = this.roomList.find((r) => r.id === addDto.room.id);
    let isAllReady = false;
    if (room) {
      if (isReady) {
        isAllReady = true;
      }
      room.players.forEach((p) => {
        if (p.name === addDto.player.name) {
          p.isReady = isReady;
        }
        if (!p.isReady) {
          isAllReady = false;
        }
      });
    }
    if (room.players.length < room.playerCount) {
      isAllReady = false;
    }
    return isAllReady;
  }

  getRoomList(): Array<RoomReturnDto> {
    return this.roomList.map((room) => {
      return new RoomReturnDto(room);
    });
  }

  getRoomById(id: string): Room | undefined {
    return this.roomList.find((room) => room.id === id);
  }
}
