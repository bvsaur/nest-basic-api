import { Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { User } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guard'
import { GetUser } from './decorator'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  //? GET /users/me
  @Get('me')
  getMe(@GetUser() user: User) {
    return user
  }

  @Patch()
  editUser() {}
}
