import { IsNumber, IsString, IsArray, IsOptional, IsInt, Min } from 'class-validator'

export class QuestionResponseDto {
  @IsNumber()
  id!: number

  @IsString()
  text!: string

  @IsArray()
  @IsString({ each: true })
  options!: string[]

  @IsOptional()
  @IsInt()
  @Min(0)
  correctOptionIndex?: number
}
