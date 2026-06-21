import { Reflector } from '@nestjs/core'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { QuizzesController } from '../src/modules/quizzes/quizzes.controller'
import { QuizzesService } from '../src/modules/quizzes/quizzes.service'
import { AuthGuard } from '../src/guards/auth.guard'
import { RolesGuard } from '../src/guards/roles.guard'

describe('Quizzes (e2e)', () => {
  let app: INestApplication
  let quizzesService: {
    create: jest.Mock
    findAll: jest.Mock
    findOne: jest.Mock
    findOneInternal: jest.Mock
    update: jest.Mock
    remove: jest.Mock
  }

  const adminHeaders = { 'x-user-id': 'ef7260ca-3843-4311-b9f3-21b23169b640', 'x-user-role': 'admin' }
  const userHeaders = { 'x-user-id': '6c6d794d-45bf-47fa-a35e-33d029990860', 'x-user-role': 'user' }

  beforeAll(async () => {
    quizzesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneInternal: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [{ provide: QuizzesService, useValue: quizzesService }, Reflector, RolesGuard],
    }).compile()

    app = moduleFixture.createNestApplication()
    const reflector = app.get(Reflector)
    app.useGlobalGuards(new AuthGuard(), new RolesGuard(reflector))
    await app.init()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /quizzes', () => {
    it('does not require an admin role and returns the service result', async () => {
      const page = { items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }
      quizzesService.findAll.mockResolvedValue(page)

      const response = await request(app.getHttpServer())
        .get('/quizzes')
        .set(userHeaders)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(response.body).toEqual(page)
    })

    it('rejects requests without authentication headers', async () => {
      await request(app.getHttpServer()).get('/quizzes').expect(401)
    })
  })

  describe('GET /quizzes/:id', () => {
    it('returns the quiz for an authenticated, non-admin user', async () => {
      const quiz = { id: 1, title: 'Quiz', description: '', timeLimit: 1000, questions: [] }
      quizzesService.findOne.mockResolvedValue(quiz)

      const response = await request(app.getHttpServer()).get('/quizzes/1').set(userHeaders).expect(200)

      expect(quizzesService.findOne).toHaveBeenCalledWith(1, 'user')
      expect(response.body).toEqual(quiz)
    })

    it('returns 400 when the id is not numeric', async () => {
      await request(app.getHttpServer()).get('/quizzes/not-a-number').set(userHeaders).expect(400)
    })
  })

  describe('POST /quizzes', () => {
    const payload = { title: 'General Knowledge', timeLimit: '30m' }

    it('allows an admin to create a quiz', async () => {
      const created = { id: 1, ...payload }
      quizzesService.create.mockResolvedValue(created)

      const response = await request(app.getHttpServer()).post('/quizzes').set(adminHeaders).send(payload).expect(201)

      expect(quizzesService.create).toHaveBeenCalledWith(
        'ef7260ca-3843-4311-b9f3-21b23169b640',
        expect.objectContaining(payload),
      )
      expect(response.body).toEqual(created)
    })

    it('forbids a non-admin user from creating a quiz', async () => {
      await request(app.getHttpServer()).post('/quizzes').set(userHeaders).send(payload).expect(403)

      expect(quizzesService.create).not.toHaveBeenCalled()
    })

    it('rejects unauthenticated requests before the role check runs', async () => {
      await request(app.getHttpServer()).post('/quizzes').send(payload).expect(401)

      expect(quizzesService.create).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /quizzes/:id', () => {
    it('allows an admin to update a quiz', async () => {
      const updated = { id: 1, title: 'Updated title' }
      quizzesService.update.mockResolvedValue(updated)

      const response = await request(app.getHttpServer())
        .patch('/quizzes/1')
        .set(adminHeaders)
        .send({ title: 'Updated title' })
        .expect(200)

      expect(quizzesService.update).toHaveBeenCalledWith('ef7260ca-3843-4311-b9f3-21b23169b640', 1, {
        title: 'Updated title',
      })
      expect(response.body).toEqual(updated)
    })

    it('forbids a non-admin user from updating a quiz', async () => {
      await request(app.getHttpServer())
        .patch('/quizzes/1')
        .set(userHeaders)
        .send({ title: 'Updated title' })
        .expect(403)
    })
  })

  describe('DELETE /quizzes/:id', () => {
    it('allows an admin to delete a quiz', async () => {
      quizzesService.remove.mockResolvedValue(undefined)

      await request(app.getHttpServer()).delete('/quizzes/1').set(adminHeaders).expect(200)

      expect(quizzesService.remove).toHaveBeenCalledWith(1)
    })

    it('forbids a non-admin user from deleting a quiz', async () => {
      await request(app.getHttpServer()).delete('/quizzes/1').set(userHeaders).expect(403)

      expect(quizzesService.remove).not.toHaveBeenCalled()
    })
  })

  describe('GET /quizzes/internal/:id', () => {
    it('has no role restriction but still requires authentication', async () => {
      const quiz = { id: 1, title: 'Quiz', description: '', timeLimit: 1000, questions: [] }
      quizzesService.findOneInternal.mockResolvedValue(quiz)

      const response = await request(app.getHttpServer()).get('/quizzes/internal/1').set(userHeaders).expect(200)

      expect(quizzesService.findOneInternal).toHaveBeenCalledWith(1)
      expect(response.body).toEqual(quiz)
    })
  })
})
