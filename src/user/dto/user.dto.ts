export class CreateUserDto {
  account: string;
  password: string;
}

export class UpdateUserDto {
  account?: string;
  password?: string;
  name?: string;
  avatar?: string;
  sex?: number;
  user_rank?: string;
  isBan?: number;
}

// 任何用户可见的该玩家的信息
export class CommonUserDto {
  name: string;
  avatar: string;
  user_rank: string;
}

//准备房间里面的玩家信息
export class ReadyRoomUserDto {
  isReady: boolean;
  name: string;
  avatar: string;
  user_rank: string;
  constructor(c: CommonUserDto, isReady: boolean) {
    this.isReady = isReady;
    this.name = c.name;
    this.avatar = c.avatar;
    this.user_rank = c.user_rank;
  }
}
