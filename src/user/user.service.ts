import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto, CreateUserDto } from './dto/user.dto';
import * as md5 from 'md5';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //登陆
  async login({ account, password }: CreateUserDto): Promise<User | null> {
    // 对密码进行 MD5 加密
    const encryptedPassword = md5(password);
    // 查询用户
    return await this.userRepository.findOne({
      where: {
        account, // 账户名
        password: encryptedPassword, // 加密后的密码
      },
    });
  }

  //注册
  async register({ account, password }: CreateUserDto): Promise<User | null> {
    // 检查账户是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { account },
    });

    if (existingUser) {
      throw new ConflictException('Account already exists'); // 抛出冲突异常
    }

    // 对密码进行 MD5 加密
    const encryptedPassword = md5(password);

    const user = this.userRepository.create({
      account,
      password: encryptedPassword,
      name: '小可爱_' + account,
      avatar:
        'https://coup-1328751369.cos.ap-guangzhou.myqcloud.com/players-avatar/coup1.jpeg',
      sex: 0,
      user_rank: 'copper',
      isBan: 0,
    });
    return await this.userRepository.save(user);
  }

  // 更新用户
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return await this.userRepository.findOne({ where: { id } });
  }

  // 删除用户
  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
