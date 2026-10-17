// DRILL 03 — utility types na DTO
//
// Napiš a exportuj:
//
//  1. interface Article { id: string; title: string; body: string; tags: string[]; publishedAt: Date | null }
//  2. type CreateArticle = Article BEZ id a publishedAt            (Omit)
//  3. type UpdateArticle = CreateArticle, všechno nepovinné         (Partial)
//  4. type ArticleSummary = jen id a title                          (Pick)
//  5. function createArticle(dto: CreateArticle, id: string): Article   → publishedAt: null
//  6. function applyUpdate(a: Article, patch: UpdateArticle): Article
//       nemutuje; klíče s hodnotou undefined IGNORUJ (nepřepisují)
//       tags zkopíruj (výsledek nesmí sdílet pole se vstupem)
//  7. function summarize(items: readonly Article[]): ArticleSummary[]
//
// Sval: Omit/Partial/Pick, spread, Object.entries + filter undefined.
//
//   npx jest lessons/D2-generics-utility-errors/drills/03
