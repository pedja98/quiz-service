import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsString, IsArray, IsOptional, IsInt, Min } from 'class-validator'

export class QuestionResponseDto {
  @IsNumber()
  @ApiProperty({ type: Number })
  id!: number

  @IsString()
  @ApiProperty({ type: String })
  text!: string

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: Array<string> })
  options!: string[]

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsInt()
  @Min(0)
  correctOptionIndex?: number
}
