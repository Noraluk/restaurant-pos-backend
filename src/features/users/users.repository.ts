import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  create(data: Pick<User, 'email'>) {
    return this.usersRepo.save(this.usersRepo.create(data));
  }
}
