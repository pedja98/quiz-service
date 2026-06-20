import { registerAs } from '@nestjs/config'

export default registerAs('common', () => ({
  isProduction: process.env.IS_PRODUCTION,
}))
