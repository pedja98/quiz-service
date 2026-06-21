import { INestiaConfig } from '@nestia/sdk'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './src/app.module'

const config: INestiaConfig = {
  input: () => NestFactory.create(AppModule),
  output: 'api-docs',
  swagger: {
    output: 'bin/swagger.json',
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
        description: 'Local Server',
      },
    ],
  },
  simulate: true,
  primitive: false,
}

export default config
