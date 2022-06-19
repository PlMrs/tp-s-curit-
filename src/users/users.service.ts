import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlinkSync } from 'fs';
import { Swipe } from 'src/swipe/entities/swipe.entity';
import { In, IsNull, Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {

  constructor(@InjectRepository(User) private data: Repository<User>,
    @InjectRepository(Swipe) private swipe: Repository<Swipe>
  ) {}

  create(createUserDto: CreateUserDto): Promise<User> {
    return this.data.save(createUserDto);
  }

  findAll(): Promise<User[]> {
    return this.data.find();
  }

  async findNotSwiped(id_user: number, needs_user: string): Promise<User[]> {

    let array = [];
    let needs: string;

    array.push(id_user)

    const ids = await this.swipe.find({
      select: ["user_1", "user_2"], where: [
        { user_1: id_user, isMatched: true },
        { user_2: id_user, isMatched: true }
      ]
    })

    ids.map(id => {
      if (Number(id.user_1) != id_user) {
        array.push(id.user_1)
      }
      if (Number(id.user_2) != id_user) {
        array.push(id.user_2)
      }
    })

    if (needs_user === 'H') {
      needs = "T"
    }
    else if (needs_user === 'T') {
      needs = "H"
    }
    else {
      needs = "D"
    }

    return this.data.find({
      select: ["id", "name", "surname", "needs", "picture", "description"],
      where: {
        role: Not(UserRole.ADMIN),
        id: Not(In(array)),
        needs: needs
      }
    })
  }

  findAllWithIds(ids: Array<number>): Promise<User[]> {
    return this.data.find({ where: { id: In(ids) } })
  }

  findOne(id: any): Promise<User> {
    return this.data.query(`SELECT * FROM user WHERE id=${id}`)
  }

  findByEmail(email: string): Promise<User> {
    return this.data.findOne({ email });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.data.update(id, updateUserDto);
  }

  remove(id: User): Promise<User> {
    return this.data.remove(id)
  }

  deletePicture(picture: string) {
    if (picture === "default.jpg") {
      return;
    }

    const path = `../front/assets/images/users/picture/${picture}`

    try {
      unlinkSync(path)
      return 200
    } catch (e) {
      console.log(e)
    }
  }

  findNotVerified() {
    return this.data.find({
      where: { carte_id: Not(IsNull()), certificatScolaire: Not(IsNull()), verified: false }
    })
  }
}
