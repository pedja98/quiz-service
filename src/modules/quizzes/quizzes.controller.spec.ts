import { Test, TestingModule } from '@nestjs/testing'
import { QuizzesController } from './quizzes.controller'
import { QuizzesService } from './quizzes.service'
import { UserRole } from '../../enums/user-role.enum'
import { AuthUser } from '../../types/auth-user.types'
import { CreateQuizDto } from './dto/create-quiz.dto'
import { UpdateQuizDto } from './dto/update-quiz.dto'
import { ListQuizzesQueryDto } from './dto/list-quizzes-query.dto'
import { Quiz } from './entities/quiz.entity'
import { QuizResponseDto } from './dto/quiz-response.dto'

describe('QuizzesController', () => {
  let controller: QuizzesController
  let service: jest.Mocked<QuizzesService>

  const adminUser: AuthUser = { id: 'ef7260ca-3843-4311-b9f3-21b23169b640', role: UserRole.ADMIN }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [
        {
          provide: QuizzesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findOneInternal: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get(QuizzesController)
    service = module.get(QuizzesService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('delegates to QuizzesService.create with the caller id and the dto', async () => {
      const dto: CreateQuizDto = { title: 'General Knowledge', timeLimit: '30m' }
      const expected = { id: 1, ...dto }
      service.create.mockResolvedValue(expected as unknown as Quiz | Promise<Quiz>)

      const result = await controller.create(adminUser, dto)

      expect(service.create).toHaveBeenCalledWith('ef7260ca-3843-4311-b9f3-21b23169b640', dto)
      expect(result).toBe(expected)
    })
  })

  describe('findAll', () => {
    it('delegates to QuizzesService.findAll with the query params', async () => {
      const query: ListQuizzesQueryDto = { page: 1, limit: 10 }
      const expected = { items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }
      service.findAll.mockResolvedValue(expected)

      const result = await controller.findAll(query)

      expect(service.findAll).toHaveBeenCalledWith(query)
      expect(result).toBe(expected)
    })
  })

  describe('findOne', () => {
    it('delegates to QuizzesService.findOne with the id and the caller role', async () => {
      const expected = { id: 5, title: 'Quiz', description: '', timeLimit: 1000, questions: [] }
      service.findOne.mockResolvedValue(expected)

      const result = await controller.findOne(adminUser, 5)

      expect(service.findOne).toHaveBeenCalledWith(5, UserRole.ADMIN)
      expect(result).toBe(expected)
    })

    it('passes through a non-admin caller role unchanged', async () => {
      const userCaller: AuthUser = { id: '6c6d794d-45bf-47fa-a35e-33d029990860', role: UserRole.USER }
      service.findOne.mockResolvedValue({} as QuizResponseDto)

      await controller.findOne(userCaller, 5)

      expect(service.findOne).toHaveBeenCalledWith(5, UserRole.USER)
    })
  })

  describe('update', () => {
    it('delegates to QuizzesService.update with the caller id, id, and dto', async () => {
      const dto: UpdateQuizDto = { title: 'Updated title' }
      const expected = { id: 5, title: 'Updated title' }
      service.update.mockResolvedValue(expected as unknown as Quiz | Promise<Quiz>)

      const result = await controller.update(adminUser, 5, dto)

      expect(service.update).toHaveBeenCalledWith('ef7260ca-3843-4311-b9f3-21b23169b640', 5, dto)
      expect(result).toBe(expected)
    })
  })

  describe('remove', () => {
    it('delegates to QuizzesService.remove with the id', async () => {
      service.remove.mockResolvedValue(undefined)

      const result = await controller.remove(5)

      expect(service.remove).toHaveBeenCalledWith(5)
      expect(result).toBeUndefined()
    })
  })

  describe('findOneInternal', () => {
    it('delegates to QuizzesService.findOneInternal with the id', async () => {
      const expected = { id: 5, title: 'Quiz', description: '', timeLimit: 1000, questions: [] }
      service.findOneInternal.mockResolvedValue(expected)

      const result = await controller.findOneInternal(5)

      expect(service.findOneInternal).toHaveBeenCalledWith(5)
      expect(result).toBe(expected)
    })
  })
})
