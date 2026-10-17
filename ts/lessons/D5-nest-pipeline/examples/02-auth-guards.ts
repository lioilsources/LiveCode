// Example 02 — autentizace + autorizace: globální AuthGuard přes APP_GUARD,
// @Public() a @Roles() přes metadata + Reflector, @CurrentUser() param decorator,
// 401 vs 403.
//
//   npm run ex:nest lessons/D5-nest-pipeline/examples/02-auth-guards.ts
import 'reflect-metadata';
import {
  CanActivate, Controller, createParamDecorator, Delete, ExecutionContext, ForbiddenException,
  Get, HttpCode, Injectable, Module, Param, SetMetadata, UnauthorizedException,
} from '@nestjs/common';
import { APP_GUARD, NestFactory, Reflector } from '@nestjs/core';
import type { Request } from 'express';

interface User {
  id: number;
  name: string;
  roles: string[];
}
type AuthedRequest = Request & { user?: User };

// "databáze" tokenů — v reálu JWT verify
const TOKENS: Record<string, User> = {
  't-alice': { id: 1, name: 'alice', roles: ['admin'] },
  't-bob': { id: 2, name: 'bob', roles: [] },
};

// ── dekorátory nad metadaty ────────────────────────────────────────────────
const IS_PUBLIC = 'isPublic';
const Public = () => SetMetadata(IS_PUBLIC, true);

const ROLES = 'roles';
const Roles = (...roles: string[]) => SetMetadata(ROLES, roles);

const CurrentUser = createParamDecorator((field: keyof User | undefined, ctx: ExecutionContext) => {
  const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
  return field ? user?.[field] : user;
});

// ── guardy ─────────────────────────────────────────────────────────────────
@Injectable()
class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = (req.header('authorization') ?? '').split(' ');
    const user = scheme === 'Bearer' && token ? TOKENS[token] : undefined;
    if (!user) throw new UnauthorizedException('missing or invalid token'); // 401
    req.user = user;
    return true;
  }
}

@Injectable()
class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user || !required.some((r) => user.roles.includes(r))) {
      throw new ForbiddenException(`requires role: ${required.join(', ')}`); // 403
    }
    return true;
  }
}

// ── controller ─────────────────────────────────────────────────────────────
@Controller('cats')
class CatsController {
  @Public()
  @Get()
  list() {
    return ['Mourek', 'Micka'];
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return user;
  }

  @Get('me/name')
  myName(@CurrentUser('name') name: string) {
    return { name };
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') _id: string) {}
}

@Module({
  controllers: [CatsController],
  providers: [
    // pořadí registrace = pořadí běhu; oba dostanou Reflector přes DI
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
class AppModule {}

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  const base = await app.getUrl();
  const call = async (method: string, path: string, token?: string) => {
    const res = await fetch(base + path, {
      method,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    console.log(`${method.padEnd(6)} ${path.padEnd(13)} ${(token ?? '-').padEnd(8)} → ${res.status} ${await res.text()}`);
  };

  await call('GET', '/cats'); //                 @Public
  await call('GET', '/cats/me'); //              bez tokenu → 401
  await call('GET', '/cats/me', 'nope'); //      neplatný → 401
  await call('GET', '/cats/me', 't-bob');
  await call('GET', '/cats/me/name', 't-bob');
  await call('DELETE', '/cats/1', 't-bob'); //   přihlášen, ale nemá roli → 403
  await call('DELETE', '/cats/1', 't-alice');
  await app.close();
}

main();

/* Výstup:
GET    /cats         -        → 200 ["Mourek","Micka"]
GET    /cats/me      -        → 401 {"message":"missing or invalid token","error":"Unauthorized","statusCode":401}
GET    /cats/me      nope     → 401 {"message":"missing or invalid token","error":"Unauthorized","statusCode":401}
GET    /cats/me      t-bob    → 200 {"id":2,"name":"bob","roles":[]}
GET    /cats/me/name t-bob    → 200 {"name":"bob"}
DELETE /cats/1       t-bob    → 403 {"message":"requires role: admin","error":"Forbidden","statusCode":403}
DELETE /cats/1       t-alice  → 204 
*/
