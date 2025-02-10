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
