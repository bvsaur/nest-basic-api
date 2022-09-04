import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { User } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guard'
import { GetUser } from './decorator'
import { EditUserDto } from './dto'
import { UserService } from './user.service'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  //? GET /users/me
  @Get('me')
  getMe(@GetUser() user: User) {
    return user
  }

  @Patch()
  editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
    return this.userService.editUser(userId, dto)
  }
}
