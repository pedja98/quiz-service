import { UserRole } from 'src/enums/user-role.enum'

export class AuthUser {
  id!: string
  role!: UserRole
}
