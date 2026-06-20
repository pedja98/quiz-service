import { registerAs } from '@nestjs/config'

export default registerAs('db', () => ({
  databaseHost: process.env.DATABASE_HOST,
  databasePort: process.env.DATABASE_PORT,
  databaseUsername: process.env.DATABASE_USERNAME,
  databasePassword: process.env.DATABASE_PASSWORD,
  databaseName: process.env.DATABASE_NAME,
}))
