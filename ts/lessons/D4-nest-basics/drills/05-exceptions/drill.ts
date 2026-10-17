// DRILL 05 — výjimky → status kódy
//
// Napiš a exportuj NotesService, NotesController (prefix 'notes') a NotesModule.
// Poznámka = { slug: string; text: string }, ukládej do Map podle slug.
//
//  - GET    /notes/:slug  → poznámka, nebo 404 se zprávou "note <slug> not found"
//  - POST   /notes        → 201 { slug, text }
//                           409, když slug už existuje
//                           400, když text je prázdný (kontrola v service, bez DTO)
//  - DELETE /notes/:slug  → 204 bez těla, 404 když neexistuje
//
// Sval: throw new NotFoundException(msg) / ConflictException / BadRequestException,
//       @HttpCode(204), logika v service, controller jen deleguje
//
//   npx jest lessons/D4-nest-basics/drills/05
