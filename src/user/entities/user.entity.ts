import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user') // 表名
export class User {
  @PrimaryGeneratedColumn() // 自增主键
  id: number;

  @Column({ length: 50, unique: true }) // 账号，唯一
  account: string;

  @Column({ length: 255 }) // 密码
  password: string;

  @Column({ length: 100 }) // 用户名
  name: string;

  @Column({ length: 255, nullable: true }) // 头像URL，可为空
  avatar: string;

  @Column({ default: 0 }) // 性别，默认为0
  sex: number;

  @Column({ length: 25, nullable: true }) // 等级，可为空
  user_rank: string;

  @Column({ default: 0 }) // 是否被封禁，默认为0
  isBan: number;
}
