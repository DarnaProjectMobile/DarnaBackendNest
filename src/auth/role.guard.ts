import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './common/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { user } = context.switchToHttp().getRequest();

    console.log(`[RolesGuard] Checking access...`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log(`[RolesGuard] User: ${user ? JSON.stringify(user) : 'UNDEFINED'}`);
    console.log(`[RolesGuard] Required Roles: ${JSON.stringify(requiredRoles)}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!user) {
      console.warn('[RolesGuard] Access DENIED: No user attached to request (Invalid Token?)');
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.warn(`[RolesGuard] Access DENIED: User role '${user.role}' is not in [${requiredRoles.join(', ')}]`);
    } else {
      console.log('[RolesGuard] Access GRANTED');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return hasRole;
  }
}
