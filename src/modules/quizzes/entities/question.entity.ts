import { Quiz } from 'src/modules/questions/entities/quiz.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  text!: string

  @Column('jsonb')
  options!: string[]

  @Column()
  correctOptionIndex!: number

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quizId' })
  quiz!: Quiz

  @Column()
  quizId!: number

  @Column()
  createUserId!: string

  @Column({ type: 'uuid', nullable: true })
  modifyUserId!: string | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
