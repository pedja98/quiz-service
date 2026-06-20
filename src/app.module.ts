import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import dbConfig from './configs/db.config'
import commonConfig from './configs/common.config'
import { databaseConfigFactory } from './database/database.config'
import { QuizzesModule } from './modules/quizzes/quizzes.module'
import { QuestionsModule } from './modules/questions/questions.module'
import { AuthGuard } from './guards/auth.guard'
import { APP_GUARD } from '@nestjs/core'
import { RolesGuard } from './guards/roles.guard'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [dbConfig, commonConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfigFactory,
    }),
    QuizzesModule,
    QuestionsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
