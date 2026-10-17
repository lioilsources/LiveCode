// DRILL 01 — middleware
//
// Napiš a exportuj:
//
//  1. RequestIdMiddleware (implements NestMiddleware):
//     - vezme příchozí hlavičku x-request-id, nebo vygeneruje randomUUID()
//       (import { randomUUID } from 'node:crypto')
//     - uloží ji do req.requestId a nastaví ji do odpovědi (res.setHeader)
//     - zavolá next()  ⚠️
//  2. PingController (prefix 'ping'):
//     - GET /ping         → { pong: true }
//     - GET /ping/whoami  → { requestId }  (z @Req())
//  3. AppModule implements NestModule — v configure() aplikuj middleware
//     na PingController
//
// Typ: type RequestWithId = Request & { requestId?: string }  (Request z 'express')
//
// Sval: use(req, res, next), consumer.apply(X).forRoutes(Controller)
//
//   npx jest lessons/D5-nest-pipeline/drills/01
