import { Controller, Get, Req, UseGuards } from '@nestjs/common'

import { Request } from 'express'
import { JwtAuthGuard } from 'src/auth/guard'

@Controller('users')
export class UserController {
  //? GET /users/me
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request) {
    return 'user info'
  }
}
