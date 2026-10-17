// DRILL 03 — AuthGuard (401) + RolesGuard (403) + @CurrentUser()
//
// Uživatelé (natvrdo): alice { name: 'alice', roles: ['admin'] }
//                      bob   { name: 'bob',   roles: ['user'] }
// Token = jméno: "Authorization: Bearer alice"
//
// Napiš a exportuj:
//
//  1. AuthGuard — rozparsuje "Bearer <name>", neznámý/chybějící → 401,
//     jinak uloží uživatele do req.user
//  2. Roles(...roles) dekorátor + RolesGuard — když handler/controller
//     vyžaduje role a uživatel žádnou nemá → 403
//  3. CurrentUser param decorator (createParamDecorator):
//     @CurrentUser() → celý user, @CurrentUser('name') → jen pole
//  4. MeController (prefix 'me'):
//     - GET /me       → user
//     - GET /me/name  → { name }
//  5. AdminController (prefix 'admin', @Roles('admin') na třídě):
//     - DELETE /admin/users/:id → 204
//  6. AppModule — oba guardy jako APP_GUARD (pořadí registrace = pořadí běhu!)
//
//   npx jest lessons/D5-nest-pipeline/drills/03
