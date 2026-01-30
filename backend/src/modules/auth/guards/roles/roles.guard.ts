import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Observable } from 'rxjs';
import { ROLE_KEY } from '../../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }
    
    let user: any;

    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      user = request.user;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      user = client.data.user; 
    }

    if(!user || !user.role){
      throw new ForbiddenException("Bạn không có quyền thực hiện hành động này");
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
        throw new ForbiddenException(`Chỉ có ${requiredRoles.join(', ')} mới được phép thực hiện hành động này`);
    }

    return true;
  }
}
