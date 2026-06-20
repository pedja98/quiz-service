import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Min } from 'class-validator'
import { IsValidCorrectOptionIndex } from '../validators/is-valid-correct-option-index.validator'

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  text!: string

  @IsArray()
  @ArrayMinSize(2, { message: 'options must contain at least 2 choices' })
  @IsString({ each: true })
  options!: string[]

  @IsInt()
  @Min(0)
  @IsValidCorrectOptionIndex()
  correctOptionIndex!: number
}
