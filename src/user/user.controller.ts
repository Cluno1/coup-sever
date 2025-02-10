import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Body() createUserDto: CreateUserDto) {
    // 查找用户
    const user = await this.userService.login(createUserDto);

    if (user) {
      return { message: 'Login successful', user };
    } else {
      throw new UnauthorizedException('Invalid account or password');
    }
  }

  @Post('register')
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    try {
      return await this.userService.register(createUserDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message); // 返回冲突异常
      }
      throw error; // 其他异常
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return await this.userService.remove(id);
  }
}
