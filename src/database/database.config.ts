import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { createDatabase } from 'typeorm-extension'

export const databaseConfigFactory = async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
  const options = {
    type: 'postgres' as const,
    host: configService.get<string>('db.databaseHost'),
    port: configService.get<number>('db.databasePort'),
    username: configService.get<string>('db.databaseUsername'),
    password: configService.get<string>('db.databasePassword'),
    database: configService.get<string>('db.databaseName'),
    autoLoadEntities: true,
    synchronize: configService.get<string>('common.isProduction') === 'false',
  }

  await createDatabase({
    options,
    ifNotExist: true,
  })

  return options
}
