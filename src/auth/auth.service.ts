import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { AuthDto } from './dto'
import * as argon from 'argon2'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(dto: AuthDto) {
    //? Find user by email
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    })
    //? If user does not exists throw error
    if (!user) {
      throw new ForbiddenException('Incorrect credentials.')
    }

    //? Compare password
    const pwMatches = await argon.verify(user.hash, dto.password)
    //? If password incorrect throw error
    if (!pwMatches) {
      throw new ForbiddenException('Incorrect credentials.')
    }

    //? Send back the user
    delete user.hash
    return user
  }

  async signup(dto: AuthDto) {
    try {
      //? Generate password hash
      const hash = await argon.hash(dto.password)

      //? Save user in db
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      })

      delete user.hash

      //? Return saved user
      return user
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if ((error.code = 'P2002')) {
          throw new ForbiddenException('Taken credentials.')
        }
      }
      throw error
    }
  }
}
