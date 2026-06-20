import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsNumber, IsString, ValidateNested } from 'class-validator'
import { QuestionResponseDto } from './question-response.dt'

export class QuizResponseDto {
  @IsNumber()
  id!: number

  @IsString()
  title!: string

  @IsString()
  description!: string

  @IsNumber()
  timeLimit!: number

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionResponseDto)
  questions!: QuestionResponseDto[]
}
