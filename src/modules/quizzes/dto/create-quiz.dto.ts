import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { IsDurationString } from '../validators/is-duration-string.validator'
import { CreateQuestionDto } from 'src/modules/questions/dto/create-question.dto'

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  @IsDurationString()
  timeLimit!: string

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[]
}
