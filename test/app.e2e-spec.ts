import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as pactum from 'pactum'
import { AuthDto } from '../src/auth/dto'
import { PrismaService } from '../src/prisma/prisma.service'
import { AppModule } from '../src/app.module'
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto'

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
    const createDto: CreateBookmarkDto = {
      title: 'First bookmark',
      link: 'https://www.youtube.com/watch?v=GHTA143_b-s&t=7924s',
    }
    const editDto: EditBookmarkDto = {
      title: 'First Great bookmark',
      description: 'Some great description',
    }

    describe('Get Empty Bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(200)
          .expectJsonLength(0)
      })
    })

    describe('Create Bookmark', () => {
      it('should create a bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .withBody(createDto)
          .expectStatus(201)
      })
    })

    describe('Get Bookmarks', () => {
      it('shoulg get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(200)
          .stores('bookmarkId', 'id')
      })
    })

    describe('Get Bookmark by ID', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(200)
      })
    })
    describe('Edit bookmark', () => {
      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .withBody(editDto)
          .expectStatus(200)
          .expectBodyContains(editDto.title)
          .expectBodyContains(editDto.description)
      })
    })
    describe('Delete bookmark', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(204)
      })

      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(200)
          .expectJsonLength(0)
      })
    })
  })
})
