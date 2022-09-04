import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { PrismaService } from '../prisma/prisma.service'
import { EditUserDto } from './dto'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async editUser(userId: number, dto: EditUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { ...dto },
      })

      delete user.hash
      return user
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email taken')
        }
      }
      throw error
    }
  }
}
