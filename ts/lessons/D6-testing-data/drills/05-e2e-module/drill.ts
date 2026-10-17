// DRILL 05 — e2e-ready modul (controller + service + DTO + setupApp)
//
// Napiš (z prázdné stránky), všechno v tomhle souboru:
//
//  1. class CreateNoteDto { title: string }  — neprázdný string, max 100 znaků
//  2. @Injectable() NotesService — in-memory, create(title) a findById(id),
//     neexistující → NotFoundException
//  3. @Controller('notes') NotesController
//       POST /notes      → 201 { id, title }
//       GET  /notes/:id  → 200 / 404, id přes ParseIntPipe (abc → 400)
//  4. export @Module NotesModule
//  5. export function setupApp(app: INestApplication): INestApplication
//       — globální ValidationPipe({ whitelist, forbidNonWhitelisted, transform })
//       (stejnou funkci by volal main.ts → test a produkce mají stejné pipes)
//
//   npx jest lessons/D6-testing-data/drills/05
