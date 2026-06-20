import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Question } from '../quizzes/entities/question.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Question])],
  controllers: [],
  providers: [],
})
export class QuestionsModule {}
