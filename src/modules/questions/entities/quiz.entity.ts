import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Question } from 'src/modules/quizzes/entities/question.entity'

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column({ nullable: true })
  description!: string

  @Column()
  timeLimit!: number

  @OneToMany(() => Question, (question) => question.quiz)
  questions!: Question[]

  @Column()
  createUserId!: string

  @Column({ type: 'uuid', nullable: true })
  modifyUserId!: string | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
