import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator'
import { IsDurationString } from '../validators/is-duration-string.validator'
import { CreateQuestionDto } from 'src/modules/questions/dto/create-question.dto'
import { UpdateQuestionDto } from 'src/modules/questions/dto/update-question.dto'

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @IsDurationString()
  timeLimit?: string

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  addQuestions?: CreateQuestionDto[]

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  removeQuestionIds?: number[]

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionDto)
  updateQuestions?: UpdateQuestionDto[]
}
