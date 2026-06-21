import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { QuizzesService } from './quizzes.service'
import { Quiz } from './entities/quiz.entity'
import { Question } from '../questions/entities/question.entity'
import { UserRole } from '../../enums/user-role.enum'
import { CreateQuizDto } from './dto/create-quiz.dto'
import { UpdateQuizDto } from './dto/update-quiz.dto'

describe('QuizzesService', () => {
  let service: QuizzesService
  let quizRepository: jest.Mocked<Repository<Quiz>>
  let dataSource: { transaction: jest.Mock }
  let manager: {
    create: jest.Mock
    save: jest.Mock
    findOne: jest.Mock
    remove: jest.Mock
  }

  const baseQuiz: Quiz = {
    id: 1,
    title: 'General Knowledge',
    description: 'A quiz about general knowledge',
    timeLimit: 30 * 60 * 1000,
    questions: [
      {
        id: 10,
        text: 'What is 2 + 2?',
        options: ['3', '4', '5'],
        correctOptionIndex: 1,
        quizId: 1,
        createUserId: '6c6d794d-45bf-47fa-a35e-33d029990860',
        modifyUserId: null,
      } as Question,
    ],
    createUserId: '6c6d794d-45bf-47fa-a35e-33d029990860',
    modifyUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    manager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    }

    dataSource = {
      transaction: jest.fn(async (cb: (manager: unknown) => unknown) => cb(manager)),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        {
          provide: getRepositoryToken(Quiz),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile()

    service = module.get(QuizzesService)
    quizRepository = module.get(getRepositoryToken(Quiz))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    const dto: CreateQuizDto = {
      title: 'General Knowledge',
      description: 'A quiz about general knowledge',
      timeLimit: '30m',
      questions: [{ text: 'What is 2 + 2?', options: ['3', '4', '5'], correctOptionIndex: 1 }],
    }

    beforeEach(() => {
      manager.create.mockImplementation((entity: unknown, data: Record<string, unknown>) => ({ ...data }))
      manager.save.mockImplementation(async (entity: any) => {
        if (Array.isArray(entity)) {
          return entity.map((e, i) => ({ ...e, id: 100 + i }))
        }
        return { ...entity, id: 1 }
      })
      manager.findOne.mockResolvedValue(baseQuiz)
    })

    it('converts the timeLimit string and persists the quiz inside a transaction', async () => {
      const result = await service.create('6c6d794d-45bf-47fa-a35e-33d029990860', dto)

      expect(dataSource.transaction).toHaveBeenCalledTimes(1)
      expect(manager.create).toHaveBeenCalledWith(
        Quiz,
        expect.objectContaining({
          title: dto.title,
          description: dto.description,
          timeLimit: 30 * 60 * 1000,
          createUserId: '6c6d794d-45bf-47fa-a35e-33d029990860',
        }),
      )
      expect(result).toEqual(baseQuiz)
    })

    it('creates and saves each question tied to the newly created quiz', async () => {
      await service.create('6c6d794d-45bf-47fa-a35e-33d029990860', dto)

      expect(manager.create).toHaveBeenCalledWith(
        Question,
        expect.objectContaining({
          text: 'What is 2 + 2?',
          options: ['3', '4', '5'],
          correctOptionIndex: 1,
          createUserId: '6c6d794d-45bf-47fa-a35e-33d029990860',
          quizId: 1,
        }),
      )
      expect(manager.save).toHaveBeenCalledTimes(2)
    })

    it('does not attempt to save questions when none are provided', async () => {
      const { ...dtoWithoutQuestions } = dto
      await service.create('6c6d794d-45bf-47fa-a35e-33d029990860', dtoWithoutQuestions)

      expect(manager.save).toHaveBeenCalledTimes(1)
    })

    it('throws NotFoundException if the quiz cannot be reloaded after creation', async () => {
      manager.findOne.mockResolvedValue(null)
      await expect(service.create('6c6d794d-45bf-47fa-a35e-33d029990860', dto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    const buildQueryBuilder = (items: Quiz[], total: number) => {
      const qb: Record<string, jest.Mock> = {
        orderBy: jest.fn(),
        skip: jest.fn(),
        take: jest.fn(),
        andWhere: jest.fn(),
        getManyAndCount: jest.fn().mockResolvedValue([items, total]),
      }
      qb.orderBy.mockReturnValue(qb)
      qb.skip.mockReturnValue(qb)
      qb.take.mockReturnValue(qb)
      qb.andWhere.mockReturnValue(qb)
      return qb
    }

    it('paginates results and computes meta information', async () => {
      const qb = buildQueryBuilder([baseQuiz], 25)
      ;(quizRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb)

      const result = await service.findAll({ page: 2, limit: 10, search: undefined })

      expect(qb.skip).toHaveBeenCalledWith(10)
      expect(qb.take).toHaveBeenCalledWith(10)
      expect(qb.andWhere).not.toHaveBeenCalled()
      expect(result).toEqual({
        items: [baseQuiz],
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      })
    })

    it('applies a title search filter when provided', async () => {
      const qb = buildQueryBuilder([], 0)
      ;(quizRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb)

      const result = await service.findAll({ page: 1, limit: 10, search: 'history' })

      expect(qb.andWhere).toHaveBeenCalledWith('quiz.title ILIKE :search', { search: '%history%' })
      expect(result.meta.totalPages).toBe(1)
    })
  })

  describe('findOne', () => {
    it('includes question detail for admins', async () => {
      ;(quizRepository.findOne as jest.Mock).mockResolvedValue(baseQuiz)

      const result = await service.findOne(1, UserRole.ADMIN)

      expect(result.questions).toEqual([
        {
          id: 10,
          text: 'What is 2 + 2?',
          options: ['3', '4', '5'],
          correctOptionIndex: 1,
        },
      ])
    })

    it('hides question detail for non-admin users', async () => {
      ;(quizRepository.findOne as jest.Mock).mockResolvedValue(baseQuiz)

      const result = await service.findOne(1, UserRole.USER)

      expect(result.questions).toEqual([])
      expect(result.title).toBe(baseQuiz.title)
    })

    it('throws NotFoundException when the quiz does not exist', async () => {
      ;(quizRepository.findOne as jest.Mock).mockResolvedValue(null)

      await expect(service.findOne(999, UserRole.ADMIN)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findOneInternal', () => {
    it('always returns full question detail regardless of role', async () => {
      ;(quizRepository.findOne as jest.Mock).mockResolvedValue(baseQuiz)

      const result = await service.findOneInternal(1)

      expect(result.questions).toHaveLength(1)
      expect(result.questions[0].correctOptionIndex).toBe(1)
    })

    it('throws NotFoundException when the quiz does not exist', async () => {
      ;(quizRepository.findOne as jest.Mock).mockResolvedValue(null)

      await expect(service.findOneInternal(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    const cloneBaseQuiz = (): Quiz => JSON.parse(JSON.stringify(baseQuiz))

    beforeEach(() => {
      manager.save.mockImplementation(async (entity: unknown) => entity)
      manager.create.mockImplementation((entity: unknown, data: Record<string, unknown>) => ({ ...data }))
    })

    it('throws NotFoundException when the quiz does not exist', async () => {
      manager.findOne.mockResolvedValue(null)

      await expect(service.update('6c6d794d-45bf-47fa-a35e-33d029990860', 999, { title: 'New title' })).rejects.toThrow(
        NotFoundException,
      )
    })

    it('updates basic fields and stamps modifyUserId', async () => {
      const quiz = cloneBaseQuiz()
      manager.findOne.mockResolvedValueOnce(quiz).mockResolvedValueOnce(quiz)

      const dto: UpdateQuizDto = { title: 'Updated title', timeLimit: '1h' }
      const result = await service.update('f86b763d-426b-4c9c-a8d3-5815b8af561b', 1, dto)

      expect(quiz.title).toBe('Updated title')
      expect(quiz.timeLimit).toBe(60 * 60 * 1000)
      expect(quiz.modifyUserId).toBe('f86b763d-426b-4c9c-a8d3-5815b8af561b')
      expect(result).toBe(quiz)
    })

    it('rejects when a question id appears in both removeQuestionIds and updateQuestions', async () => {
      const quiz = cloneBaseQuiz()
      manager.findOne.mockResolvedValueOnce(quiz)

      const dto: UpdateQuizDto = {
        removeQuestionIds: [10],
        updateQuestions: { 10: { id: 10, text: 'Conflicting update' } },
      }

      await expect(service.update('6c6d794d-45bf-47fa-a35e-33d029990860', 1, dto)).rejects.toThrow(BadRequestException)
    })

    it('rejects removal of a question id that does not belong to the quiz', async () => {
      const quiz = cloneBaseQuiz()
      manager.findOne.mockResolvedValueOnce(quiz)

      const dto: UpdateQuizDto = { removeQuestionIds: [999] }

      await expect(service.update('6c6d794d-45bf-47fa-a35e-33d029990860', 1, dto)).rejects.toThrow(BadRequestException)
    })

    it('removes questions that belong to the quiz', async () => {
      const quiz = cloneBaseQuiz()
      manager.findOne.mockResolvedValueOnce(quiz).mockResolvedValueOnce(quiz)

      const dto: UpdateQuizDto = { removeQuestionIds: [10] }
      await service.update('6c6d794d-45bf-47fa-a35e-33d029990860', 1, dto)

      expect(manager.remove).toHaveBeenCalledWith(Question, [expect.objectContaining({ id: 10 })])
      expect(quiz.questions.find((q) => q.id === 10)).toBeUndefined()
    })

    it('rejects updates that reference a question id not on the quiz', async () => {
      const quiz = cloneBaseQuiz()
      manager.findOne.mockResolvedValueOnce(quiz)

      const dto: UpdateQuizDto = { updateQuestions: { 555: { id: 555, text: 'Nope' } } }

      await expect(service.update('6c6d794d-45bf-47fa-a35e-33d029990860', 1, dto)).rejects.toThrow(BadRequestException)
    })

    it('merges partial question updates against the existing values', async () => {
      const quiz = cloneBaseQuiz()
      manager.findOne.mockResolvedValueOnce(quiz).mockResolvedValueOnce(quiz)

      const dto: UpdateQuizDto = {
        updateQuestions: { 10: { id: 10, text: 'What is 3 + 3?' } },
      }
      await service.update('ee019d51-b546-4000-b49d-f645509955bd', 1, dto)

      const updated = quiz.questions.find((q) => q.id === 10)!
      expect(updated.text).toBe('What is 3 + 3?')
      expect(updated.options).toEqual(['3', '4', '5'])
      expect(updated.correctOptionIndex).toBe(1)
      expect(updated.modifyUserId).toBe('ee019d51-b546-4000-b49d-f645509955bd')
    })

    it('rejects a merged correctOptionIndex that is out of bounds for the merged options', async () => {
      const quiz = cloneBaseQuiz()
      manager.findOne.mockResolvedValueOnce(quiz)

      const dto: UpdateQuizDto = {
        updateQuestions: { 10: { id: 10, options: ['only one option is provided here, two'], correctOptionIndex: 5 } },
      }

      await expect(service.update('6c6d794d-45bf-47fa-a35e-33d029990860', 1, dto)).rejects.toThrow(BadRequestException)
    })

    it('adds new questions tied to the quiz id', async () => {
      const quiz = cloneBaseQuiz()
      manager.findOne.mockResolvedValueOnce(quiz).mockResolvedValueOnce(quiz)

      const dto: UpdateQuizDto = {
        addQuestions: [{ text: 'New question', options: ['A', 'B'], correctOptionIndex: 0 }],
      }
      await service.update('6c6d794d-45bf-47fa-a35e-33d029990860', 1, dto)

      expect(manager.create).toHaveBeenCalledWith(
        Question,
        expect.objectContaining({
          text: 'New question',
          quizId: 1,
          createUserId: '6c6d794d-45bf-47fa-a35e-33d029990860',
        }),
      )
    })

    it('throws NotFoundException if the quiz cannot be reloaded after the update', async () => {
      const quiz = cloneBaseQuiz()
      manager.findOne.mockResolvedValueOnce(quiz).mockResolvedValueOnce(null)

      await expect(service.update('6c6d794d-45bf-47fa-a35e-33d029990860', 1, { title: 'New title' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    it('removes the quiz when it exists', async () => {
      ;(quizRepository.findOne as jest.Mock).mockResolvedValue(baseQuiz)
      ;(quizRepository.remove as jest.Mock).mockResolvedValue(baseQuiz)

      await service.remove(1)

      expect(quizRepository.remove).toHaveBeenCalledWith(baseQuiz)
    })

    it('throws NotFoundException when the quiz does not exist', async () => {
      ;(quizRepository.findOne as jest.Mock).mockResolvedValue(null)

      await expect(service.remove(999)).rejects.toThrow(NotFoundException)
      expect(quizRepository.remove).not.toHaveBeenCalled()
    })
  })
})
