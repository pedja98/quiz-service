import { Module } from '@nestjs/common'
import { QuizzesService } from './quizzes.service'
import { QuizzesController } from './quizzes.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Quiz } from '../questions/entities/quiz.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Quiz])],
  controllers: [QuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}
