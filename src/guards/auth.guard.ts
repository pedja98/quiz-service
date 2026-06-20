import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { UserRole } from 'src/enums/user-role.enum'
import { RequestWithUser } from 'src/types/request-with-user.types'

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>()
    const userId = req.headers['x-user-id'] as string
    const userRole = req.headers['x-user-role'] as UserRole

    if (!userId || !userRole) {
      throw new UnauthorizedException('Missing required headers')
    }

    req.user = {
      id: userId,
      role: userRole,
    }

    return true
  }
}
