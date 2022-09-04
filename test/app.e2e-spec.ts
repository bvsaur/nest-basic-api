import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as pactum from 'pactum'
import { AuthDto } from '../src/auth/dto'
import { PrismaService } from '../src/prisma/prisma.service'
import { AppModule } from '../src/app.module'

describe('App e2e', () => {
  let app: INestApplication
  let prisma: PrismaService
  const port = 8000
  const apiUrl = `http://localhost:${port}`

  //? Before running the testing compile the Main Module
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    //? Instance Nest app
    app = moduleRef.createNestApplication()

    //? Set up global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    )

    app.init()
    await app.listen(8000)
    prisma = app.get(PrismaService)
    await prisma.cleanDb()
    pactum.request.setBaseUrl(apiUrl)
  })

  afterAll(() => {
    app.close()
  })

  describe('Auth', () => {
    describe('Signup', () => {
      const dto: AuthDto = {
        email: 'bruno@bruno.com',
        password: '1234',
      }

      const dto2: AuthDto = {
        email: 'ali@ali.com',
        password: '1234',
      }
      it('should throw exception if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(400)
      })

      it('should throw exception if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email })
          .expectStatus(400)
      })

      it('should throw exception if body empty', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400)
      })

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
      })

      it('should throw exception if email is taken', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(403)
      })

      it('should signup another user', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto2)
          .expectStatus(201)
      })
    })

    describe('Login', () => {
      const dto: AuthDto = {
        email: 'bruno@bruno.com',
        password: '1234',
      }
      it('should throw exception if email empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ password: dto.password })
          .expectStatus(400)
      })

      it('should throw exception if password empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: dto.email })
          .expectStatus(400)
      })

      it('should throw exception if body empty', () => {
        return pactum.spec().post('/auth/login').expectStatus(400)
      })

      it('should login', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
      })
    })
  })

  describe('Users', () => {
    describe('Get Me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(200)
      })
    })
    describe('Edit User', () => {
      it('should throw exception if updated email is taken', () => {
        const dto = { email: 'ali@ali.com' }
        return pactum
          .spec()
          .patch('/users')
          .withBody(dto)
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(403)
      })

      it('should edit user', () => {
        const dto = { email: 'bruno@theablab.com', firstName: 'Bruno' }
        return pactum
          .spec()
          .patch('/users')
          .withBody(dto)
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(200)
      })
    })
  })

  describe('Bookmarks', () => {
    describe('Create Bookmar', () => {})
    describe('Get Bookmarks', () => {})
    describe('Get Bookmark by ID', () => {})
    describe('Edit bookmark', () => {})
    describe('Delete bookmark', () => {})
  })
})
