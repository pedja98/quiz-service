import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class UpdateQuestionDto {
  @IsInt()
  id!: number

  @IsOptional()
  @IsString()
  text?: string

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2, { message: 'options must contain at least 2 choices' })
  @IsString({ each: true })
  options?: string[]

  @IsOptional()
  @IsInt()
  @Min(0)
  correctOptionIndex?: number
}
