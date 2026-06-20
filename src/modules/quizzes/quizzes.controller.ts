import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import { QuizzesService } from './quizzes.service'
import { CreateQuizDto } from './dto/create-quiz.dto'
import { UpdateQuizDto } from './dto/update-quiz.dto'
import { ListQuizzesQueryDto } from './dto/list-quizzes-query.dto'
import { User } from 'src/decorators/user.decorator'
import { Roles } from 'src/decorators/roles.decorator'
import { AuthUser } from 'src/types/auth-user.types'

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @Roles('admin')
  create(@User() user: AuthUser, @Body() dto: CreateQuizDto) {
    return this.quizzesService.create(user.id, dto)
  }

  @Get()
  findAll(@Query() query: ListQuizzesQueryDto) {
    return this.quizzesService.findAll(query)
  }

  @Get(':id')
  findOne(@User() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.findOne(id, user.role)
  }

  @Patch(':id')
  @Roles('admin')
  update(@User() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQuizDto) {
    return this.quizzesService.update(user.id, id, dto)
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.remove(id)
  }

  @Get('internal/:id')
  async findOneInternal(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.findOneInternal(id)
  }
}
