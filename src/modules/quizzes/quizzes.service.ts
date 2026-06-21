import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Quiz } from './entities/quiz.entity'
import { CreateQuizDto } from './dto/create-quiz.dto'
import { UpdateQuizDto } from './dto/update-quiz.dto'
import { ListQuizzesQueryDto } from './dto/list-quizzes-query.dto'
import { durationToMs } from './utils/duration.util'
import { UserRole } from '../../enums/user-role.enum'
import { QuizResponseDto } from './dto/quiz-response.dto'
import { Question } from '../questions/entities/question.entity'

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateQuizDto): Promise<Quiz> {
    const timeLimit = durationToMs(dto.timeLimit)

    return this.dataSource.transaction(async (manager) => {
      const quiz = manager.create(Quiz, {
        title: dto.title,
        description: dto.description,
        timeLimit,
        createUserId: userId,
      })
      const savedQuiz = await manager.save(quiz)

      if (dto.questions?.length) {
        const questions = dto.questions.map((q) =>
          manager.create(Question, {
            text: q.text,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            createUserId: userId,
            quizId: savedQuiz.id,
          }),
        )
        await manager.save(questions)
      }

      const result = await manager.findOne(Quiz, {
        where: { id: savedQuiz.id },
        relations: { questions: true },
      })
      if (!result) {
        throw new NotFoundException('Quiz not found right after creation')
      }
      return result
    })
  }

  async findAll(query: ListQuizzesQueryDto) {
    const { page, limit, search } = query

    const qb = this.quizRepository
      .createQueryBuilder('quiz')
      .orderBy('quiz.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    if (search) {
      qb.andWhere('quiz.title ILIKE :search', { search: `%${search}%` })
    }

    const [items, total] = await qb.getManyAndCount()

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  }

  async findOne(id: number, userRole: UserRole): Promise<QuizResponseDto> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: { questions: true },
    })

    if (!quiz) {
      throw new NotFoundException(`Quiz #${id} not found`)
    }

    const isAdmin = userRole === UserRole.ADMIN

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      questions: isAdmin
        ? quiz.questions.map((q) => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
          }))
        : [],
    }
  }

  async findOneInternal(id: number): Promise<QuizResponseDto> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: { questions: true },
    })

    if (!quiz) {
      throw new NotFoundException(`Quiz #${id} not found`)
    }

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
      })),
    }
  }

  async update(userId: string, id: number, dto: UpdateQuizDto): Promise<Quiz> {
    return this.dataSource.transaction(async (manager) => {
      const quiz = await manager.findOne(Quiz, {
        where: { id },
        relations: { questions: true },
      })
      if (!quiz) throw new NotFoundException(`Quiz #${id} not found`)

      if (dto.title !== undefined) quiz.title = dto.title
      if (dto.description !== undefined) quiz.description = dto.description
      if (dto.timeLimit !== undefined) {
        quiz.timeLimit = durationToMs(dto.timeLimit)
      }
      quiz.modifyUserId = userId
      await manager.save(quiz)

      const updateQuestionIds = dto.updateQuestions ? Object.keys(dto.updateQuestions).map(Number) : []

      if (dto.removeQuestionIds?.length) {
        const conflicting = dto.removeQuestionIds.filter((rid) => updateQuestionIds.includes(rid))
        if (conflicting.length) {
          throw new BadRequestException(
            `Invalid action attempt: question(s) [${conflicting.join(', ')}] cannot be both removed and updated`,
          )
        }

        const missing = dto.removeQuestionIds.filter((rid) => !quiz.questions.some((q) => q.id === rid))
        if (missing.length) {
          throw new BadRequestException(`Question(s) [${missing.join(', ')}] do not belong to quiz #${id}`)
        }

        const toRemove = quiz.questions.filter((q) => dto.removeQuestionIds!.includes(q.id))
        await manager.remove(Question, toRemove)
        quiz.questions = quiz.questions.filter((q) => !dto.removeQuestionIds!.includes(q.id))
      }

      if (updateQuestionIds.length) {
        for (const qId of updateQuestionIds) {
          const update = dto.updateQuestions![qId]
          const existing = quiz.questions.find((q) => q.id === qId)
          if (!existing) {
            throw new BadRequestException(`Question #${qId} does not belong to quiz #${id}`)
          }

          const mergedOptions = update.options ?? existing.options
          const mergedIndex = update.correctOptionIndex ?? existing.correctOptionIndex

          if (mergedIndex < 0 || mergedIndex >= mergedOptions.length) {
            throw new BadRequestException(
              `correctOptionIndex (${mergedIndex}) is out of bounds for ` +
                `question #${qId}, which has ${mergedOptions.length} options`,
            )
          }

          if (update.text !== undefined) existing.text = update.text
          existing.options = mergedOptions
          existing.correctOptionIndex = mergedIndex
          existing.modifyUserId = userId

          await manager.save(existing)
        }
      }

      if (dto.addQuestions?.length) {
        const newQuestions = dto.addQuestions.map((q) =>
          manager.create(Question, {
            text: q.text,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            createUserId: userId,
            quizId: quiz.id,
          }),
        )
        await manager.save(newQuestions)
      }

      const result = await manager.findOne(Quiz, {
        where: { id },
        relations: { questions: true },
      })
      if (!result) throw new NotFoundException(`Quiz #${id} not found`)
      return result
    })
  }

  async remove(id: number): Promise<void> {
    const quiz = await this.quizRepository.findOne({ where: { id } })
    if (!quiz) throw new NotFoundException(`Quiz #${id} not found`)
    await this.quizRepository.remove(quiz)
  }
}
