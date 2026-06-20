import { AuthUser } from './auth-user.types'

export interface RequestWithUser extends Request {
  user: AuthUser
}
