# SLR System spec (slr-be + slr-fe)

> Đọc file này trước khi đọc code. Snapshot 2026-10-12: `slr-be@0327b66`, `slr-fe@9a0b7c7` (branch `dev`). Code lệch spec thì code đúng.
> Phần 1–10: tổng quan (§10: 2 repo skill `/slr`). Phụ lục A–E: chi tiết endpoint, collection, field (Ctrl+F theo tên module/path).
> Bản giống hệt ở root 2 repo. Sửa thì sửa cả 2.

---

## 1. Hệ thống

**SRSS / SLRS (Systematic Review Support System):** web hỗ trợ Systematic Literature Review theo PRISMA 2020. Gồm 6 phase:

1. **Identification:** nguồn tìm kiếm (IEEE, Scopus, ACM, PubMed, Crossref, OpenAlex, Semantic Scholar), import (RIS, BibTeX, PDF, DOI, Crossref), dedup.
2. **Study Selection:** reviewer chấm Title/Abstract → Full-text (Include/Exclude/Uncertain). Leader resolve conflict. AI (Gemini) và external AI agent hỗ trợ.
3. **Quality Assessment:** chấm QA theo template.
4. **Data Extraction:** form theo reviewer, consensus, grid.
5. **Synthesis:** theme, evidence, theo RQ.
6. **PRISMA Report:** flow diagram, snapshot có version, xuất DOCX.

Dùng chung: protocol (RQ, PICOC, inclusion/exclusion, AI setup), member/invitation, checklist PRISMA, audit log, snowballing, external AI agent (token `slrp_`).

Hệ cũ: C#/ASP.NET Core + SignalR (`slr-be/docs/OLD_SYSTEM_ANALYSIS.md`). BE đã viết lại bằng Node/Firestore. FE còn giữ contract .NET (enum số, field PascalCase, route "process"), là nguồn gốc phần lớn lệch FE↔BE.

## 2. Kiến trúc & chạy

| | slr-be | slr-fe |
|---|---|---|
| Stack | Node 22, TS ESM, Express 4, firebase-admin, zod 3, pino | React 19, Vite 7, TS 5.9, Redux Toolkit + redux-persist, TanStack Query v5, axios, Tailwind v4 (không UI lib) |
| Lưu trữ | Firestore; **Cloudinary** (PDF + metadata Markdown); Firebase Storage (chỉ `/api/upload` + legacy) | localStorage (persist `auth`, `ui`, `project`, `documentEditor`) |
| Ngoài | GROBID (worker in-process), Gemini, Crossref/OpenAlex/Semantic Scholar | Google Identity + Firebase REST `signInWithIdp` |
| Dev | `npm run emulators` (Auth 9099, Firestore **18080**, Storage 9199, UI 4000) + `npm run dev` (:5000) | `npm run dev` (proxy `/api` → `VITE_BE_URL` / `localhost:5000`) |
| Test | `npm test` (Vitest, 28 file, cần emulator); `npm run typecheck` (= `lint`) | Không test. `npm run lint` không chặn CI |
| API docs | `/api-docs`, `/api-docs.json`. `npm run build` sinh lại `generated-openapi.json` | |
| Deploy | CI trên `dev`. Push `main` → GHCR → SSH `docker compose up` + deploy Firestore **indexes** (không deploy rules) | Docker (node20 → nginx, `/api/` → `slr-backend:5000`), Vercel |

Dev auth: `DEV_AUTH_ENABLED=true` + không production → nhận token `dev-<uid>`/`mock-<uid>`; request không header tự login tài khoản dev. Seed: `admin_user`, `leader_user`, `reviewer_user`, `reviewer_test_1..5` (`npm run seed`, cần `SEED_*_PASSWORD`).

## 3. Code ở đâu

**slr-be**
- Wiring: `src/app.ts` → `src/routes.ts` (bảng mount, dưới `/api`).
- Module: `src/modules/<feature>/{feature}.routes|controller|service|schemas|types.ts`, 30 module (Phụ lục B, C).
- Auth/RBAC: `src/middleware/{auth,role,global-admin}.middleware.ts`.
- Error: `src/middleware/error.middleware.ts`, `src/shared/errors/app-error.ts`.
- Env: `src/config/env.ts`. Firebase: `src/config/firebase.ts`.
- Compat cho FE: `modules/compatibility/phase-compatibility.routes.ts`, `modules/data-extraction/data-extraction-conducting.routes.ts`.

**slr-fe**
- Route: `src/routes/{MainRoutes,AdminRoutes,AuthRoutes}.tsx`. Guard: `src/routes/ProtectedRoute.tsx` (global), `src/components/routes/ProtectedRouteForProject.tsx` (project).
- API: `src/config/axios.ts`, `src/services/*Service.ts`, `src/hooks/use*.ts`, `src/constants/queryKeys.ts`.
- Phase workspace: `src/pages/reviewProcess/**` (~110 file). Paper pool: `src/components/paperPool/**`.
- Type/enum: `src/types/*.ts`. Token: `@theme` trong `src/index.css`.

## 4. Role

- **Global:** `ADMIN` | USER. Từ claim `roles`/`globalRole`, fallback `users/{uid}.globalRole`. Global ADMIN = OWNER mọi project.
- **Project BE (string):** `OWNER` (legacy `ADMIN` → OWNER), `LECTURER`, `REVIEWER` tại `projects/{id}/members/{uid}.role`.
  - `requireProjectRole(X)`: OWNER luôn qua; `MEMBER` = member bất kỳ; còn lại phải **khớp đúng**. LECTURER ≠ REVIEWER, không phân cấp.
  - LECTURER: import/tạo paper, search, synthesis, extraction canonical. REVIEWER: screening decision, QA scoring. OWNER: protocol, QA template, resolve, member.
- **Project FE (số):** `1` Owner/Leader, `2` Lecturer/Member, `3` Reviewer (từ `GET /projects/:id/my-membership`). Role guide ghi Reviewer = 2, sai; code dùng **3**.

## 5. Phase ↔ BE ↔ FE

| Phase | BE route FE gọi | BE canonical (FE ít/không dùng) | FE page |
|---|---|---|---|
| Project/Protocol | `/api/projects/*`, `/api/core-govern/*`, `/api/projects/:id/ai-setup/*` | `/api/projects/:id/protocol` | `pages/projects/*`, `AIProjectSetupWizard` |
| Identification | `/api/papers/import/*`, `/api/works`, `/api/projects/:id/{papers,sources,filter-settings,duplicate-pairs}`, `/api/search-sources*`, `/api/identification-processes/:id/{start,complete,reopen}` | `/api/projects/:id/deduplication/run`, `/search/semantic-scholar` | `IdentificationPhaseWorkspace`, `components/paperPool/*` |
| Review process | `/api/review-processes/:id/*`, `/api/projects/:id/review-processes` | | `ReviewProcessWorkspace`, `workflow/*` |
| Study selection | `/api/study-selection/:processId/*` (`sp_`/`rp_` + projectId), `/api/papers/assign`, `/api/paper-fulltext/*` | `/api/projects/:id/screening/:paperId/*` | `ScreeningPhaseRouter`, `TitleAbstractScreeningWorkspace`, `FullTextScreeningWorkspace`, `ManageStudySelectionPage` |
| Quality | `/api/quality-assessment/:processId/*` (compat, **chỉ đọc + start/complete**) | `/api/projects/:id/quality/*` | `QualityAssessmentWorkspace` |
| Extraction | `/api/data-extraction*`, `/api/data-extraction-processes/:id/*` (**nhiều stub**) | `/api/projects/:id/extraction/*` | `DataExtractionPhaseWorkspace`, `ExtractionGridWorkspace` |
| Synthesis | `/api/synthesis-execution/*`, `/api/synthesis/*` (compat) | `/api/projects/:id/synthesis/*` | `SynthesisPhaseWorkspace` |
| PRISMA | `/api/projects/:id/prisma/*` | | `PrismaReportWorkspace` |

Phase state: object trên `projects/{id}`: `identification`, `studySelection`, `qualityAssessment`, `dataExtraction`, `synthesis`, `reviewProcess` = `{status: 0 NotStarted | 1 InProgress | 2 Completed, statusText, startedAt, completedAt}`. 1 Project = 1 Review Process (`rp_{projectId}`).

**Screening** (`modules/screening/screening.service.ts`): 1 vote/reviewer/stage (`screeningDecisions/{uid}_{stage}`). **AI vote (`aiAnalysis/{0|1}`) tính là 1 reviewer** (e4e84f0). ≥2 vote: toàn INCLUDE → TA `SCREENING_FULL_TEXT`, FT `INCLUDED`; toàn EXCLUDE → `EXCLUDED`; lẫn/UNCERTAIN → `isConflict=true`. OWNER resolve.

**Paper status:** `IMPORTED → SCREENING_TITLE_ABSTRACT → SCREENING_FULL_TEXT → INCLUDED | EXCLUDED`, + `DUPLICATE`. Bibliographic data **không ở Firestore**, ở Markdown trên Cloudinary (`metadataFile`, `slr-paper-metadata-v1`). Mỗi lần đọc phải `hydratePapers()` → filter/phân trang trong memory.

**PDF:** upload Cloudinary → `pdfProcessingJobs/{projectId}__{paperId}` → worker in-process gọi GROBID → parse TEI → ghi `pdf.fullText`, `pdf.processingStatus` (PENDING/PROCESSING/COMPLETED/FAILED). `fulltext-markdown`: 202 đang xử lý, 409 không có.

## 6. Firestore

- Root: `users/{uid}` (+ `notifications`), `projects/{id}`, `invitations`, `agents/{id}` (+ `projectAccess`, `tasks`), `pdfProcessingJobs`, `masterSearchSources`, `exclusionReasonLibraries`, `checklistTemplates`, `reviewChecklists`, `auditLogs`, `candidate_papers`. Legacy governance: `reviewNeeds`, `commissioningDocuments`, `reviewObjectives`, `researchQuestions`, `picocElements`.
- `projects/{id}/…`: `members`, `protocol/main`, `aiSetup/details`, `papers` (+ `screeningDecisions`, `aiAnalysis`, `qualityAssessments`, `extractionRecords`, `candidates`), `reviewProcessPapers`, `duplicatePairs`, `searchSources`, `filterSettings`, `importBatches`, `qualityTemplates`, `extractionTemplates`, `synthesisThemes`, `synthesisStrategies`, `prismaReports`, `studySelectionExclusionReasons`, `studySelectionChecklistTemplates`, `timeline`, `reviewNeeds`, `auditLogs`.
- Rules: client **không ghi** subcollection project; mọi ghi qua BE (Admin SDK).
- **Trùng nguồn:** RQ ở 3 nơi (`researchQuestions` root, `protocol/main.researchQuestions`, `aiSetup/details`). PICO 2 dạng (`aiSetup.picoc.comparator` string, `protocol.pico.comparison` mảng). Extraction template 2 dạng (`fields` canonical, `sections` legacy).

## 7. Contract FE ↔ BE

- Envelope **không thống nhất**: `{success, isSuccess, data, message, errors}` hoặc `{success, data}`. Error luôn `{success:false, error:{code, message}}`. Kiểm tra từng module.
- FE dùng enum số. Phase lệch ngay trong FE: `ProcessPhase` 1/2 vs `PaperPhase`/`ScreeningPhase` 0/1. `/api/papers/assign` nhận `phase` 1..2.
- Field PascalCase (.NET): `/paper-fulltext/upload` nhận `File`, `ProjectId`.
- Auth: access token trong Redux, persist localStorage. FE refresh qua `POST /auth/refresh`, BE refresh **chỉ dev**. Google login trả Firebase ID token làm access token (~1h).
- **SignalR đã bỏ:** BE không hub. FE còn client no-op, proxy `/hubs`, dependency.
- **FE gọi, BE không có** (Phụ lục E §10):
  - Identification data layer: `search-executions`, `import-batches`, `GET identification-processes/:id`, `ready-papers`, `snapshot`, `statistics`, `unique-papers`.
  - QA writes: assignments, decisions, resolutions, AI decide, strategies upsert, bulk.
  - Study-selection: bulk-resolve, bulk-dataset, live-review-import, final-resolution-progress, included-full-text-papers, assignment-table, toggle/delete exclusion reason, checklist-submissions.
  - Selection-criteria AI generate/save.
  - Users: `progress-overview`, `change-password`.
  - Review-processes: `PUT`, `DELETE`, `cancel`, `POST /:id/study-selection`.
  - Khác: `/ai/projects/:id/analyze-picoc`, `mark-as-duplicate`, `PUT question-types`, synthesis `themes/:id/evidence`, `evidence/:id`, `findings/:id`.
  - Lệch method: notifications mark-read (FE `PUT`, BE `PATCH`); `read-all` không có.
- **BE stub (dữ liệu giả/rỗng):** phần lớn data-extraction-processes (dashboard counts, workload, export, grid, consensus, ask-ai-field, auto-extract), QA `assignments/my`, synthesis `extracted-data`/findings, checklist `auto-fill`, `extract-references` (3 reference cứng), discovery (`references`/`citations`/`graph`/`suggestions`/`top-cited`), `selection-criteria`, audit admin (4 log giả khi rỗng).

## 8. Vấn đề đã biết

**Bảo mật / phân quyền (BE):**
1. `POST /api/invitations/:id/accept|reject`, `DELETE /api/invitations/:id`: không check người gọi, status, expiry → ai có id cũng vào được project.
2. `GET /api/auditlog/admin`: chỉ `requireAuth`, không check admin. `project-leader/:projectId` không check membership.
3. `/api/users/*`: `PATCH :id/status`, `PUT :id/profile`, list, export CSV không check admin/chính chủ.
4. `/api/study-selection/*`: chỉ check membership, không role → REVIEWER resolve, start/complete được.
5. Ẩn vote (blind review) là dead code: `req.projectRole` không được set → REVIEWER thấy mọi vote.
6. Candidate-papers, `extract-references`, legacy data-extraction, compat QA/synthesis start/complete, exclusion-reason CRUD, checklist instance: không check membership/role. `DELETE /api/data-extraction/templates/:id` xoá theo collectionGroup (xuyên project).
7. GET core-governance (needs, documents, RQ, PICOC, timeline), `GET /api/master-sources/available`: **không auth**.
8. `helmet` import nhưng không `app.use`. `ENABLE_COMPATIBILITY_ROUTES` vô tác dụng (compat luôn mount). Gemini key trong query string → có thể lọt log.
9. `slr-fe/.env.production` **bị git track** dù có trong `.gitignore` (public client key).

**Logic / dữ liệu:**
- PRISMA `reports/cleanup` giữ report **cũ nhất**, xoá các bản mới hơn. `GET reports/latest` tự tạo baseline nếu chưa có.
- AI evaluate (study-selection) đọc criteria/RQ từ **root project doc**, code hiện ghi vào `protocol/main` → prompt có thể rỗng. Fallback: keyword cứng chủ đề SE/LLM.
- `deleteReviewNeed` chỉ xoá bản root, bản subcollection còn → need hiện lại.
- `AuditService.log`, `NotificationsService.send` không ai gọi → chỉ có dữ liệu seed.
- `qualityResolution.finalDecision` không có writer → QA high/low luôn 0. `totalScore` do client gửi.
- Import DOI/Crossref không dedupe; `cross-ref` chỉ lấy kết quả đầu. Dedup "TITLE_FUZZY" thực ra là khớp chính xác.
- Hiệu năng: full scan (`collectionGroup('papers')`, theme scan mọi project, audit, users, master-source usage). PDF worker in-memory → giả định 1 instance.
- Firebase project id lệch giữa `.firebaserc`, env default, CI, deploy.

**FE:**
- Route lạ → trang trắng (fallback `*` bị comment). `InteractionGuard` (admin read-only) tắt. Trộn `react-router` + `react-router-dom`. Mock data snowballing trong code thật. Trang mồ côi (Phụ lục D §5h). `useQualityAssessmentProcess.ts` rỗng.
- Docker build không truyền `VITE_FIREBASE_API_KEY`/`VITE_FIREBASE_AUTH_EXCHANGE_URL` → Google login tắt trong image.
- 2 doc design system mâu thuẫn; code dùng `#0071BC`, không dark mode, không i18n (UI trộn Anh/Việt).

## 9. Quy ước code

- **BE:** ESM, import đuôi `.js`. Controller (class + arrow handler) / service / zod schema qua `validate()`. Throw `AppError` subclass. Pino object-first. Test ở `tests/<feature>.test.ts`, không typecheck. Không ESLint/Prettier. Không sửa tay `generated-openapi.json`.
- **FE:** hook React Query bọc service. Ưu tiên `QUERY_KEYS` (còn nhiều key inline). Toast qua `utils/toast.tsx`. Class qua `cn()`. Primitive tự viết ở `components/ui`. `.github/copilot-instructions.md`: file ≤ ~600 dòng, không `any`, không `console.log`, không barrel export.
- Git: làm trên `dev`, PR vào `main` (main deploy). Docs: `slr-be/docs/` (SRS, SEED_DATA_GUIDE, phần lớn tiếng Việt), `slr-fe/docs/` (`api/`, `integration/`, design).

## 10. Skill repo: `/slr` agent client

2 repo cùng cấp với slr-be/slr-fe, đều là client cho **Agent Task API** `/api/agent/v1` (Phụ lục B §1). Không có backend riêng.

| | `slr_skill_claude_science` | `slr_skill_open_science` |
|---|---|---|
| Client AI | Claude Code, Claude Desktop, Claude Science | Chỉ Open-Science (AIPOCH) |
| Thành phần | `SKILL.md`, `scripts/slr.py` (CLI, stdlib), `scripts/slr_mcp.py` (MCP stdio, stdlib), `bin/install.js` | `skill/slr/`, `cli/*.js`, `bin/install.js` (installer + launcher `--mcp`), `mcp/slr-agent-mcp` (TS, MCP SDK v2, zod 4) |
| Yêu cầu | Node ≥16.7 (chỉ để chạy installer), Python ≥3.8 | Node ≥20, git; `prepare` compile TS khi cài |
| Cài | `npx github:ResearchPulse/slr_skill_claude_science install --url <URL>/api --token <TOKEN> -y` (hoặc env `SLR_API_URL`, `SLR_TOKEN`) | `npx github:ResearchPulse/slr_skill_open_science` (hỏi token ẩn; cần TTY) |
| URL mặc định | `http://localhost:5000/api` | `https://slr-api.hyperdatalab.org/api` |
| Ghi ra | skill `~/.claude/skills/slr`, `~/.claude-science/skills/slr`; config `~/.config/slr/` (token plaintext, 0600 chỉ POSIX); MCP qua `claude mcp add -s user`, `claude_desktop_config.json` | `~/.agents/skills/slr`; `~/.slr/{profiles.json,tokens/<p>,connectors/<p>.json}` (token plaintext); connector `npx --yes github:…/slr_skill_open_science --mcp --profile <p>` |
| MCP tools | `list_tasks`, `get_task`, `get_markdown`, `submit_result`, `connection_test` | `list_assigned_tasks`, `get_assigned_task`, `get_task_fulltext`, `submit_review_result` (confirm qua digest, 2 lần gọi) |
| Kiểm tra | `npx …claude_science doctor` | `npx …open_science doctor` |
| Test | không | `npm test` (node:test + vitest, fake API) |

**Prod backend (2026-10-12):** `https://slr-api.hyperdatalab.org/api/health` → 200; `/agent/v1/tasks` không token → 401. `api.hyperdatalab.org` (đang dùng trong `slr-fe/.env.production`) → **502**.

**Kết quả agent:** chỉ lưu vào `agents/{id}/tasks/{taskId}.result` (status COMPLETED). **Không** tạo `screeningDecisions`/`aiAnalysis`, không đổi status paper. FE chỉ hiển thị (`ProjectAgentAssignments`, `manage-study-selection/components/PaperList.tsx`).

**Lấy token / giao task:** admin tạo agent (`/admin/agents`) → OWNER project connect agent (Project Settings → AI Agents) → nhận token `slrp_…` (xem lại: `GET /projects/:id/agents/:agentId/token`) → giao paper: `POST /projects/:id/agents/:agentId/tasks`. BE cần `AGENT_TOKEN_ENCRYPTION_KEY`, thiếu → 503.

**Lỗi đã biết:**
- Cả 2: paper không có PDF → BE trả **404**, client/skill chỉ hiểu 409 là "không full text". Không có LICENSE file dù khai MIT. Cài từ `github:` không pin tag/commit. Token plaintext trên đĩa (Windows không áp 0600).
- claude_science: client cho body ≤ 30720 byte, BE giới hạn 30000. Retry cả POST `/result` (5xx sau khi đã commit → 409 → báo "already_completed"). `--python` có dấu cách bị cắt (`install.js:151`). `API_BASE_URL` env không tự thêm `/api`. SKILL.md bảo nhận token dán vào chat.
- open_science: timeout bị clear trước khi đọc body (`http-client.ts:170`) → body treo không timeout. `--register` không code nào đọc. Draft/receipt writer không được gọi → `/slr drafts` rỗng, không có audit. Markdown cap 8 MiB (BE 20 MiB). Digest confirm không phải cổng thật (model tự gọi được cả 2 bước). Không lưu token được khi không có TTY.

---

# Phụ lục

Chi tiết theo khu vực. Lưu ý: Phụ lục D ghi "`.env.production` gitignored" là sai, file đang bị track.


## Phụ lục A: slr-be infra, config, middleware, ops



---

#### 1. Package, runtime, tooling

**File:** `package.json`
- name `slr-backend`, version `1.0.0`, `"type": "module"` (ESM everywhere; imports use `.js` suffixes).
- `main`: `dist/server.js`.
- Runtime: Node 22 (Dockerfile and CI both use `node:22`; README says "Node 18+, 22 recommended").

Scripts:
| Script | Command |
|---|---|
| `generate:openapi` | `tsx scripts/generate-openapi.ts` |
| `prebuild` | runs `generate:openapi` automatically before `build` (note: `npm run build` rewrites `src/config/generated-openapi.json`) |
| `dev` | `tsx watch src/server.ts` |
| `build` | `tsc` (outDir `dist`) |
| `start` | `node dist/server.js` |
| `emulators` | `node scripts/start-emulators.js` (spawns `npx firebase emulators:start` with `.jdk21` on PATH, project from `FIREBASE_PROJECT_ID`, default `systematic-literature-re-52b46`, import/export `.firebase-emulator-data`) |
| `seed` | `tsx src/scripts/seed.ts` |
| `migrate:paper-assets` | `tsx src/scripts/migrate-paper-assets.ts` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `typecheck` | `tsc --noEmit` |
| `lint` | `tsc --noEmit` (same as typecheck; there is NO ESLint/Prettier setup) |

Key dependencies (versions in package.json; installed versions verified in node_modules where noted):
- Server: `express ^4.21.2` (installed 4.21.2), `cors ^2.8.5`, `helmet ^8.0.0` (imported in app.ts? NOTE: `helmet` is imported in `src/app.ts` but NOT applied via `app.use(helmet())` - see Gotchas), `multer ^2.4.0`, `multer-storage-cloudinary ^2.2.1`.
- Firebase: `firebase-admin ^14.5.0` (installed 14.5.0). Firestore, Auth, Storage via firebase-admin subpaths.
- Validation: `zod ^3.24.2` (installed 3.24.2). NOT zod v4.
- Logging: `pino ^9.6.0`, `pino-pretty ^13.0.0` (dev transport only).
- Docs: `swagger-ui-express ^5.0.1`, `openapi-types ^12.1.3`, `swagger-autogen ^2.23.7` (dev, not used by the generator script which is hand-rolled).
- Storage/media: `cloudinary ^2.11.0`, `axios ^1.7.9`.
- Parsing/gen: `fast-xml-parser ^5.11.2` (GROBID TEI), `docx ^9.8.1` (document export).
- Dev/test: `typescript ^5.7.3` (installed 5.9.3), `tsx ^4.19.3`, `vitest ^5.0.3` (installed 5.0.3), `supertest ^7.0.0`, `firebase-tools ^14.23.0` (dev dep, emulators), `@types/node ^22.13.4`.

**File:** `tsconfig.json`
- target/lib `ES2022`, module/moduleResolution `NodeNext`, `strict: true`, `esModuleInterop`, `resolveJsonModule`, `declaration` + `sourceMap`.
- `rootDir: ./src`, `outDir: ./dist`, `include: src/**/*`, exclude `node_modules`, `dist`, `tests/**/*`. So typecheck does NOT cover tests.

**File:** `vitest.config.ts`
- Aliases `vitest` -> `tests/vitest-shim.ts` (shim re-exporting globals `describe/it/expect/vi/...` from globalThis; comment says "Vitest 5 / Node 24 globals interop").
- `test.include: tests/**/*.test.ts`; `globals: true`; `maxWorkers: 1, minWorkers: 1` (tests run serially).
- Excludes node_modules, .codex, dist, shim.

**Other root config:** `.firebaserc` (default project `hyperdatalab-slr`, NOTE: differs from the project IDs used in CI/compose: `slr-system-dev`, `systematic-literature-re-52b46`); `.dockerignore` (excludes node_modules, dist, .git, .github, .env*, service-account.json, *.log); `.gitignore` (node_modules, dist, .env, .env.local, *.log, coverage, .firebase/, service-account.json, `.firebase-emulator-data/`, `.jdk21/`, docker-compose.override.yml, AGENTS.md, .mcp.json, .hs.json, .codegraph/, .agents/).

Stray root artifacts (not source): `SLR_AFL_PRISMA.pdf`, `SLR_AFL_fulltext_can_lay_1 (1).xlsx`, `firebase-debug.log`, `firestore-debug.log`, `dist/` build output, `.jdk21/` (bundled JDK 21 for emulators on Windows; ~large).

---

#### 2. Entry points and app wiring

##### `src/server.ts`
1. `dns.setDefaultResultOrder('ipv4first')`.
2. `createApp()` from `app.ts`; `app.listen(env.PORT)`.
3. On listen: logs and calls `pdfProcessingWorker.start()` (from `modules/pdf-processing/index.js`) - an in-process background worker started with the HTTP server.
4. Graceful shutdown on SIGTERM/SIGINT: `pdfProcessingWorker.stop()` (bounded wait), then `server.close()`, then `process.exit(0)`. Unfinished PDF jobs are recovered after restart (Firestore-backed queue).

##### `src/app.ts` - `createApp()`
Middleware order:
1. CORS: `origin` = `env.FRONTEND_URL` split on commas; `credentials: true`.
2. `express.json({ limit: '10mb' })`, `express.urlencoded({ extended: true })`.
3. `GET /api-docs.json` -> raw `openApiDocument`; `/api-docs` -> swagger-ui (`swagger-ui-express`).
4. `app.use('/api', routes)` (routes.ts).
5. 404 catch-all -> `NotFoundError('The requested endpoint does not exist')`.
6. `errorHandler` (central).

Notes: `helmet` is imported but NOT mounted. The JSON body limit (10mb) is global; multer enforces the per-file limits.

##### `src/routes.ts` - master router, mounted at `/api`
Auth gating is per-route (`requireAuth` / `requireProjectRole`) not global. Route prefixes (in source order), with the module that owns them:

Special / public / agent:
- `/api/public/papers` -> `modules/paper-import/public-paper-import.routes.ts` (API-key protected; see Middleware)
- `/api/admin/agents` -> `modules/agent-access` (`adminAgentRoutes`; global admin)
- `/api/agent/v1` -> `modules/agent-access` (`externalAgentRoutes`; agent token, `requireAgentToken` line ~413 of agent-access.routes.ts)
- `/api/projects/:projectId/agents` -> `modules/agent-access` (`projectAgentRoutes`)
- `GET /api/health` -> inline `{status:'ok', timestamp}` (no auth)

Accounts / system:
- `/api/auth` -> `modules/auth`
- `/api/auditlog` and `/api/audit-logs` -> `modules/audit`
- `/api/admin/master-sources` -> `modules/master-sources`
- `GET /api/master-sources/available` -> `masterSourcesController.getAvailable` (inline)
- `/api/exclusion-reason-libraries` -> `modules/exclusion-reasons`
- `/api/checklist` and `/api/checklist-templates` -> `modules/checklist-templates/checklist-templates.routes.ts`
- `/api/reviews` -> `modules/checklist-templates/review-checklists.routes.ts`
- `/api/users` -> `modules/users`
- `/api/notifications` -> `modules/notifications`
- `/api/upload` -> `modules/upload`
- `/api/invitations` -> `modules/invitations`
- `/api/data-extraction` -> `data-extraction-conducting.routes` (`dataExtractionTemplateRouter`)
- `/api/data-extraction-processes` -> same file (`dataExtractionProcessesRouter`)
- `phaseCompatibilityRoutes` mounted at root of `/api` (`modules/compatibility/phase-compatibility.routes.ts`) - mounted unconditionally (see Gotchas: ENABLE_COMPATIBILITY_ROUTES is not checked)

Papers (many routers share `/papers`):
- `POST /api/papers/assign` (inline, requireAuth + validate(assignPapersSchema))
- `/api/papers` -> `paperCandidateRouter` (candidate-papers), then `paperImportRoutes` (paper-import), then `paperDiscoveryRoutes` (papers/paper-discovery)
- `GET /api/papers/:paperId/candidates` and `/candidate-papers` -> candidatePapersController
- `POST /api/papers/:paperId/extract-references` -> candidatePapersController
- `GET /api/papers/:paperId`, `DELETE /api/papers/:paperId` -> papersController (global variants)
- `/api/candidate-papers` -> candidate-papers.routes (mounted twice, harmless duplicate)
- `/api/works` -> paper-import `worksRouter` (Crossref/OpenAlex search and DOI lookup)
- `/api` (root) -> `paperPoolTopLevelRoutes` (modules/paper-pool)
- Fulltext/PDF (inline):
  - `POST /api/paper-fulltext/upload` (multer field `File`)
  - `POST /api/paper-fulltext/upload-pdf` (multer field `file`)
  - `POST /api/paper-fulltext/upload-signature` (Cloudinary signed direct-upload)
  - `POST /api/paper-fulltext/finalize-upload`
  - `POST /api/paper-fulltext/:paperId/extract-metadata` (GROBID retry, background job)
  - All use `requireLecturerForFulltext` which copies `ProjectId|projectId` from body/query into `req.params.projectId` then calls `requireProjectRole('LECTURER')`.

Core governance:
- `/api/core-govern` and `/api/research-questions` -> `modules/core-governance`

Review processes (inline router, "Model 1.1: 1 Project = 1 Review Process"):
- `/api/review-processes` (requireAuth on whole sub-router):
  - `POST /:id/papers` (validate addSelectedPapersSchema)
  - `POST /:id/papers/add-from-filter-setting` (validate addPapersFromFilterSettingSchema)
  - `POST /:id/reopen-phase/:phase`, `POST /:id/start`, `POST /:id/complete`, `GET /:id`

Study selection (legacy-compatible decision routes):
- `/api/study-selection` -> `modules/study-selection/study-selection.routes.ts`
- `/api/study-selection` (second mount) -> inline `studySelectionRouter`:
  - `POST /:processId/papers/:paperId/decision`, `GET .../decisions`, `POST .../resolve` -> screeningController. `processId` is mapped to `projectId` by stripping `rp_`/`sp_` prefixes (`bridgeProjectId`).
- `/api/selection-criteria` -> `modules/study-selection/selection-criteria.routes.ts`
- `/api/study-selection-checklist-templates` -> study-selection checklist-template activation router

Projects (top-level and nested):
- `/api/projects` -> `modules/projects/projects.routes.ts`
- `/api/projects/:projectId/protocol` -> `modules/protocol`
- `/api/projects/:projectId` -> study-selection `checklistTemplateRoutes`
- `/api/projects/:projectId/papers` and `/api/project/:projectId/papers` (singular alias) -> `modules/papers/papers.routes.ts`
- `/api/projects/:projectId` -> `modules/paper-pool` (paperPoolRoutes)
- `/api/projects/:projectId` -> duplicatePairsRouter (deduplication)
- `/api/projects/:projectId/deduplication` -> `modules/deduplication`
- `/api/projects/:projectId/screening` -> `modules/screening`
- `/api/projects/:projectId/quality` -> `modules/quality-assessment`
- `/api/projects/:projectId/extraction` -> `modules/data-extraction`
- `/api/projects/:projectId/synthesis` -> `modules/synthesis`
- `/api/projects/:projectId/prisma` -> `modules/prisma`
- `/api/projects/:projectId/ai` -> `modules/ai`
- `/api/projects/:projectId/ai-setup` -> `modules/ai-setup`
- `/api/projects/:projectId/search` -> `modules/search`

Imported but NOT mounted (verified): `modules/projects/review-needs.routes.ts` (`reviewNeedsRoutes`, line 11 of routes.ts, never used). `modules/papers/paper-statistics.routes.ts` is not imported anywhere in src (unmounted).

Count of distinct mount points in routes.ts: ~70 `router.use`/`router.get|post` lines (approximate).

Summary of URL shape: almost all business routes are `/api/projects/:projectId/<resource>`; legacy/compat aliases exist at `/api/review-processes`, `/api/study-selection`, `/api/papers`, `/api/candidate-papers`, `/api/works`, `/api/core-govern`, `/api/research-questions`.

---

#### 3. Config (`src/config/*`)

##### `src/config/env.ts`
Loads `dotenv/config`, validates `process.env` with a zod schema, and on failure `console.error` + `process.exit(1)`. Exports `env`.

Variables (names, type, default):
- `NODE_ENV`: enum development|production|test, default `production` (safe default).
- `PORT`: number, default 5000.
- `FRONTEND_URL`: comma-separated CORS origins, default `http://localhost:5173,http://localhost:3000`.
- Dev auth (all gated by NODE_ENV != production):
  - `DEV_AUTH_ENABLED` (bool, default false), `DEV_AUTH_UID`, `DEV_AUTH_EMAIL` (email), `DEV_AUTH_DISPLAY_NAME`, `DEV_AUTH_ROLE` (ADMIN|USER, default USER), `DEV_AUTH_REVIEWER_UID` (default `reviewer_user`), `DEV_AUTH_REVIEWER_EMAIL` (default `reviewer@slr.local`), `DEV_AUTH_REVIEWER_DISPLAY_NAME`, `DEV_AUTH_EXTRA_USERS_JSON` (string JSON of extra dev accounts).
- `ENABLE_COMPATIBILITY_ROUTES` (bool, default false) - DEFINED but NOT read by any route code (only tests/auth-guard.test.ts references it).
- `PUBLIC_UPLOAD_API_KEY` (min 16 chars, optional).
- `AGENT_TOKEN_ENCRYPTION_KEY` (string optional; 32-byte base64url key, used for AES-256-GCM encryption of retrievable agent tokens).
- Firebase Admin: `FIREBASE_PROJECT_ID` (default `slr-system-dev`), `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`.
- GROBID: `GROBID_URL` (default `http://localhost:8070`), `GROBID_TIMEOUT_MS` (8000), `GROBID_FULLTEXT_TIMEOUT_MS` (180000), `GROBID_CONSOLIDATE_HEADER` ('0'|'1'|'2', default '1'), `GROBID_CONSOLIDATE_CITATIONS` (default '0').
- PDF background worker: `PDF_PROCESSING_ENABLED` (bool, default true), `PDF_PROCESSING_CONCURRENCY` (1-8, default 2), `PDF_PROCESSING_MAX_ATTEMPTS` (1-10, default 3), `PDF_PROCESSING_MAX_BYTES` (default 50 MB).
- Bibliographic APIs: `CROSSREF_BASE_URL` (default https://api.crossref.org), `CROSSREF_MAILTO` (email, optional), `OPENALEX_BASE_URL` (default https://api.openalex.org), `OPENALEX_MAILTO` (optional), `SEMANTIC_SCHOLAR_API_KEY`, `SEMANTIC_SCHOLAR_BASE_URL` (default https://api.semanticscholar.org/graph/v1/paper/search).
- AI: `AI_PROVIDER` enum gemini|openai|groq|openrouter (default gemini), `AI_API_KEY`, `AI_MODEL` (default `gemini-1.5-flash`).
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Seed only: `SEED_ADMIN_PASSWORD`, `SEED_REVIEWER_PASSWORD` (min 12 chars each).

Env vars read directly via `process.env` (bypassing zod): `PUBLIC_UPLOAD_API_KEY` (public-api-key.middleware.ts), `GRPC_DNS_RESOLVER` (set, firebase.ts), `FIREBASE_STORAGE_EMULATOR_HOST` (firebase-storage.ts).

##### `.env.example` / `.env.docker.example` / `.env`
- `.env.example` groups: NODE_ENV, PORT, FRONTEND_URL; DEV_AUTH_* and ENABLE_COMPATIBILITY_ROUTES; PUBLIC_UPLOAD_API_KEY; AGENT_TOKEN_ENCRYPTION_KEY; FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY / STORAGE_BUCKET; emulator hosts (commented: FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, FIREBASE_STORAGE_EMULATOR_HOST); GROBID_URL, CROSSREF_BASE_URL (+ optional MAILTO), OPENALEX_BASE_URL (+ optional MAILTO), SEMANTIC_SCHOLAR_API_KEY/BASE_URL; AI_PROVIDER/AI_API_KEY/AI_MODEL; CLOUDINARY_*; SEED_* (commented); GROBID_FULLTEXT_TIMEOUT_MS, GROBID_CONSOLIDATE_HEADER/CITATIONS, PDF_PROCESSING_ENABLED/CONCURRENCY/MAX_ATTEMPTS/MAX_BYTES.
- `.env.docker.example` - Docker-oriented variant (not read in detail; uses DOCKER_FIRESTORE_EMULATOR_HOST per README).
- `.env` exists in the working tree (gitignored).
- Note: `.env.example` says `FIREBASE_PRIVATE_KEY` may contain literal `\n` (code replaces `\\n` with newline).

##### `src/config/firebase.ts`
- Sets `dns` ipv4first and `GRPC_DNS_RESOLVER=native`.
- Default bucket: `FIREBASE_STORAGE_BUCKET` or `<projectId>.appspot.com`.
- Init precedence (only one app ever, `getApps()` guard):
  1. Env creds: `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` -> `cert()`.
  2. `./service-account.json` in CWD -> `cert()`.
  3. Otherwise `initializeApp({projectId})` (default creds / emulator mode).
- Exports `db` (Firestore; `ignoreUndefinedProperties: true`), `auth`, `storage`.

##### `src/config/firebase-storage.ts`
- `uploadToFirebaseStorage(buffer, folder, fileName, contentType='application/pdf')` -> saves to `<folder>/<fileName>`, `makePublic()` in prod, or builds an emulator URL (`http://localhost:<port>/v0/b/<bucket>/o/<path>?alt=media`) when `FIREBASE_STORAGE_EMULATOR_HOST` is set. Returns `{public_id, secure_url}` (same shape as Cloudinary).
- `deleteFromFirebaseStorage(path)` - ignores 404.
- Not used in the critical paths that were checked; Cloudinary is the primary asset store (see below). Verify usage via grep if needed.

##### `src/config/cloudinary.ts`
- Configures `cloudinary` v2 with `secure: true` when all three CLOUDINARY_* vars are set; otherwise logs a warning.
- `uploadToCloudinary(buffer, options)` -> `upload_stream`, `resource_type: 'auto'` default.
- `deleteFromCloudinary(publicId, {resource_type})` default `raw`.
- `createUploadSignature({folder, publicId, resourceType})` -> returns signature/timestamp/apiKey/cloudName/uploadUrl for direct client-to-Cloudinary upload (used by `/api/paper-fulltext/upload-signature`).

##### `src/config/logger.ts`
- pino; level: test -> `silent`, development -> `debug`, else `info`. `pino-pretty` transport only in development.

##### `src/config/openapi.ts`
- Builds `openApiDocument`: spreads `generated-openapi.json` then overrides `info`, `servers: [{url:'/api'}]`, 13 tags (Accounts & Access, Projects & Members, Protocol & Criteria, Literature Search, Papers & Full Text, AI Agents, Study Selection, Screening & Review, Data Extraction, Quality Assessment, Synthesis, Audit Logs, System).
- securitySchemes: `publicApiKey` (header X-API-Key), `bearerAuth` (Firebase ID token), `agentToken` (project-scoped agent token).
- Hand-written schemas: PaperImportResult, PdfProcessingTicket, ExtractionStatus.
- Hand-written path overrides (on top of generated): `/projects/from-osf-file`, `/paper-fulltext/upload-pdf`, `/paper-fulltext/upload`, `/paper-fulltext/{paperId}/extract-metadata`, `/projects/{projectId}/papers/{paperId}/pdf`, `/project/{projectId}/papers/{paperId}/pdf`, `/public/papers/upload-pdf` (10 MB limit documented).

##### `src/config/generated-openapi.json`
- Generated by `scripts/generate-openapi.ts` (run by `npm run generate:openapi` and automatically by `prebuild`). Do not hand-edit.
- Contains **324 path entries** (methods: get 182, post 136, delete 24, put 16, patch 10 operations).
- Generator method: regex-scans `src/routes.ts` for `router.use('<prefix>', <Identifier>)` and maps identifiers to `*.routes.ts` files via imports; then regex-scans each route file for `router|*Router.(get|post|...)('path'`. Adds tags via path-based `tagForPath()` heuristics, security (`/public/` -> publicApiKey, `/agent/v1/` -> agentToken, else bearerAuth), and generic responses (200/400/401/403/404). Special-cases `fulltext-markdown` (202/303/409) and `/agent/v1/tasks`.
- Limitation: regex-based; param-less summaries like "GET /{id}" appear for routers mounted at root; response shapes are generic.
- Served at `/api-docs.json` and as Swagger UI at `/api-docs`.

---

#### 4. Middleware (`src/middleware/*`)

| File | Export | Behavior |
|---|---|---|
| `auth.middleware.ts` | `requireAuth`, `getStoredGlobalRole` | See auth flow below |
| `role.middleware.ts` | `requireProjectRole(required)`, `normalizeProjectRole` | Project RBAC |
| `global-admin.middleware.ts` | `requireGlobalAdmin` | Requires `req.user.roles` includes `ADMIN`, else 403 |
| `public-api-key.middleware.ts` | `requirePublicApiKey` | `X-API-Key` header vs `PUBLIC_UPLOAD_API_KEY` (timingSafeEqual) |
| `upload.middleware.ts` | `upload` (50 MB), `paperImportUpload` (10 MB) | multer memoryStorage (Buffer, no disk writes) |
| `validation.middleware.ts` | `validate(zodSchema)` | Validates `{body, query, params}` with `parseAsync`; replaces req fields with parsed values |
| `error.middleware.ts` | `errorHandler` | Central error formatter (see Error format) |
| `agent-access` (module, not in middleware/) | `requireAgentToken` | Bearer `slrp_` project token (see Agent auth) |

##### Auth flow (`requireAuth`)
1. Requires `Authorization: Bearer <token>`. If missing:
   - If dev user available (`createDevUser()` only when `DEV_AUTH_ENABLED=true` and NODE_ENV != production) -> uses dev account `DEV_AUTH_EMAIL || 'admin'` login lookup from `modules/auth/dev-auth.ts`.
   - else 401 `UnauthorizedError('Missing or invalid Authorization header')`.
2. Dev token shortcut: if `DEV_AUTH_ENABLED` and token starts with `mock-` or `dev-`, the suffix is used as a dev UID (`findDevAuthAccountByUid`). Only active when dev auth enabled AND not production.
3. Otherwise `auth.verifyIdToken(token)` (Firebase ID token). Any failure -> 401 `Invalid or expired authentication token`.
4. Roles: start from `decodedToken.roles` (custom claim array). If `ADMIN` not present: honor `decodedToken.globalRole === 'ADMIN'` else look up Firestore `users/{uid}` (`globalRole` or `role` == ADMIN). Firestore profile is the source of truth; lookup failure defaults to USER.
5. Sets `req.user = {uid, email, displayName, roles}`.

Note: the dev-auth code is reachable from a production build code path but is guarded by `env.NODE_ENV === 'production'` checks at runtime, and `requireAuth` also refuses dev tokens when DEV_AUTH_ENABLED=false.

##### Roles
- Global roles (`req.user.roles`): `ADMIN` | (implicit USER). Source: Firebase custom claim `roles` or `globalRole`, or Firestore `users/{uid}.globalRole|role`.
- Project roles (`projects/{projectId}/members/{uid}.role`), normalized by `normalizeProjectRole`:
  - `OWNER` (also legacy `ADMIN` -> OWNER), `LECTURER`, `REVIEWER`. Unknown -> 403 "Project member has no recognized role".
- `requireProjectRole(required)` where `required` in `OWNER|LECTURER|REVIEWER|MEMBER`:
  1. Global ADMIN -> `req.projectContext = {projectId, role:'OWNER'}` (bypass).
  2. Requires `req.params.projectId` (else 404 "Project ID is required in URL").
  3. Project doc must exist (else 404).
  4. Member doc `projects/{projectId}/members/{uid}`; if missing, falls back to `projects.ownerId === uid` -> OWNER; else 403 "not a member".
  5. OWNER always allowed; `MEMBER` = any member; else role must match exactly. Mismatch -> 403 `Requires X role, but user is Y`.
  6. Sets `req.projectContext = {projectId, role}`.
- Hierarchy is flat: OWNER passes everything; LECTURER and REVIEWER do NOT imply each other (no REVIEWER < LECTURER ordering). Import endpoints per README need at least REVIEWER.
- `req.projectContext` type: `{projectId, role: 'OWNER'|'LECTURER'|'REVIEWER'}` (shared/types).

##### Global admin
- `requireGlobalAdmin` - checks `req.user.roles` contains `ADMIN` (403 `ForbiddenError('Only global admins can manage this resource')`). Used in admin routes (master-sources, agents, etc.).

##### Public API key
- `requirePublicApiKey`: requires `X-API-Key`; compares to `PUBLIC_UPLOAD_API_KEY` (from process.env or env) with length check + `timingSafeEqual`. Missing key -> 401 "A valid X-API-Key header is required"; wrong -> 401 "Invalid public API key". Used for `/api/public/papers/*` (documented in openapi as `publicApiKey`). If the env var is unset, every request is rejected.

##### Upload
- `upload` (multer memory, 50 MB) used for `/paper-fulltext/*` and `upload` routes; `paperImportUpload` (10 MB) for paper-import. `multer` errors (e.g. LIMIT_FILE_SIZE) fall through to the generic error handler -> 500 unless handled in the route (public API docs say 413 for >10 MB; verify whether handled).

##### Validation
- `validate(schema)` expects a zod object with optional `body`, `query`, `params` keys (`AnyZodObject`). On ZodError -> `BadRequestError('Validation error: [{path,message}...]', 'VALIDATION_ERROR')` (400). Other errors -> next(error).
- Schemas live per module as `*.schemas.ts` (e.g. `papers.schemas.ts`, `review-processes.schemas.ts`).

##### Error format (`error.middleware.ts` + `shared/errors/app-error.ts`)
Every error response:
```json
{ "success": false, "error": { "code": "<CODE>", "message": "<msg>" } }
```
- `AppError` subclasses -> their statusCode and code. Classes: `AppError(message, statusCode=500, code='INTERNAL_ERROR', isOperational=true)`, `NotFoundError` (404, NOT_FOUND), `UnauthorizedError` (401, UNAUTHORIZED), `ForbiddenError` (403, FORBIDDEN), `BadRequestError` (400, BAD_REQUEST), `ConflictError` (409, CONFLICT).
- Unknown errors -> 500 `INTERNAL_SERVER_ERROR`; message is the real `err.message` only when NODE_ENV=development (and adds `stack`), otherwise generic text.
- Every error is logged through pino with url/method/ip.
- Success envelope: `ApiResponse<T>` type in `shared/types/common.types.ts` is `{success, data?, error?}`; many controllers also return `isSuccess` (seen in openapi examples) - inconsistent. Do not assume one shape without checking the module.

---

#### 5. Shared (`src/shared/*`)

- `shared/errors/app-error.ts` - error classes listed above (`AppError` base with `statusCode`, `code`, `isOperational`).
- `shared/types/common.types.ts`:
  - `ApiResponse<T>` `{success, data?, error?: {code,message,details?}}`
  - `PaginationQuery {page?, limit?, cursor?}`
  - `PaginatedResult<T> {items, total?, nextCursor?, hasMore}`
  - `AuthenticatedUser {uid, email?, displayName?, roles?}`
  - `ProjectContext {projectId, role: 'OWNER'|'LECTURER'|'REVIEWER'}`
  - `AuthenticatedRequest extends express.Request {user?, projectContext?}`

---

#### 6. Firebase rules, indexes, emulators

##### `firestore.rules` (rules_version 2)
Helper functions: `isAuthenticated()`, `isGlobalAdmin()` (token.roles contains 'ADMIN'), `isProjectMember(projectId)` (member doc exists), `getProjectRole(projectId)`, `isProjectOwnerOrAdmin(projectId)` (role OWNER or ADMIN, or global admin).

Collections:
- `users/{userId}`: read = any signed-in user; write = self or global admin. Subcollection `notifications/{id}`: read/write = owner only.
- `projects/{projectId}`: read = member or global admin; create = global admin only; update/delete = owner/admin or global admin.
  - `projects/{projectId}/{document=**}`: read = member or global admin; **write = false** (all app writes go through backend Admin SDK, which bypasses rules).
  - `projects/{projectId}/auditLogs/{id}`: read = owner/admin; create = member; update/delete = false.

Implication: the client SDK cannot write any project subcollection; backend is the only writer. Rules are mainly defense for any direct client reads. Note there is no explicit rule for `agents/` or top-level collections other than users/projects (default deny applies to those).

##### `storage.rules`
- `projects/{projectId}/papers/{paperId}/{fileName}`: read and write = authenticated AND member of project (via `firestore.exists` on members doc).
- `projects/{projectId}/exports/{fileName}`: same.
- Default deny everywhere else. Note the paper PDF/Markdown primary store is Cloudinary, so these rules matter only for Firebase Storage paths (fallback/legacy `firebase-storage.ts`).

##### `firestore.indexes.json` (composite indexes)
1. `projects`: `memberUserIds` ARRAY_CONTAINS + `updatedAt` DESC.
2. `papers` (COLLECTION scope): `status` ASC + `createdAt` DESC.
3. `papers`: `isDuplicate` ASC + `createdAt` DESC.
4. `notifications`: `read` ASC + `createdAt` DESC.
5. `auditLogs`: `timestamp` DESC.
- fieldOverride on `members.userId`: single-field indexes in COLLECTION and COLLECTION_GROUP scopes (ASC/DESC).
- Deployed to production by CI/CD (`firebase deploy --only firestore:indexes`).

##### `firebase.json`
- firestore: rules `firestore.rules`, indexes `firestore.indexes.json`.
- storage: rules `storage.rules`.
- emulators: auth 9099, firestore **18080**, storage 9199, UI 4000 (UI enabled); all bound to 0.0.0.0; `singleProjectMode: false`.

##### Emulator setup
- Local: `npm run emulators` -> `scripts/start-emulators.js` (uses `.jdk21` bundled JDK, `.firebase-emulator-data` import/export).
- Docker: `Dockerfile.firebase-emulator` (node:22-bookworm-slim + openjdk-17-jre-headless, `firebase-tools@14`, runs `firebase emulators:start --import /data --export-on-exit /data`; expects firebase.json/rules/indexes mounted at /firebase).
- Emulator data persisted in `.firebase-emulator-data/` (auth_export, firestore_export, storage_export present; gitignored).
- Ports: Auth 9099, Firestore 18080 (non-default), Storage 9199, UI 4000.
- Backend connects via `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` / `FIREBASE_STORAGE_EMULATOR_HOST` env (set in .env or in CI). In Docker compose, backend sets `FIRESTORE_EMULATOR_HOST=firebase-emulator:18080`.

---

#### 7. Docker and deployment

##### `Dockerfile` (backend)
- Multi-stage on `node:22-alpine`.
  - builder: `npm ci` (all deps), copy `src` and `scripts`, `npm run build` (runs prebuild -> openapi generation, then tsc).
  - runner: `NODE_ENV=production`, `PORT=5000`, `npm ci --omit=dev`, copies `dist`, `EXPOSE 5000`, `CMD node dist/server.js`.
- Note: runtime image has no `service-account.json`; credentials come from env vars (FIREBASE_CLIENT_EMAIL/PRIVATE_KEY) or a mounted file (README suggests a docker-compose.override.yml mount).

##### `Dockerfile.firebase-emulator`
See emulator section. Exposes 4000, 9099, 9199, 18080.

##### `docker-compose.yml`
Services:
1. `grobid` - image `grobid/grobid:0.9.1-crf`, port 8070, healthcheck `/api/isalive`, needs ~4 GB RAM for full-text.
2. `firebase-emulator` - built from `Dockerfile.firebase-emulator`; ports 4000/9099/18080/9199; mounts `.firebase-emulator-data`, firebase.json, rules, indexes. Env `FIREBASE_PROJECT_ID` default `systematic-literature-re-52b46`.
3. `slr-backend` - built from `Dockerfile`, port 5000:5000, `env_file: .env`, sets `NODE_ENV` default production, `GROBID_URL=http://grobid:8070`, `GROBID_FULLTEXT_TIMEOUT_MS` default 180000, `FIRESTORE_EMULATOR_HOST=firebase-emulator:18080` (overrides host value; README says this is cleared unless DOCKER_FIRESTORE_EMULATOR_HOST is used). Depends on grobid healthy.
- Note: `slr-backend` in compose hard-sets FIRESTORE_EMULATOR_HOST to the emulator container, so compose always points at the emulator unless edited. Verify before using compose for production.

##### GitHub Actions
`.github/workflows/ci.yml` - name "CI Backend (dev)":
- Triggers: push and PR on `dev`, manual dispatch. Concurrency cancels in-progress runs per ref.
- Job `test` (ubuntu-latest, Node 22, npm cache):
  1. `npm ci`
  2. `npm run typecheck`
  3. Setup Java temurin 21
  4. `npx firebase-tools emulators:exec --project slr-system-dev --only auth,firestore "npm test"` with env: CI=true, NODE_ENV=test, FIREBASE_PROJECT_ID=slr-system-dev, FIRESTORE_EMULATOR_HOST=127.0.0.1:18080, FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099, and a hard-coded `PUBLIC_UPLOAD_API_KEY` value in the workflow file (test value committed to repo - see Gotchas).
  5. `npm run build`
- Job `docker-build-check` (needs test): docker buildx build with push false, GHA cache.

`.github/workflows/deploy.yml` - name "CI/CD Build & Deploy Backend (Docker & GHCR)":
- Trigger: push to `main`.
- Job `build-and-push`: buildx, login to ghcr.io with GITHUB_TOKEN, tags `latest` and `sha`, pushes `ghcr.io/<repo>`.
- Job `deploy` (needs build-and-push, only on main): SSH to server via `appleboy/ssh-action` using secrets SERVER_HOST, SERVER_USERNAME, SERVER_PASSWORD (password auth), SERVER_PORT (default 22), SERVER_PROJECT_PATH (default `~/slr-be`). Script: `git pull origin main`; runs `firebase-tools@14.23.0 deploy --only firestore:indexes --project systematic-literature-re-52b46` inside `node:22-alpine` using `service-account.json` in the repo dir; docker login to GHCR; `docker compose pull` and `up -d --remove-orphans`; `docker image prune -f`.
- Note: deploy only pushes Firestore indexes (NOT rules or storage rules) to production.
- Branch model: CI on `dev`, deploy on `main`.

---

#### 8. Scripts folder and seeding

##### `scripts/`
- `generate-openapi.ts` (118 lines) - see generated-openapi section.
- `start-emulators.js` - local emulator launcher (see above).
- `smoke-grobid-fulltext.mjs` - manual smoke test: runs `GrobidService.processFulltext(pdf)` + TEI parse + markdown render against a running GROBID; no Cloudinary upload. Usage: `node --import tsx scripts/smoke-grobid-fulltext.mjs path/to/paper.pdf`.
- `test_fs.mjs` - ad hoc Firestore query probe (`projects where memberUserIds array-contains 'admin_user'`); debugging script, not a test.

##### `src/scripts/` (run via tsx, not compiled into dist; NOT in tsconfig rootDir? they are under src so they compile with tsc)
- `seed.ts` (~1600 lines) - `export async function seedDatabase()`. Creates Firebase Auth users and Firestore data for UI testing (users: `admin_user` ADMIN, `leader_user`, `reviewer_user`, `reviewer_test_1..5`, etc.; project, members, protocol, search sources, papers, decisions, audit logs, notifications, checklist templates "PRISMA 2020 & Kitchenham"). Refuses to run unless `SEED_ADMIN_PASSWORD` and `SEED_REVIEWER_PASSWORD` are set. Runs directly when `process.argv[1]` includes "seed". Documented in `docs/SEED_DATA_GUIDE.md` (638 lines, Vietnamese; includes a revert procedure).
- `seed-test-reviewers.ts` - ensures reviewer_test_1..5 Auth users exist and adds them as members to a project; takes project ID as argv[2] (default is a hard-coded project id). Prints JSON summary.
- `migrate-paper-assets.ts` - migrates legacy papers (Firestore bibliography and PDFs from Cloudinary or Firebase Storage) to the new Cloudinary asset model. Modes: dry-run by default, `--apply`, `--backfill-fulltext` (queues GROBID for PDFs whose Markdown lacks full text via `enqueuePdfProcessing`). Exit code 1 if any failed. Used via `npm run migrate:paper-assets [-- --apply] [-- --backfill-fulltext]`.

---

#### 9. Tests (`tests/`)

- Framework: Vitest 5 with globals, shim at `tests/vitest-shim.ts`; `maxWorkers: 1`.
- Run: `npm test` (= `vitest run`). CI runs it inside Firebase emulators (auth + firestore) via `npx firebase-tools emulators:exec`. Local: start emulators (`npm run emulators`) and set `FIRESTORE_EMULATOR_HOST=127.0.0.1:18080`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `FIREBASE_PROJECT_ID`, and `PUBLIC_UPLOAD_API_KEY` (>=16 chars) before `npm test`. Some tests are pure unit tests, some use supertest against `createApp()`.
- Files (28 test files + `vitest-shim.ts` + `fixtures/grobid-fulltext.tei.xml`), ~104 `it/test` cases, ~2300 lines total. Per file (case counts approx.):
  - `auth-guard.test.ts` (3) - auth middleware; references ENABLE_COMPATIBILITY_ROUTES.
  - `core-governance.test.ts` (1) - supertest on `createApp`.
  - `agent-access.test.ts` (5) - agent token encryption/access.
  - `deduplication.test.ts` (8), `extraction-status.test.ts` (5), `fulltext-markdown-endpoint.test.ts` (3), `grobid.http.test.ts` (1, local http server), `grobid.service.test.ts` (5), `osf-registration.parser.test.ts` (2), `paper-assets.test.ts` (6), `paper-cloud-storage.test.ts` (2), `paper-import.test.ts` (4), `paper-markdown.test.ts` (5), `paper-pool.test.ts` (3), `pdf-processing.service.test.ts` (3), `pdf-processing.worker.test.ts` (12), `prisma.test.ts` (1), `project-membership.test.ts` (2), `projects.test.ts` (2), `public-paper-import.test.ts` (11; supertest, API key), `review-processes.test.ts` (3), `study-selection-checklist-template.test.ts` (2), `study-selection.test.ts` (4), `tei-parser.test.ts` (11).
- Pattern: test file name = feature area; imports the module's service/schema directly (`../src/modules/<x>/<x>.service.js`) or `createApp` for HTTP tests.
- Tests are excluded from `tsc` (tsconfig exclude), so type errors in tests are not caught by `npm run typecheck`.

---

#### 10. Docs folder and README

##### `README.md` (252 lines)
Sections: features/philosophy (Firestore-native, Zod, RBAC via custom claims + members, live PRISMA via `count()`, AI/GROBID/Semantic Scholar); project structure diagram (says `backend/` - outdated folder name); install and env; dev auth block; public PDF upload API (`X-API-Key`, 10 MB); OSF registration import (`POST /api/projects/from-osf-file`); PDF paper storage naming `[<projectId>][<name>][<UTC timestamp>].pdf/.md`; PDF processing status model (`pdf.processingStatus` PENDING/PROCESSING/COMPLETED/FAILED; `pdf.fullText.status` COMPLETED/PARTIAL); fulltext-markdown endpoint (202 Retry-After 10 / 303 / 409); Firestore paper docs keep only workflow state + asset refs (bibliography in Cloudinary Markdown); external AI agent access tables; paper discovery/import (Crossref/OpenAlex); Architecture & migration pointers to docs.

##### `docs/` (14 files)
| File | Lines | Content (from headings) |
|---|---|---|
| `AI_AGENT_TASK_API_CONTRACT.md` | 184 | External agent API: base URL/auth (`slrp_` project tokens), list tasks (pagination), get task, markdown, submit result, HTTP errors, recommended workflow |
| `API_DESIGN.md` | 103 | Base URL, response format, endpoint summary by area (auth, projects, review/study-selection compat, members, protocol, papers, dedup, ...) |
| `API_MAPPING_GATE0.md` | 87 | Vietnamese. Migration table mapping 33 frontend services to canonical URLs; envelope and error format |
| `DOMAIN_MODEL.md` | 107 | Domains: IAM, project/protocol, search & identification, dedup, study selection, QA, extraction, synthesis, PRISMA |
| `FIRESTORE_DATA_MODEL.md` | 84 | Global `users`; project collections: projects, members, protocol, searchSources, importBatches, papers, reviewProcessPapers, screeningDecisions, ... |
| `MIGRATION_MAPPING.md` | 19 | Short old->new mapping |
| `OLD_SYSTEM_ANALYSIS.md` | 75 | Analysis of the previous C#/ASP.NET Core/EF Core system: architecture, modules, entities, workflows, tech debt, features to keep/redesign |
| `ROLE_MODEL.md` | 23 | Project roles (OWNER/LECTURER/REVIEWER) and existing data |
| `SECURITY_MODEL.md` | 28 | Authentication, RBAC (global claims, project roles), storage security |
| `SEED_DATA_GUIDE.md` | 638 | Vietnamese. Seed/revert guide with per-collection schemas and seeding order |
| `SYSTEM_DOCUMENTATION.md` | 77 | Vietnamese. System overview; front-end (slr-fe) and back-end (slr-be) architecture, domains, workflows |
| `SYSTEM_FEATURES_AND_FLOWS.md` | 179 | Vietnamese. Architecture, RBAC (global and project roles), features by phase/module (auth, protocol, identification, dedup, screening, QA, ...) |
| `software-requirements-specification.md` | 709 | Vietnamese SRS: purpose, scope, product description, requirements |

Note: docs are mostly Vietnamese; API_DESIGN/ROLE_MODEL/SECURITY_MODEL are shorter English.

##### `feature_list.json` (6 entries, all status `passing-unverified`)
| id | title | priority | notes |
|---|---|---|---|
| phase-00-contract-and-migration-decisions | Contract and Migration Decisions (Gate 0) | P1 | canonical URLs, envelope, 33-service mapping (docs/API_MAPPING_GATE0.md) |
| phase-01-foundation-and-governance | Foundation and Project Governance | P1 | canonical roles, SignalR removed, project-centric routes, membership API |
| phase-02a-human-screening | Human Screening & Double-Blind Workflow | P1 | double-blind transaction, peer-hiding decisions, resolveConflict |
| phase-02b-ai-and-grobid-assistance | AI & GROBID Assistance | P2 | GROBID header parser; Gemini screener with confidence |
| phase-03-qa-and-data-extraction | Quality Assessment & Data Extraction Grid | P1 | dynamic QA scoring, extraction grid with autosave + CSV export |
| phase-04-synthesis-prisma-and-polish | Synthesis, PRISMA Report & Production Polish | P1 | live PRISMA + snapshot APIs; `compatibility.routes.ts` says "completely deleted" |

All statuses are "passing-unverified" (self-reported in "fast mode"); verification commands are `npm run typecheck && npm test`, `npm test screening`, and manual checks. NOTE: feature_list says compatibility.routes.ts was deleted, but `modules/compatibility/phase-compatibility.routes.ts` still exists and is mounted in routes.ts.

---

#### 11. Code conventions (observed)

- ESM TypeScript, Node 22, `.js` extensions in relative imports (NodeNext).
- Module layout under `src/modules/<feature>/`:
  - `<feature>.routes.ts` - Express `Router()`; applies `requireAuth` and `requireProjectRole('...')` per route or via `router.use`; `validate(<schema>)` for body/query.
  - `<feature>.controller.ts` - class with arrow-function handlers (e.g. `new PapersController()`), instantiated in routes.ts.
  - `<feature>.service.ts` - business logic and Firestore access via `db` from `config/firebase.ts`.
  - `<feature>.schemas.ts` - zod schemas (sometimes `.types.ts` for TS types, `.util.ts` / `*-parser.ts` for helpers).
  - Some modules have no separate schema/service (e.g. upload, audit: routes + controller/service only; agent-access: single routes file).
- Naming: kebab-case file names with dotted suffixes (`papers.service.ts`, `candidate-papers.routes.ts`); classes PascalCase; route constants camelCase.
- Errors: throw `AppError` subclasses (or call `next(new XError(...))` in middleware); never send error responses manually except in a few controllers.
- Validation: zod (`zod@3`) via `validate()` middleware; env validation via zod.
- Auth: `req.user` / `req.projectContext` typed by `AuthenticatedRequest`.
- Firestore paths: `projects/{projectId}/{members|papers|protocol|...}`, global `users`, `agents/{agentId}/projectAccess/{accessId}`.
- Route params: `:projectId` consistently for project scope; some legacy routes use `:processId` with `rp_`/`sp_` prefix stripping.
- Logging: pino `logger.info({...}, 'msg')` object-first style.
- Tests live in top-level `tests/` (not colocated), named `<feature>.test.ts`.
- No ESLint/Prettier configs in repo.

---

#### 12. Gotchas / findings worth knowing

1. **`ENABLE_COMPATIBILITY_ROUTES` is not enforced.** It is parsed in `config/env.ts` (default false) but `modules/compatibility/phase-compatibility.routes.ts` is mounted unconditionally in `routes.ts` (`router.use(phaseCompatibilityRoutes)`). The README tells operators to keep it false in production, which therefore has no effect on routing.
2. **`helmet` is imported in `app.ts` but never applied** (no `app.use(helmet())`). No security headers are set by default.
3. **Hard-coded test API key in CI.** `.github/workflows/ci.yml` sets `PUBLIC_UPLOAD_API_KEY` to a literal value in the workflow file (committed). It is a test value, but it is in version control; rotate or move to secrets if the same value is used anywhere real.
4. **Firebase project IDs are inconsistent** across config: `.firebaserc` -> `hyperdatalab-slr`; `env.ts` default -> `slr-system-dev`; CI -> `slr-system-dev`; deploy and docker-compose defaults -> `systematic-literature-re-52b46`; `scripts/start-emulators.js` default -> `systematic-literature-re-52b46`.
5. **Deploy only pushes Firestore indexes**, not `firestore.rules` or `storage.rules`. Rules changes must be deployed another way.
6. **`docker-compose.yml` hard-sets `FIRESTORE_EMULATOR_HOST`** on `slr-backend`, so the backend container always targets the emulator container unless the compose file is edited.
7. **Build regenerates OpenAPI.** `prebuild` runs `generate-openapi.ts`, which rewrites `src/config/generated-openapi.json` (repo currently shows it modified in git status). Expect diffs after `npm run build`.
8. **Typecheck and lint are the same command** (`tsc --noEmit`); tests are excluded from tsconfig, so the test suite is not type-checked.
9. **Public upload 10 MB limit** is enforced by multer (`paperImportUpload`), but no code maps multer's LIMIT_FILE_SIZE to 413 (grep verified). An oversize file therefore falls through to the generic error handler (500), while openapi.ts documents 413.
10. **Role model is flat**: OWNER bypasses all project-role checks; LECTURER and REVIEWER are not hierarchical. Global ADMIN is treated as OWNER in every project (`requireProjectRole`).
11. **Global ADMIN detection** is re-read from Firestore `users/{uid}` on each request when the token lacks the claim (extra read per request).
12. **Dev auth tokens** `mock-*` / `dev-*` are only honored when `DEV_AUTH_ENABLED=true`; production guard relies on `NODE_ENV` checks in several places (auth.middleware, auth.service).
13. **`paper-statistics.routes.ts`** exists in `modules/papers/` and is not imported anywhere in `src` (unmounted). `review-needs.routes.ts` is imported in routes.ts but never mounted.
14. **Duplicate mounts**: `/api/candidate-papers` and `/api/study-selection` each mounted twice; `/api/papers` has several routers; ordering matters.
15. **Firebase Storage paths** (`firebase-storage.ts`, `storage.rules`) are secondary: primary paper PDFs/Markdown are on Cloudinary (see README); legacy PDFs may still be on Storage (migrate-paper-assets reads them).
16. **`.env` file is present in the working tree** (gitignored) and `service-account.json` is expected in the CWD or provided via env. Never commit either.
17. `feature_list.json` claims compatibility routes were deleted; they still exist (see 1).
18. `dist/` is present in the working tree (build output, gitignored).

---

#### 13. Quick "how to run" cheat sheet

- Install: `npm ci` (or `npm install`).
- Local backend with emulators: `npm run emulators` (terminal 1), then `npm run dev` (terminal 2). Set `.env` with `FIRESTORE_EMULATOR_HOST=127.0.0.1:18080`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199`, `DEV_AUTH_ENABLED=true`, `NODE_ENV=development` for dev login.
- Seed: set `SEED_ADMIN_PASSWORD` and `SEED_REVIEWER_PASSWORD` (>=12 chars), then `npm run seed`.
- Tests: `npm test` (emulators must be running with `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` set and `PUBLIC_UPLOAD_API_KEY` set; `CI=true` optional).
- Typecheck: `npm run typecheck`. Build: `npm run build` then `npm start`.
- Docs UI: `http://localhost:5000/api-docs` (or `/api-docs.json`).
- Docker: `docker compose up -d` (needs `.env`; grobid + firebase-emulator + backend on 5000).
- Health: `GET /api/health`.

## Phụ lục B: slr-be modules (agent-access → master-sources)



Conventions used below:
- "requireAuth" = `middleware/auth.middleware.ts`. Missing Bearer header falls back to the dev account when `DEV_AUTH_ENABLED` and not production. Tokens prefixed `dev-`/`mock-` are accepted in dev. Otherwise `auth.verifyIdToken`. Global ADMIN comes from the token's `roles`/`globalRole` claim, or `users/{uid}.globalRole` in Firestore.
- "requireProjectRole(R)" = `middleware/role.middleware.ts`. Global ADMIN is OWNER everywhere. Otherwise it reads `projects/{id}/members/{uid}`, or `project.ownerId`. OWNER passes everything. `MEMBER` passes any member. Any other `R` requires the member's role to equal `R` exactly. So LECTURER does NOT pass a REVIEWER gate and REVIEWER does not pass a LECTURER gate.
- "requireGlobalAdmin" = `middleware/global-admin.middleware.ts`, which checks `req.user.roles` includes `ADMIN`.
- Response envelope is usually `{success, isSuccess, data, message, errors}`. The `errors` field is `[]` or `null` depending on the module.

---

#### 1. agent-access

**Purpose:** Catalog of external "agents" (API clients, e.g. screening bots). A project owner connects an agent to a project and gets a project-scoped bearer token. The agent then pulls assigned paper tasks and submits decisions through `/api/agent/v1`.

**Files:**
- `src/modules/agent-access/agent-access.routes.ts` (490 lines, the only file). It holds routers, crypto helpers, the token middleware, and all handlers inline.

**Mounts (routes.ts):** `/admin/agents`, `/agent/v1`, `/projects/:projectId/agents`.

**Endpoints (full paths):**

Admin catalog (`requireAuth` + `requireGlobalAdmin`):
- `GET /api/admin/agents/` : list all agents (public view, no token material), sorted by createdAt desc.
- `POST /api/admin/agents/` : body `{name (1-120), description (0-1000, default '')}` strict. Creates `agents/{id}`, `isActive: true`. Returns 201.
- `PATCH /api/admin/agents/:agentId` : body `{name?, description?, isActive?}` strict, at least one key. Disabling here kills every project connection for that agent.

Project-scoped (`requireAuth` + `requireProjectRole('OWNER')`):
- `GET /api/projects/:projectId/agents/` : every catalog agent plus its access record for this project, or null.
- `GET /api/projects/:projectId/agents/tasks?paperIds=a,b,c` : tasks across all agents for up to 30 paperIds (each agent query capped at 100). Adds `agentName`.
- `POST /api/projects/:projectId/agents/` : body `{agentId}`. Connects the agent. Returns `{access, accessToken}` with 201. The raw token is shown only here and on rotate.
- `GET /api/projects/:projectId/agents/:agentId/token` : decrypts and returns the current token. `Cache-Control: no-store`.
- `POST /api/projects/:projectId/agents/:agentId/rotate-token` : issues a new token, invalidates the old one.
- `PATCH /api/projects/:projectId/agents/:agentId` : body `{isActive: boolean}` strict. Disables or enables this project's access only.
- `GET /api/projects/:projectId/agents/:agentId/tasks` : paged list of tasks for that agent in that project. Query `limit` (1-100, default 50), `cursor` (a taskId).
- `POST /api/projects/:projectId/agents/:agentId/tasks` : body `{paperId (1-160), instructions (0-5000, default '')}` strict. Requires `access.isActive`. Creates `agents/{agentId}/tasks/{id}`, `status: 'ASSIGNED'`.
- `DELETE /api/projects/:projectId/agents/:agentId/tasks/:taskId` : 204.

External agent (`requireAgentToken`, see auth below):
- `GET /api/agent/v1/tasks` : paged tasks for the token's project (`limit`, `cursor`), hydrated with project info, protocol criteria, and per-paper metadata. Each item has `markdownPath: /api/agent/v1/tasks/{id}/markdown`.
- `GET /api/agent/v1/tasks/:taskId` : one task with project, paper, and protocol.
- `GET /api/agent/v1/tasks/:taskId/markdown` : full-text Markdown fetched from Cloudinary raw asset. Returns 202 with `Retry-After: 10` while PENDING/PROCESSING. Returns 409 `FULLTEXT_UNAVAILABLE` unless `processingStatus === 'COMPLETED'`. Also requires `metadataFile.publicId` to start with `slr-system/projects/{projectId}/papers/`. Max 20 MB. Returns `text/markdown`.
- `POST /api/agent/v1/tasks/:taskId/result` : body `{decision (1-100 chars), reasoning (1-16000), data?: record}` strict. Result JSON must be at most 30000 bytes. Transaction: 409 if already COMPLETED. Sets `status: 'COMPLETED'`, `completedAt`.

**Auth for agent tokens (`requireAgentToken`):**
- Header: `Authorization: Bearer slrp_<agentId 20 alnum>.<accessId 64 hex>.<secret 43 base64url>`.
- `accessId = sha256(projectId)`, so the access doc id is deterministic per project.
- Lookup `agents/{agentId}` and `agents/{agentId}/projectAccess/{accessId}`. Requires both `isActive`. Compares `sha256(fullToken)` to `access.tokenHash` with timingSafeEqual.
- Sets `req.agent`, `req.projectAccess`. Scoped reads check `task.projectId === access.projectId`, otherwise 404.
- Legacy `tokenHash` on the agent doc is ignored (see the `hasLegacyToken` flag in the public view).

**Firestore:**
- `agents/{agentId}` : `{id, name, description, isActive, tokenHash?(legacy), tokenCiphertext?(legacy), createdAt, updatedAt, createdBy}`
- `agents/{agentId}/projectAccess/{sha256(projectId)}` : `{id, agentId, projectId, projectName, isActive, tokenHash, tokenCiphertext, createdAt, updatedAt, createdBy}`
- `agents/{agentId}/tasks/{taskId}` : `{id, agentId, projectId, paperId, paperTitle, projectName, instructions, status ('ASSIGNED'|'COMPLETED'), createdAt, createdBy, completedAt?, result?: {decision, reasoning, data?}}`
- Read-only from this module: `projects/{id}` (name/title, researchQuestions, inclusion/exclusionCriteria fallback), `projects/{id}/protocol/main`, `projects/{id}/papers/{paperId}` (title, abstract, authors, doi, year, journal, source, pdf.processingStatus, pdf.fullText, pdf.storagePath, metadataFile.publicId).

**Models / validation:** Zod schemas above (`createAgentSchema`, `updateAgentSchema`, `connectAgentSchema` with agentId without `/`, `updateAccessSchema`, `createTaskSchema`, `submitResultSchema`). Enum for task status: `ASSIGNED | COMPLETED`. Token format regex `^Bearer (slrp_([A-Za-z0-9]{20})\.([a-f0-9]{64})\.([A-Za-z0-9_-]{43}))$`.

**Crypto / business rules:**
- Token is stored as `sha256` hash, plus `tokenCiphertext` = AES-256-GCM, format `v1.<iv>.<tag>.<ct>`. AAD for encryption is `agentId:accessId`. Key from env `AGENT_TOKEN_ENCRYPTION_KEY` (32 bytes, base64url 43 chars or hex 64). If missing or invalid, decrypt/encrypt throws 503 `AGENT_TOKEN_KEY_REQUIRED`.
- Connect is a one-per-project operation. It uses `create()`, which fails with code 6 (ALREADY_EXISTS) mapped to 409.
- A disabled agent in the catalog (`isActive: false`) cannot be connected (409). An agent can be disabled globally or per project.
- A task can be created only if the project and paper both exist.
- Task result is single-shot (409 on second submit).

**External calls:** Cloudinary (`cloudinary.url(publicId, {resource_type:'raw'})`) and an axios GET of that URL to fetch Markdown.

**TODOs / gaps:**
- `GET /api/projects/:projectId/agents/` loops every agent doc and does an extra read each. N+1, fine at small scale.
- `GET /tasks?paperIds=` also loops all agents, one query each.
- No `DELETE` for agents in the catalog. Only tasks can be deleted.
- `sha256` for token hashes without a salt. Safe here because tokens are 256-bit random, but noted.
- `listTasks` project-scoped filter uses `where('projectId','==')` with no `orderBy`, so pagination order is not guaranteed. Unscoped path orders by createdAt.
- `resSetNoStore` is a helper, not a middleware. Declared at the bottom, which works because it is hoisted.

---

#### 2. ai (screening assist)

**Purpose:** Gemini-backed screening recommendation (INCLUDE / EXCLUDE / UNCERTAIN) for one paper against the project protocol. The AI setup, PICOC and RQ generation live in module 3.

**Files:** `ai.routes.ts`, `ai.controller.ts`, `ai.service.ts` (197 lines).

**Mount:** `/projects/:projectId/ai`.

**Endpoints:**
- `GET /api/projects/:projectId/ai/papers/:paperId/screen-assist` : `requireAuth` + `requireProjectRole('REVIEWER')`. So OWNER and REVIEWER members (and global ADMIN) pass. LECTURER is forbidden. Returns `{success, data: AIScreeningRecommendation}`.

**Models:**
- `AIScreeningRecommendation = {decision: 'INCLUDE'|'EXCLUDE'|'UNCERTAIN', confidence: number, reasoning: string}`. Not validated. The raw Gemini JSON is returned as-is, so confidence is not clamped to 0..1.
- Input: paper `{title, abstract}` from `PapersService.getPaper`. Protocol `{researchQuestions[].question, inclusionCriteria[].description, exclusionCriteria[].description}` from `ProtocolService.getProtocol`.

**Business rules / fallbacks (all return HTTP 200):**
- No `AI_API_KEY`: `{UNCERTAIN, 0.5, "AI API key not configured..."}`.
- Provider other than `gemini`: `{UNCERTAIN, 0.5, "AI provider X not fully configured."}`. Only gemini is implemented, even though the env enum also allows `openai | groq | openrouter`.
- Any error (network, parse, missing candidates): `{UNCERTAIN, 0.0, "AI service call failed."}` and logs via `logger.error({err})`.
- Gemini call: `POST https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}` with `responseMimeType: application/json`. Model default `gemini-1.5-flash`.

**Env:** `AI_PROVIDER` (enum gemini|openai|groq|openrouter, default gemini), `AI_API_KEY` (optional), `AI_MODEL` (default `gemini-1.5-flash`).

**Security note:** the API key is put in the query string. Any axios error that is logged with `{err}` includes the request URL, so the key can end up in logs. Consider moving it to the `x-goog-api-key` header.

**Firestore:** none written. Reads via the papers and protocol services.

**TODOs / gaps:**
- `generateJson` (private, used by ai-setup) and `getScreeningRecommendation` each duplicate the Gemini call. There is no shared client.
- `analyzeTopic`, `generatePicoc`, `generateRqs` are in the same class (see module 3).
- No retry, timeout, or response schema validation.

---

#### 3. ai-setup

**Purpose:** Project AI configuration. Stores research topic, objective, domain, language, PICOC and final RQs. Syncs them into the project and protocol docs. Also exposes three LLM helpers (topic analysis, PICOC, RQs) that call the shared AI service.

**Files:** `ai-setup.routes.ts`, `ai-setup.controller.ts` (84 lines), `ai-setup.service.ts` (128 lines).

**Mount:** `/projects/:projectId/ai-setup`.

**Endpoints (all `requireAuth`):**
- `GET /api/projects/:projectId/ai-setup/setup-details` : `requireProjectRole('MEMBER')`. Merges saved `aiSetup/details` with fallbacks from project and protocol. Returns `{researchTopic, researchObjective, domain, language (default 'English'), picoc{population,intervention,comparator,outcome,context}, researchQuestions[{id, questionText}], isConfigured (bool AI_API_KEY set), provider, model, activeFeatures}`. `activeFeatures` = `['ScreeningAssistance','DataExtraction','SummarySynthesis']` when a key is set, else `[]`. Only ScreeningAssistance is actually routed.
- `PUT /api/projects/:projectId/ai-setup/setup-details` : `requireProjectRole('OWNER')`. Body `{researchTopic, researchObjective, domain, language, picoc{...}, finalResearchQuestions[{id?, questionText}]}`. Not validated by Zod. Returns message "Setup details updated successfully".
- `POST /api/projects/:projectId/ai-setup/analyze-topic` : OWNER. Body `{topic, language?}`. Returns `{objectives, domain}`.
- `POST /api/projects/:projectId/ai-setup/generate-picoc` : OWNER. Body `{topic, objectives, domain, language?}`. Returns `{population, intervention, comparator, outcome, context}`.
- `POST /api/projects/:projectId/ai-setup/generate-rqs` : OWNER. Body `{topic, objectives, domain, language?, picoc}`. Returns `{suggestedQuestions: string[]}` (3-5 items, prompted as "RQ1: ...").

All helper endpoints return 200 with a canned fallback when there is no key, the provider is not gemini, or the call fails. The client cannot tell the difference, because there is no `source` flag.

**Firestore writes (`updateSetup`, one batch):**
1. `projects/{id}/aiSetup/details` (merge): `{researchTopic, researchObjective, domain, language, picoc{...}, researchQuestions[{id, questionText}], updatedAt}`.
2. `projects/{id}` (update): `description = researchObjective`, `domain`, `updatedAt`. Note: `batch.update` fails if the project doc does not exist.
3. `projects/{id}/protocol/main` (merge): `pico{population[], intervention[], comparison[], outcome[], context[]}` (each a 1-element array, or empty), `researchQuestions[{id, code: 'RQn', question, rationale: ''}]`, `updatedAt`.

**Firestore reads:** `projects/{id}/aiSetup/details`, `projects/{id}`, `projects/{id}/protocol/main`.

**Important inconsistency:** RQs are stored in three places: `aiSetup/details.researchQuestions`, `protocol/main.researchQuestions` (overwritten with `rationale: ''`, so any rationale is lost), and the root `researchQuestions` collection managed by core-governance (module 5). The ai-setup PUT does not touch the root collection.

**Config shown to client:** `provider` and `model` from env. The key is never returned.

**TODOs / gaps:**
- `updateSetup` does no validation. Missing `picoc` is coerced to empty strings. Missing `finalResearchQuestions` writes `[]` and erases the protocol RQs.
- `activeFeatures` advertises DataExtraction and SummarySynthesis although those are not gated by AI.

---

#### 4. audit

**Purpose:** Read-only audit log viewer. An admin view across all projects, and a per-project view.

**Files:** `audit.routes.ts` (13), `audit.controller.ts` (80), `audit.service.ts` (303).

**Mounts:** `/auditlog` and `/audit-logs`. Both mount the same router. Full paths are `/api/auditlog/...` and `/api/audit-logs/...`.

**Endpoints:**
- `GET /api/auditlog/admin` : `requireAuth` only. There is NO `requireGlobalAdmin` check. Any authenticated user can read all audit logs. Query: `pageNumber` (default 1), `pageSize` (default 8), `search` (matches user, action, resourceType, resourceId, ipAddress), `user` (exact match, `all` ignored), `actionType` (case-insensitive, `all` ignored), `status` (case-insensitive, `all` ignored), `startDate` / `endDate` (inclusive, day added to end). Returns `{items, pageNumber, pageSize, totalCount, totalPages}`.
- `GET /api/auditlog/project-leader/:projectId` : `requireAuth` only. No project membership check. Reads `projects/{id}/auditLogs`. If empty, falls back to root `auditLogs where projectId ==`. Same query params and response.

**Models:**
- `AuditLogEntry = {id, timestamp (ISO), user, action, actionType, resourceType, resourceId, status, ipAddress, userAgent, importance ('normal'|'high'), oldValue, newValue, projectId?, userId?, metadata?}`.
- `AuditLogStatus = 'Success' | 'Failed'`.
- `AuditLogActionType = 'create'|'update'|'delete'|'export'|'access'|'review'|'system'`.
- `inferActionType(action)` keyword heuristic: create/add/import → create; delete/remove → delete; export/download → export; review/screen/vote → review; access/login/view → access; system/cron/sync → system; otherwise update.

**Firestore:** reads `auditLogs` (root, full collection scan in memory), `projects/{id}/auditLogs`. Writes exist only in `AuditService.log(projectId, userId, action, entityType, entityId, metadata)`, which writes both root `auditLogs/{id}` and `projects/{id}/auditLogs/{id}`.

**Business rules / gaps:**
- `AuditService.log` has NO callers outside the audit module (grep confirmed). In the running app nothing writes audit entries, so the collections are only populated by seed scripts or manually.
- `log()` hardcodes `ipAddress: '::1'`, `userAgent: 'System Internal'`, `importance: 'normal'`, `oldValue: null`, and `status: 'Success'`. It stores the whole `metadata` twice (as `newValue` and `metadata`).
- `getAdminAuditLogs` returns 4 hard-coded fake entries (seeded admin@slr.local, reviewer@slr.local, project "AI-assisted Software Engineering") when the collection is empty. These are shown as real data in the UI.
- `listProjectLogs(projectId, limit)` exists but is unused.
- Full collection scan on every request. No Firestore-side pagination or filtering.
- Missing role check on the admin route (see endpoints). This is a likely security bug.

---

#### 5. auth

**Purpose:** Login and profile bootstrap. Two modes: Firebase ID token (production, Google sign-in) and a dev-only username/password shortcut.

**Files:** `auth.routes.ts` (13), `auth.controller.ts` (86), `auth.service.ts` (166), `dev-auth.ts` (87).

**Mount:** `/auth`.

**Endpoints (full paths under `/api/auth`):**
- `POST /api/auth/login` : no auth. Body `{keyLogin, password?}`. DEV ONLY: fails with 401 unless `DEV_AUTH_ENABLED` and `NODE_ENV !== 'production'`. Matches `keyLogin` against the account email or aliases (case-insensitive). If the account has a password, it must match. Returns `{userId, username, email, accessToken: 'dev-<uid>', accessTokenExpiresAt (+7 days), role}`.
- `POST /api/auth/dev/quick-login` : no auth. Body `{keyLogin | role | login | email}` (default `'admin'`). DEV ONLY. No password. Returns same shape as login.
- `POST /api/auth/register` : no auth. Body `{fullName, email, username?, password?}`. If `email` and `password` are set and `NODE_ENV !== 'test'`, creates a Firebase user. Any failure is swallowed and falls back to uid `user_<Date.now()>`. Writes `users/{uid} = {email, displayName, username, globalRole: 'USER', createdAt, updatedAt}`. Returns 201. Crashes with 500 if `email` is missing (`data.email.split`).
- `POST /api/auth/google/login` : no auth. Body `{idToken}`. Verifies with `auth.verifyIdToken`, else 401. Upserts `users/{uid}` with merge: email, displayName, photoURL, username, `globalRole` (ADMIN if token claim `roles` includes ADMIN or `globalRole==='ADMIN'`, or the stored role is ADMIN; else USER), createdAt (kept if present). Returns `{userId, username, email, accessToken: <the same idToken>, accessTokenExpiresAt: token exp, role}`.
- `POST /api/auth/refresh` : no auth. DEV ONLY. Ignores any uid, so it always returns the default dev account token (`findDevAuthAccountByLogin(DEV_AUTH_EMAIL || 'admin')`).

**Dev accounts (`dev-auth.ts`), values from env, no secrets copied:**
- Admin: uid `DEV_AUTH_UID` (default `admin_user`), email `DEV_AUTH_EMAIL` (default `admin@slr.local`), role `DEV_AUTH_ROLE` (default USER), password `SEED_ADMIN_PASSWORD`, aliases `['admin']`.
- Reviewer: uid `DEV_AUTH_REVIEWER_UID` (default `reviewer_user`), email `DEV_AUTH_REVIEWER_EMAIL` (default `reviewer@slr.local`), USER, password `SEED_REVIEWER_PASSWORD`, aliases `['reviewer','janedoe']`.
- Leader: uid `leader_user`, `leader@slr.local`, USER, password `SEED_REVIEWER_PASSWORD`, alias `['leader']`.
- Extra: `DEV_AUTH_EXTRA_USERS_JSON` (array of `{uid, email, displayName?, globalRole?, password?, aliases?}`). Throws on invalid JSON.

**Token semantics:** dev token is `dev-<uid>`. `requireAuth` accepts `dev-`/`mock-` prefixes only when `DEV_AUTH_ENABLED`. No expiry is enforced server-side for dev tokens. `accessTokenExpiresAt` is informational only.

**Firestore:** `users/{uid}` (write on register and Google login, read by `getStoredGlobalRole` in middleware).

**External:** Firebase Admin Auth (`createUser`, `verifyIdToken`).

**TODOs / gaps:**
- `register` ignores Firebase errors (only a warn log) and can silently create a Firestore profile under a generated uid that has no Firebase login. No email validation.
- `register` has no duplicate check. A second call with the same email creates another `users` doc.
- `refresh` takes no input and ignores the caller's identity. Dev only.
- No logout route.
- `googleLogin` cannot demote a user. The stored ADMIN role persists.

---

#### 6. checklist-templates (and review-checklists)

**Purpose:** Reporting-guideline checklists (PRISMA-style). Global templates (admin-managed, seeded with PRISMA 2020). Each review (project) clones a template into a checklist instance, then tracks item completion and generates a DOCX report.

**Files:**
- `checklist-templates.routes.ts` (47 lines), `.controller.ts` (47), `.schemas.ts` (38), `.service.ts` (343).
- `review-checklists.routes.ts` (14), `.controller.ts` (148), `.service.ts` (302).
- `checklist-report.generator.ts` (490). Exports `generateChecklistDocxReport(checklist, {includeOnlyCompletedItems})` returning a DOCX buffer. Not reviewed line by line.

**Mounts:**
- `/checklist` and `/checklist-templates` both mount the template router. These are the same router, so the templates live under both prefixes.
- `/reviews` mounts the review-checklist router.

**Endpoints:**

Templates (`requireAuth` at router level):
- `GET /api/checklist/templates` (also `/api/checklist-templates/templates`) : optional `isSystem=true|false`. Returns summaries `{id, name, description, type, typeName ('Full Review'|'Abstract'), isSystem, version, itemCount, createdAt, updatedAt}`, system templates first. If the collection is empty, seeds PRISMA and retries.
- `GET /api/checklist/templates/:id` : full detail (sections and flat items). 404 if missing.
- `POST /api/checklist/templates` : `requireGlobalAdmin` + Zod `createChecklistTemplateSchema`. Body `{name (1-200), description?, type (0|1, default 0), version (default '1.0'), sections[{name, description?, order?, sectionNumber?, items[]}], items[]}`. Items are recursive `{itemNumber?, section, topic, description, order, isRequired, hasLocationField, isSectionHeaderOnly, defaultSampleAnswer?, parentItemNumber?, subItems[]}`. Returns 201. Created with `isSystem: false`.

Checklist instance (`requireAuth` only, no project check):
- `GET /api/checklist/:checkListId` : full review checklist document.
- `GET /api/checklist/:checkListId/completion` : `{reviewChecklistId, completionPercentage, isCompleted}`.
- `PUT /api/checklist/:checkListId/items/:itemId` : body `{location?, isReported?}`. Item matched by `itemTemplateId`, `responseId`, or `resp_<itemTemplateId>`. Recurses into children.
- `PATCH /api/checklist/:checkListId/items/:itemId/status` : body `{isReported}`. Calls the same service method.
- `POST /api/checklist/:checkListId/generate-report` : body `{includeOnlyCompletedItems?}`. Returns a DOCX (`Content-Disposition` attachment, filename from review title + checklist id).
- `POST /api/checklist/:checkListId/auto-fill` : multipart `file` (multer, 50 MB). STUB. Returns 202 `{taskId: 'task_<Date.now()>', status: 'Queued'}` but queues nothing and does not read the file.

Review checklists (`requireAuth`):
- `POST /api/reviews/:reviewId/checklist` : body `{templateId}`. Clones the template into `reviewChecklists/{newId}`. Title comes from `projects/{reviewId}.title || name`, fallback 'Systematic Literature Review'. Returns 201.
- `GET /api/reviews/:reviewId/checklist` : list summaries where `reviewId == :reviewId`.

**Firestore:**
- `checklistTemplates/{templateId}` : `{id, name, description, type, isSystem, version, createdAt, updatedAt, sections[{id, templateId, name, description, order, sectionNumber, items[]}], items[] (flat copy)}`.
- `reviewChecklists/{checklistId}` : `{id, reviewChecklistId, reviewId, reviewTitle, templateId, templateName, templateType, typeName, isCompleted, completionPercentage, pdfUrl, pageWidth, pageHeight, lastUpdatedAt, sections[{id,name,description,order,sectionNumber}], items[ChecklistItemResponse(tree)]}`.
- Read: `projects/{reviewId}` for title.

**Models:**
- Template item DTO: `{id, templateId, sectionId, parentId, itemNumber, section, topic, description, order, isRequired, hasLocationField, isSectionHeaderOnly, hasChildren, canRespond, defaultSampleAnswer, children[]}`.
- Response item DTO: `{responseId: 'resp_'+templateItemId, itemTemplateId, ..., reportLocation, location, isReported, isCompleted, lastUpdatedAt, pdfCoordinates, children[]}`.
- `type`: 0 = Full Review, 1 = Abstract.
- Custom item ids: `${sectionId}_item_${path}`, where path is the 1-based index joined by `_`.

**Business rules:**
- Item completion: `isCompleted = isReported || location.trim() !== ''`.
- Section-header items (or any item with children) have `canRespond = false`, `hasLocationField = false`, and are excluded from completion.
- `completionPercentage = round(completed respondable / respondable * 100)`. `isCompleted = completionPercentage === 100`. Recomputed and written on every item update.
- Template seeding (`seedDefaults`): only when `checklistTemplates` is empty. Seeds `prisma-2020-full` ("PRISMA 2020 Statement Template", version `2020.1`, isSystem true) with 5 items (titles, abstract, rationale, objectives, eligibility) in 4 sections. It is a shortened PRISMA, not the full 27-item list.
- `getTemplateById` also seeds if the id is missing and the collection is empty.

**Gaps and TODOs:**
- No membership check on checklist instances, so any authenticated user can read or update any review checklist by id.
- `autoFillChecklist` is a stub (see above). The `multer` upload is accepted and discarded.
- `updateChecklistItem` writes the whole `items` tree on each change (no per-item update). Concurrent updates can lose writes.
- `checklistTemplates` `items` and `sections` duplicate the same data. `createCustomTemplate` builds both.
- `ReviewChecklistsService.getChecklistCompletion` re-reads the whole document just to return two numbers.
- `pdfUrl`, `pageWidth`, `pageHeight`, and `pdfCoordinates` are always null. Looks like a placeholder for a PDF annotation feature.

---

#### 7. compatibility (phase-compatibility routes)

**Purpose:** Frontend-compatibility shims. The frontend still uses "process" ids (e.g. `qa_<projectId>`, `rp_<projectId>`, `sy_...`) and phase-centric endpoints. These handlers map them onto project-scoped Firestore docs. The file is 636 lines, all inline, mounted at the root of `/api`.

**Files:** `phase-compatibility.routes.ts` (636). Exports `stripPhaseProcessPrefix(processId)` which removes the `qa_|de_|sy_|rp_|sp_` prefix, used by data-extraction too.

**Mount:** `router.use(phaseCompatibilityRoutes)` at `/api` root. Paths below are full. `requireAuth` is applied to prefixes `/quality-assessment`, `/identification-processes`, `/synthesis-execution`, `/synthesis`. Membership is checked only in `getAuthorizedProject` (used by QA leader, QA strategies, QA excel). That helper passes for global ADMIN, `project.ownerId`, or any `projects/{id}/members/{uid}`. Role is not checked.

**Endpoints:**

Quality assessment:
- `GET /api/quality-assessment/:processId` : status from `projects/{id}.qualityAssessment` (`status` 0 NotStarted / 1 InProgress / 2 Completed, `statusText`). Returns `{id, reviewProcessId: 'rp_'+id, status, statusText, isHaveCriteria: true}`.
- `POST /api/quality-assessment/:processId/start` : sets status 1 (merge).
- `POST /api/quality-assessment/:processId/complete` : sets status 2.
- `GET /api/quality-assessment/:processId/leader` : per-paper QA rollup. Query `pageNumber`, `pageSize` (max 100, default 20), `search` (title substring). Includes only papers in `reviewProcessPapers` with `status == 'INCLUDED'` and not `isDuplicate`. For each, reads `projects/{id}/papers/{paperId}/qualityAssessments`. Returns `{papers:{items,pageNumber,pageSize,totalCount,totalPages}, reviewerProgresses: [], completionPercentage, totalPapers, completedPapers, inProgressPapers, notStartedPapers}`. Per-paper `completionPercentage` is 100 if `qualityResolution.finalDecision` is 0 or 1 (or '0'/'1'), 50 if any reviewer decision exists, else 0.
- `GET /api/quality-assessment/:processId/assignments/my` : STUB. Returns empty pagination and zeros.
- `GET /api/quality-assessment/:processId/strategies` : reads `projects/{id}/qualityTemplates`. Each template becomes a strategy `{qaStrategyId, description, checklists:[{checklistId: doc.id+'_checklist', name, criteria[{criterionId, question}]}]}`.
- `GET /api/quality-assessment/:processId/export/excel` : despite the name, returns CSV (`text/csv`, UTF-8 BOM, CRLF, all cells quoted). Columns: Paper ID, Paper Title, Reviewer ID, Total Score, Scores (JSON), Created At, Updated At. Iterates all papers sequentially and hydrates each.

Identification (process-phase lifecycle only):
- `POST /api/identification-processes/:processId/start` : `projects/{id}.identification = {status:1, statusText:'InProgress'}`.
- `POST /api/identification-processes/:processId/complete` : status 2.
- `POST /api/identification-processes/:processId/reopen` : back to status 1.

Synthesis:
- `GET /api/synthesis/process/:processId/synthesis-strategies` : reads `projects/{id}/synthesisStrategies`. Defaults `synthesisType` to `'NarrativeThematic'`.
- `POST /api/synthesis/strategies/upsert` : body `{synthesisStrategyId?, synthesisProcessId (required), synthesisType, description, targetResearchQuestionIds[], dataGroupingPlan?, sensitivityAnalysisPlan?}`. Upserts `projects/{id}/synthesisStrategies/{strategyId}` with merge. Returns 400 if `synthesisProcessId` is missing. No Zod validation.
- `POST /api/synthesis-execution/:processId/start` : `projects/{id}.synthesis = {status:1, statusText:'InProgress', startedAt, updatedAt}`.
- `POST /api/synthesis-execution/:processId/complete` : status 2, `completedAt`.
- `GET /api/synthesis-execution/:processId/workspace` : returns `{process:{id, reviewProcessId, status, startedAt, completedAt}, totalExtractedPapers: 0 (hard-coded), themes: projects/{id}/synthesisThemes docs, findings: []}`.
- `GET /api/synthesis-execution/:processId/extracted-data` : STUB, returns `[]`.
- `POST /api/synthesis-execution/:processId/themes` : body `{name, description?, colorCode?}`. Writes `projects/{id}/synthesisThemes/{themeId}` with `themeId/id`, `name/title`, `description`, `colorCode`, `evidences: []`, `evidence: []` (duplicate fields for FE compatibility).
- `PUT /api/synthesis-execution/themes/:themeId` : body `{name?, description?, colorCode?}`. NO processId. Scans EVERY project doc to find the theme (N+1 full scan). No membership check.
- `DELETE /api/synthesis-execution/themes/:themeId` : same full scan and delete.

**Firestore:**
- `projects/{id}` (`qualityAssessment`, `identification`, `synthesis` status objects, `title`/`name`, `ownerId`).
- `projects/{id}/papers/{paperId}` (read: id, title, status, isDuplicate, authors, year, pdf, qualityResolution.finalDecision).
- `projects/{id}/papers/{paperId}/qualityAssessments/{docId}` (reviewerId, reviewerName, scores map `{criterionId:{score, comment}}`, totalScore, createdAt, updatedAt).
- `projects/{id}/reviewProcessPapers/{docId}` (paperId).
- `projects/{id}/qualityTemplates/{id}` (name, criteria[{id, question}]).
- `projects/{id}/synthesisStrategies/{id}`, `projects/{id}/synthesisThemes/{id}`.
- `projects/{id}/members/{uid}` (read for membership).

**Business rules / gaps:**
- `synthesis-strategies/upsert` sets `createdAt = now` on every upsert, because merge overwrites it. Bug.
- `getAuthorizedProject` ignores member role, so a REVIEWER can read the QA leader view and export.
- Start/complete/reopen for identification, synthesis, and QA have no role or membership check. Only `requireAuth`.
- `extracted-data`, `assignments/my`, and `findings` are stubs. `totalExtractedPapers` is always 0.
- `reviewerProgresses` is always `[]`.
- Export is named `excel` but emits CSV.
- Many fields in the QA leader output are always null (publicationType, volume, issue, keywords, conference fields, selectionStatus is hard-coded to 1).
- `stripPhaseProcessPrefix` is also used by data-extraction, which makes the prefix list a global contract.

---

#### 8. core-governance

**Purpose:** Project governance metadata: review needs, commissioning documents (sponsor, scope, budget, source doc), review objectives, a timeline of project events, research questions, and PICOC elements per RQ. Also a static list of question types.

**Files:** `core-governance.routes.ts` (37), `core-governance.controller.ts` (200), `core-governance.service.ts` (382).

**Mounts:** `/core-govern` and `/research-questions`. The second mount is a prefix, so inner paths are doubled: `/api/research-questions/research-questions/project/:projectId`, and so on. Check the FE before relying on either form.

**Endpoints (under `/api/core-govern`, the same paths work under `/api/research-questions` with the doubled prefix):**

Review needs:
- `GET /api/core-govern/review-needs/project/:projectId` : NO auth.
- `POST /api/core-govern/review-needs` : `requireAuth`. Body `{projectId | project_id, description, justification, identifiedBy? | identified_by?}`. Defaults identifiedBy to `req.user.displayName || 'User'`. Returns 201.
- `DELETE /api/core-govern/review-needs/:needId` : `requireAuth`.

Commissioning documents:
- `GET /api/core-govern/commissioning-documents/project/:projectId` : NO auth.
- `POST /api/core-govern/commissioning-documents` : `requireAuth`. Body `{projectId|project_id, sponsor, scope, budget, documentUrl|document_url}`. `budget` coerced to Number, default 0.
- `DELETE /api/core-govern/commissioning-documents/:documentId` : `requireAuth`.

Timeline:
- `GET /api/core-govern/timeline/project/:projectId` : NO auth. Reads `projects/{id}/timeline` ordered by createdAt asc. No create route. Events are written by `projects.service` during OSF import (`createTimelineEvent`).

Review objectives:
- `GET /api/core-govern/review-objectives/project/:projectId` : NO auth.
- `POST /api/core-govern/review-objectives` : `requireAuth`. Body `{projectId|project_id, objectiveStatement|objective_statement}`.
- `DELETE /api/core-govern/review-objectives/:objectiveId` : `requireAuth`.

Question types:
- `GET /api/core-govern/question-types` : NO auth. Static list: `qt_effectiveness` (Effectiveness), `qt_methodology` (Methodology), `qt_comparative` (Comparative), `qt_exploratory` (Exploratory).

Research questions (root collection, separate from protocol RQs):
- `GET /api/core-govern/research-questions/project/:projectId` : NO auth.
- `POST /api/core-govern/research-questions` : `requireAuth`. Body `{projectId|project_id, questionTypeId|question_type_id, questionType|question_type, questionText|question_text, rationale}`.
- `DELETE /api/core-govern/research-questions/:questionId` : `requireAuth`.

PICOC elements:
- `GET /api/core-govern/picoc-elements/research-question/:questionId` : NO auth.
- `POST /api/core-govern/picoc-elements` : `requireAuth`. Body `{researchQuestionId|research_question_id, elementType|element_type, description}`.
- `DELETE /api/core-govern/picoc-elements/:picocId` : `requireAuth`.

**Models:**
- `ReviewNeedItem {needId, projectId, description, justification, identifiedBy, createdAt, updatedAt?, sourceFileName?, documentType?}`
- `CommissioningDocumentItem {documentId, projectId, sponsor, scope, budget (number), documentUrl, createdAt, updatedAt?, sourceFileName?, documentType?}`
- `ProjectTimelineItem {eventId, projectId, eventType (default 'PROJECT_EVENT'), title, description, actor (default 'System'), metadata?, createdAt}`
- `ReviewObjectiveItem {objectiveId, projectId, objectiveStatement, createdAt, updatedAt?}`
- `ResearchQuestionItem {questionId, projectId, questionTypeId, questionType, questionText, rationale, createdAt, updatedAt?}`
- `PICOCElementItem {picocId, researchQuestionId, elementType (free string), description, createdAt, updatedAt?}`
- No Zod validation anywhere in this module.

**Firestore:**
- `reviewNeeds/{needId}` (root) AND `projects/{id}/reviewNeeds/{needId}` (dual write on create). Read prefers the subcollection, falls back to root `where projectId`.
- `commissioningDocuments/{id}` (root, query by projectId).
- `projects/{id}/timeline/{eventId}` (read; written by `createTimelineEvent`).
- `reviewObjectives/{id}` (root, query by projectId).
- `researchQuestions/{id}` (root, query by projectId).
- `picocElements/{id}` (root, query by researchQuestionId).

**Business rules / gaps:**
- `createReviewNeed` writes both root and subcollection, but `deleteReviewNeed` deletes only the root doc. Deleted needs keep showing up in `GET review-needs/project/...`, because the read path prefers the subcollection. Bug.
- Reads for needs, documents, objectives, RQs, PICOC, timeline have no auth and no project membership check. Anyone can read a project's governance data by id.
- Dual data source: root `researchQuestions` (this module) vs `protocol/main.researchQuestions` (ai-setup). They diverge.
- No validation. `createResearchQuestion` writes `questionText: undefined` if missing (Firestore rejects undefined unless `ignoreUndefinedProperties` is set; not verified).
- `createTimelineEvent` is the only writer of timeline data, and it is called only from OSF import.
- The `updatedAt` on create is set to `now` for all three of createdAt and updatedAt (fine).

---

#### 9. data-extraction

**Purpose:** Data extraction form templates and per-reviewer extraction records for included papers. There are two parallel APIs: a canonical project-scoped API (`/api/projects/:projectId/extraction`) and a large legacy compatibility API (`/api/data-extraction*`) used by the frontend. Both share the same Firestore data.

**Files:**
- `extraction.routes.ts` (22), `extraction.controller.ts` (53), `extraction.service.ts` (81), `extraction.schemas.ts` (31), `extraction.types.ts` (29). Canonical API.
- `data-extraction-conducting.routes.ts` (699). Legacy compat API: two routers, `dataExtractionTemplateRouter` and `dataExtractionProcessesRouter`. Inline helpers `buildDefaultTemplate`, `toPaperDto`.

**Mounts (routes.ts):** `/projects/:projectId/extraction` (canonical), `/data-extraction` (template router), `/data-extraction-processes` (process router).

##### 9a. Canonical API (`/api/projects/:projectId/extraction`, `requireAuth` at router level)
- `GET /api/projects/:projectId/extraction/templates` : `requireProjectRole('MEMBER')`. Lists `projects/{id}/extractionTemplates`.
- `POST /api/projects/:projectId/extraction/templates` : `requireProjectRole('OWNER')` + Zod. Body `{name (min 1), fields[ {id, name (min 1), type ∈ TEXT|NUMBER|SINGLE_CHOICE|MULTI_CHOICE|BOOLEAN, description?, options?: string[], required (default false)} ] (min 1)}`. Returns 201 `{id, projectId, name, fields, createdAt}`.
- `GET /api/projects/:projectId/extraction/papers/:paperId` : `requireProjectRole('MEMBER')`. Lists all reviewers' records for the paper.
- `POST /api/projects/:projectId/extraction/papers/:paperId` : `requireProjectRole('LECTURER')` (only LECTURER and OWNER pass; REVIEWER cannot). Zod body `{templateId?, values: record}`. Writes `extractionRecords/{reviewerUid}` with merge. Returns 201.

Models: `ExtractionFieldType`, `ExtractionField {id, name, type, description?, options?, required?}`, `ExtractionTemplate {id, projectId, name, fields[], createdAt}`, `ExtractionRecord {id, projectId, paperId, reviewerId, templateId?, values: Record<string, any>, createdAt, updatedAt}`.

##### 9b. Legacy compat API, template router (`/api/data-extraction`, `requireAuth` only)
- `GET /api/data-extraction/process/:processId/templates` : lists `projects/{id}/extractionTemplates`. If empty, writes and returns a default template `tpl_<projectId>` ("Standard Extraction Form"). Two sections: "Identification" (Study Title text required, Authors text, Publication Year numeric required) and "Key Findings" (Main Findings text required, Conclusions text). Field shape: `{fieldId, templateId, sectionId, name, instruction, fieldType (0|1), isRequired, orderIndex, options[], subFields[]}`.
- `POST /api/data-extraction/templates/upsert` : body free-form (no validation). Saves `projects/{projectIdFromProcess}/extractionTemplates/{templateId}` with merge. `templateId` defaults to `tpl_<Date.now()>`.
- `GET /api/data-extraction/templates/:templateId` : collectionGroup `extractionTemplates where templateId ==`. Falls back to default with projectId `default`. Not scoped to a project.
- `DELETE /api/data-extraction/templates/:templateId` : collectionGroup delete across ALL projects. No role check. Dangerous.

##### 9c. Legacy compat API, process router (`/api/data-extraction-processes`, `requireAuth` only, no role or membership checks)

Process lifecycle:
- `GET /:processId` : status from `projects/{id}.dataExtraction` (0/1/2), `{id, reviewProcessId, status, statusText}`.
- `POST /:processId/start` : sets `dataExtraction.status = 1`.
- `POST /:processId/complete` : sets `dataExtraction.status = 2`.

Paper lists and dashboards:
- `GET /:processId/unique-papers` : query `search` (title, doi, authors), `year`, `pageNumber` (1+), `pageSize` (1-100, default 20). Reads `projects/{id}/papers`, hydrates via `hydratePapers`, filters by `isPaperPoolVisible`. Each item is `toPaperDto`: status fixed 1 'Included', finalDecision fixed 0 'Include', fullTextRetrievalStatus 1 if `pdfUrl` or `pdf` else 2. Returns `{items, totalCount, pageNumber, pageSize, totalPages, hasPreviousPage, hasNextPage}`.
- `GET /:processId/dashboard` : query `pageNumber`, `pageSize` (1-100, default 10), `searchQuery|search`. Returns `{summary:{totalIncluded, inProgress: 0, awaitingConsensus: 0, completed: 0}, tasks:{items, totalCount, pageNumber, pageSize, totalPages}}`. Each task has `status: 'todo'` (hard-coded), `reviewer1Id/reviewer2Id` from `paper.assignedReviewers`, statuses 'Pending' or null. Summary counts are not computed.
- `GET /:processId/workload-summary` : STUB `{overallProgressPercentage: 0, reviewerWorkloads: []}`.
- `GET /:processId/export-preview` : STUB `{headers: [...], rows: []}`.
- `GET /:processId/export` and `GET /:processId/export/csv` : STUB CSV with header row only.
- `GET /:processId/audit-logs` : STUB `[]`.
- `GET /:processId/editable-grid` (alias `/grid`) : STUB `{columns: [], rows: []}`.
- `PUT /:processId/editable-grid/cell` (alias `/grid/cell`) : STUB no-op.

Reviewer workspace and consensus:
- `GET /:processId/papers/:paperId/reviewer-workspace` (alias `/:processId/reviewer-workspace/:paperId`) : builds sections from the first template (or default). For each field, shows the current user's answer from `projects/{id}/papers/{paperId}/extractionRecords/{uid}.values[fieldId]`. Answer object: `{optionId, stringValue, numericValue, booleanValue, isNotReported, displayValue, evidenceCoordinates, comments: []}`. Returns `{paperId, templateId, reviewerId, sections}`.
- `GET /:processId/papers/:paperId/consensus` (alias `/:processId/consensus/:paperId`) : builds the same form with empty `reviewer1Answer`, `reviewer2Answer`, `finalAnswer` (always null). `reviewer1Id` and `reviewer2Id` are always null.
- `POST /:processId/papers/:paperId/consensus/submit` : STUB 200.
- `POST /:processId/papers/:paperId/reopen` : STUB 200.
- `POST /:processId/papers/:paperId/fields/:fieldId/comments` : STUB 200.
- `POST /:processId/ask-ai-field` : STUB. Returns a fixed `stringValue: 'Extracted automatically from full text.'`. No AI call.
- `POST /:processId/papers/:paperId/auto-extract` : STUB `[]`.

Writes:
- `PUT /:processId/papers/:paperId/assign` : body `{reviewer1Id, reviewer2Id}`. Writes `papers/{paperId}.assignedReviewers = [ids...]` (merge). No membership validation.
- `POST /:processId/papers/:paperId/submit` (alias `/direct-extract`) : body `{values: [{fieldId, optionId?, stringValue?, numericValue?, booleanValue?, isNotReported?, evidenceCoordinates?}]}`. Converted to a map keyed by fieldId. Writes `papers/{paperId}/extractionRecords/{uid}` with merge `{paperId, reviewerId, values, updatedAt}`.

**Firestore:**
- `projects/{id}/extractionTemplates/{templateId}` (read and write).
- `projects/{id}/papers/{paperId}` (read for lists and dashboards, write `assignedReviewers`).
- `projects/{id}/papers/{paperId}/extractionRecords/{reviewerUid}` (read and write, shared with canonical API).
- `projects/{id}` (`dataExtraction` status object, read).

**Business rules / gaps:**
- Records are keyed by reviewer uid. One record per reviewer per paper, so there is no version history.
- `reviewer-workspace` uses `numericValue || null` and `booleanValue || null`, so 0 and false become null. Bug.
- `toPaperDto` always reports Included and finalDecision Include.
- Dashboard and summary counts are not computed (see stubs). Only the `tasks` list is real.
- The default template is inlined and duplicated in the canonical API. The canonical API has no default, so the two templates can disagree.
- Legacy routes have no role checks. Any authenticated user can submit extraction for any paper, reassign reviewers, and read or delete templates across projects.
- `GET/DELETE /templates/:templateId` uses collectionGroup and is not scoped to the project. Potential cross-project leak or delete.
- Canonical POST `/papers/:paperId` requires LECTURER, but the legacy submit route has no gate. Enforcement differs between the two APIs.
- `dataExtractionProcessesRouter` uses `stripPhaseProcessPrefix`, which lives in the compatibility module.
- `extraction.types.ts` uses `fields` in templates, but the legacy template uses `sections`. Two incompatible template shapes.

---

#### 10. deduplication

**Purpose:** Duplicate detection among a project's papers (DOI match, then normalized title match). Lecturers run detection, then confirm or reject each suspected pair. Persisted outcomes are in `duplicatePairs`.

**Files:** `deduplication.routes.ts` (17), `deduplication.controller.ts` (59), `deduplication.service.ts` (425).

**Mounts (routes.ts):**
- `router.use('/projects/:projectId', duplicatePairsRouter)` gives the `duplicate-pairs` endpoints.
- `router.use('/projects/:projectId/deduplication', deduplicationRoutes)` gives `run`.
- Note: `duplicatePairsRouter.use(requireAuth)` runs for every request under `/projects/:projectId`. Harmless but surprising.

**Endpoints:**
- `GET /api/projects/:projectId/duplicate-pairs` : `requireAuth` + `requireProjectRole('MEMBER')`. Query: `search` (title, authors, DOI), `status` (0 Pending, 1 Confirmed, else Rejected), `minConfidence`, `method` (0 DOI_MATCH, 1 TITLE_FUZZY), `sortBy` (`confidenceDesc` default | `confidenceAsc` | `detectedAtDesc`), `pageNumber` (default 1), `pageSize` (default 100, max 100). Returns `{isSuccess, success, data: {items, totalCount, pageNumber, pageSize, totalPages, hasPreviousPage, hasNextPage}}`.
- `PATCH /api/projects/:projectId/duplicate-pairs/:pairId/resolve` : `requireProjectRole('LECTURER')`. Body `{decision: 0|1, notes?}`. Returns `{id, reviewStatus, resolvedDecision, reviewedAt, reviewedBy}`. Pair id format: `${originalPaperId}__${duplicatePaperId}`.
- `POST /api/projects/:projectId/deduplication/run` : `requireProjectRole('LECTURER')`. Batch-processes papers with `status` missing or `IMPORTED`. Returns `{duplicatesFound, totalScreenable, message?}`.

**Models:**
- `DeduplicationMatch {paperId, matchedWithPaperId, matchType: 'DOI'|'TITLE_EXACT'|'TITLE_YEAR', confidence}`. `TITLE_YEAR` is in the union but never produced.
- Pair DTO: `{id, originalPaper, duplicatePaper (toPaperDto: id,title,authors string,abstract,doi,publicationYear,source,journal,url=pdfUrl,importedAt), method (0|1), methodText ('DOI_MATCH'|'TITLE_FUZZY'), confidenceScore, deduplicationNotes, resolvedDecision, reviewStatus (0|1|2), reviewStatusText ('Pending'|'Confirmed'|'Rejected'), reviewedBy, reviewedAt, detectedAt}`.
- Paper statuses used here: `IMPORTED`, `DUPLICATE`, `SCREENING_TITLE_ABSTRACT`.

**Matching rules:**
- DOI normalization: trim, lowercase, strip `https?://(dx.)?doi.org/` and `doi:`. Exact match gives confidence 1.0, `method: DOI`.
- Title normalization: lowercase, non-word chars to space, trim. Exact match gives confidence 0.95, `method: TITLE_EXACT`, only when both years match or either is missing. Method is reported as `TITLE_FUZZY` (name is misleading, since it is exact).
- `detectDuplicatePairs` sorts by createdAt asc (then id). Keeps a unique pool. Each later paper that matches an earlier one becomes a pair. Papers already `isDuplicate` or `status === 'DUPLICATE'` are not added to the unique pool.
- Listing recomputes pairs on every request from all papers, then overlays stored resolutions. Pairs with no stored resolution are inferred from the duplicate paper's state (DUPLICATE with duplicateOfPaperId matching gives Confirmed, else Pending).

**Resolve (`resolveDuplicatePair`):**
- Recomputes the pair and 404s if not found. Only decisions 0 and 1 are accepted (400 `INVALID_DUPLICATE_DECISION`).
- Batch: original gets `status: SCREENING_TITLE_ABSTRACT, isDuplicate: false`. Duplicate gets `status: DUPLICATE, isDuplicate: true, duplicateOfPaperId` (decision 1) or `status: SCREENING_TITLE_ABSTRACT, isDuplicate: false, duplicateOfPaperId: null` (decision 0).
- Writes `duplicatePairs/{pairId}` (merge): `reviewStatus: 1` (confirmed) for decision 1, `2` (labelled Rejected) for decision 0, `resolvedDecision`, `reviewedBy`, `reviewedAt`, `deduplicationNotes`, `method`, `confidenceScore`, `detectedAt`.
- Does not check whether the pair was already resolved. Re-resolving is allowed.

**Run (`runProjectDeduplication`):**
- Loads all project papers. `importedPapers = status missing or IMPORTED`. Pool starts with non-duplicate, non-IMPORTED papers.
- Each imported paper is checked against the pool. Duplicate: `status DUPLICATE, isDuplicate, duplicateOfPaperId`, plus an auto-confirmed `duplicatePairs/{pairId}` (`reviewedBy: 'system'`, `reviewStatus: 1`, `resolvedDecision: 1`, notes "Automatically resolved via batch deduplication"). Non-duplicate: `status SCREENING_TITLE_ABSTRACT, isDuplicate false`, added to the pool.
- Uses `db.batch()`, committed every 400 ops (2 ops per duplicate). Returns `{duplicatesFound, totalScreenable: pool size}`.

**Firestore:**
- `projects/{id}/papers/{paperId}` (read and write: status, isDuplicate, duplicateOfPaperId, updatedAt).
- `projects/{id}/duplicatePairs/{origId__dupId}` (read and write).
- Read-only via `hydratePapers`.

**Gaps / TODOs:**
- `TITLE_EXACT` is reported as `TITLE_FUZZY`. Naming mismatch. No real fuzzy matching.
- `TITLE_YEAR` type is never produced.
- Pair listing is O(n) per request over all papers, and the candidate scan is O(n^2) in the worst case. No caching.
- `resolveDuplicatePair` can flip an already-resolved pair without any audit trail. Audit log is not written.
- Decision 0 is persisted as `reviewStatus: 2`, which the DTO labels "Rejected". The semantics ("not a duplicate") are arguably mislabelled.
- The `run` route and the pair routes use `requireProjectRole` with LECTURER. REVIEWER and OWNER-only callers differ. OWNER passes.
- Batch commit logic checks `opCount >= 400` after pushing two ops, so it can commit at 400 exactly. Fine, but not documented.

---

#### 11. exclusion-reasons

**Purpose:** Global library of exclusion reason codes (for screening). Admin-managed in intent, but no admin check exists.

**Files:** `exclusion-reasons.routes.ts` (16), `exclusion-reasons.controller.ts` (96), `exclusion-reasons.service.ts` (159).

**Mount:** `/exclusion-reason-libraries`. Full base `/api/exclusion-reason-libraries`.

**Endpoints (all `requireAuth` only; no role check):**
- `GET /api/exclusion-reason-libraries/` : query `search` (name or code substring), `onlyActive=true|false` (only `true` filters), `pageNumber` (default 1), `pageSize` (default 10). Returns `{isSuccess, message, data: {items, pageNumber, pageSize, totalCount, totalPages}, errors: []}`. Sorted by `code` asc.
- `GET /api/exclusion-reason-libraries/:id` : 404 if missing.
- `POST /api/exclusion-reason-libraries/bulk` : accepts a single object or an array. Body items `{code: number, name: string}`. No validation. Creates all in one batch with `isActive: true`. Returns 201 with created items.
- `PATCH /api/exclusion-reason-libraries/:id/toggle-active` : flips `isActive`.
- `DELETE /api/exclusion-reason-libraries/:id` : hard delete.

**Model:** `ExclusionReasonLibrary {id, code: number, name, isActive, createdAt}`.

**Seed (only when the collection is empty):** six defaults with codes 1-6: Not relevant to research questions; Non-English publication; Duplicate publication; Short paper, extended abstract, or editorial; Full text unavailable; Out of target publication date range. Seeded docs have `isActive: true`.

**Firestore:** `exclusionReasonLibraries/{id}` (read and write, root collection).

**Gaps / TODOs:**
- No admin check on create, toggle, or delete. Any authenticated user can change the global library.
- `createBulk` does no validation: `item.name.trim()` throws a 500 for a missing name, and `Number(code)` can be NaN. No duplicate code check.
- `delete` is a hard delete with no check whether screening decisions reference the reason. Possible orphaned references.
- `getAll` reads the whole collection and paginates in memory.
- `onlyActive` is applied only when the value is `'true'`. `'false'` returns everything.
- The `seedDefaults` path re-enters `getExclusionReasonLibraries` recursively. Safe (the second read is non-empty), but a race between two first requests could seed twice.

---

#### 12. grobid

**Purpose:** Client for the GROBID PDF-to-TEI service, plus a strict TEI XML parser and PDF validation. Used by the PDF processing worker to turn uploaded PDFs into structured full text. There are no HTTP routes of its own.

**Files:**
- `grobid.service.ts` (126). `GrobidService` class.
- `tei-parser.ts` (312). `parseTei(xml): TeiDocument` and `textOf`.
- `grobid.errors.ts` (32). `PdfProcessingError` and error codes.
- `pdf-validation.ts` (26). `assertPdfBuffer`, `assertUploadablePdf`.

**Consumers:**
- `src/modules/pdf-processing/pdf-processing.worker.ts`: calls `isAlive()`, then `processFulltext()`, then `parseTei()`. Retries use `PDF_PROCESSING_MAX_ATTEMPTS`.
- `src/modules/papers/paper-fulltext.controller.ts`, `papers.controller.ts`, `paper-import/paper-import.service.ts`: call `assertUploadablePdf`.
- `src/modules/papers/paper-markdown.ts`: imports the `TeiDocument` types.

**GROBID client (`GrobidService`):**
- `processFulltext(pdfBuffer): Promise<string>`: `POST {GROBID_URL}/api/processFulltextDocument`, multipart fields `input` (paper.pdf), `consolidateHeader` (env `GROBID_CONSOLIDATE_HEADER`, default '1'), `consolidateCitations` (env, default '0'), `includeRawCitations=1`, `includeRawAffiliations=0`, `segmentSentences=0`. Timeout `GROBID_FULLTEXT_TIMEOUT_MS` (default 180000 ms). Max response 50 MB. Returns raw TEI XML.
  - Status mapping: 200 OK. 204 `GROBID_EMPTY_RESPONSE` (not retryable). 400 `GROBID_BAD_REQUEST` (not retryable). 500 `GROBID_PROCESSING_FAILED` (not retryable). 503 `GROBID_BUSY` (retryable). Anything else `GROBID_UNAVAILABLE` (retryable). Empty body `GROBID_EMPTY_RESPONSE`.
  - Transport errors: timeout codes or messages containing "timeout" map to `GROBID_TIMEOUT` (retryable). ECONNREFUSED, ENOTFOUND, ECONNRESET, EAI_AGAIN, EPIPE map to `GROBID_UNAVAILABLE` (retryable). Anything else is `GROBID_UNAVAILABLE` with the message.
- `isAlive(): Promise<boolean>`: `GET {GROBID_URL}/api/isalive`, 5 s timeout, true only on 200.
- `processHeader(pdfBuffer): Promise<ParsedGrobidHeader | null>`: `POST /api/processHeaderDocument`, `consolidateHeader=0`. Returns `{title, abstract, doi}` through regex. Swallows all errors (returns null). NOT CALLED anywhere in the repo.
- `parseTeiHeader`: regex-based. `<title[^>]*>` also matches `<titleStmt>`, so the title can be wrong. Unused path.

**Env (names and defaults):** `GROBID_URL` (default `http://localhost:8070`), `GROBID_TIMEOUT_MS` (default 8000), `GROBID_FULLTEXT_TIMEOUT_MS` (default 180000), `GROBID_CONSOLIDATE_HEADER` (enum 0|1|2, default 1), `GROBID_CONSOLIDATE_CITATIONS` (enum 0|1|2, default 0), `PDF_PROCESSING_ENABLED` (default true), `PDF_PROCESSING_CONCURRENCY` (1-8, default 2), `PDF_PROCESSING_MAX_ATTEMPTS` (1-10, default 3), `PDF_PROCESSING_MAX_BYTES` (default 50 MB).

**PDF validation:**
- `assertPdfBuffer(buffer, maxBytes)`: non-empty, `<= PDF_PROCESSING_MAX_BYTES`, and the substring `%PDF-` appears within the first 1024 bytes (PDF spec allows leading junk). Throws `INVALID_PDF`.
- `assertUploadablePdf(buffer)`: same check, but throws `BadRequestError(message, 'INVALID_PDF')` (HTTP 400) for request-time proxy uploads.

**Error model (`grobid.errors.ts`):**
- `GrobidErrorCode = INVALID_PDF | GROBID_BAD_REQUEST | GROBID_PROCESSING_FAILED | GROBID_BUSY | GROBID_UNAVAILABLE | GROBID_TIMEOUT | GROBID_EMPTY_RESPONSE | MALFORMED_TEI | PDF_DOWNLOAD_FAILED | PDF_NOT_FOUND | INTERNAL`.
- `RETRYABLE_GROBID_ERRORS = {GROBID_BUSY, GROBID_UNAVAILABLE, GROBID_TIMEOUT, PDF_DOWNLOAD_FAILED}`.
- `PdfProcessingError(code, message, retryable = default-by-code, {cause})`.

**TEI parser (`parseTei`):**
- Rejects: empty input (`MALFORMED_TEI`), `<!ENTITY` declarations (XXE guard), malformed XML (`XMLValidator`), and a missing `<TEI>` root.
- Uses `fast-xml-parser` with `preserveOrder`, `removeNSPrefix`, and `processEntities`. Converts to an internal tree and walks it.
- Output `TeiDocument`:
  - `title`: `titleStmt` title with `type="main"`, else first title, else analytic title.
  - `authors[]` from `sourceDesc/biblStruct`: `{name, affiliation?, email?}`.
  - `abstract`: paragraphs joined by blank lines, or the abstract text.
  - `keywords[]` from `profileDesc/textClass/term`.
  - `doi`, `year`, `journal` (monogr title with `level="j"`).
  - `sections[]` from body: `{heading, number, level, paragraphs[]}`. Level from heading number dots, capped at `MAX_LEVEL = 4`. Lists become `- item` lines. Text after a nested div starts a new section.
  - `backSections[]` from back matter (same shape).
  - `figures[]` from body and back: `{kind: 'figure'|'table', label, caption, rows?: string[][]}`. Table rows come from `<table><row><cell>`.
  - `references[]` from `back/listBibl/biblStruct`: `{id, text, title, authors[], year, venue, doi}`. `text` is the raw_reference note, or a constructed citation. References without text are dropped.

**Gaps / TODOs / bugs:**
- `processHeader` sets `'Content-Type': 'multipart/form-data'` manually, with no boundary. This breaks the request. The comment in `processFulltext` explicitly warns against it. Unused, but dangerous if wired up.
- `processHeader` and `parseTeiHeader` are dead code. `parseTeiHeader` uses regex on XML, so it is fragile.
- `GROBID_TIMEOUT_MS` is only used by `processHeader` and `isAlive` (5 s hard-coded). Mismatched naming.
- `consolidateHeader` default `'1'` calls CrossRef from GROBID, which adds an external dependency and latency. Not explicit in the code.
- `parseTei` has no guard for huge documents beyond the 50 MB axios cap.
- `MAX_LEVEL` caps section depth silently.

---

#### 13. invitations

**Purpose:** Project membership invitations. Sending is a project-owner action in the projects module (which auto-accepts and adds members). This module handles the invitation records and the accept/reject/cancel flow.

**Files:** `invitations.routes.ts` (16), `invitations.controller.ts` (98), `invitations.service.ts` (164).

**Mount:** `/invitations`. Full base `/api/invitations`.

**Endpoints (`requireAuth` only, no role or membership checks):**
- `GET /api/invitations/:projectId/from` : query `status` (number). Lists `invitations where projectId == :projectId` (optionally `status ==`). Note the route param is named `projectId` but it is the project id.
- `GET /api/invitations/:id` : one invitation by doc id. 404 if missing.
- `DELETE /api/invitations/:id` : cancel (sets `status: 4`). Named `cancel` in code. Doc is kept.
- `POST /api/invitations/:invitationId/accept` : transaction. Sets invitation `status: 2`, `respondedAt`, upserts `projects/{pid}/members/{invitedUserId}` with role, adds the user to `projects.memberUserIds`.
- `POST /api/invitations/:invitationId/reject` : body `{responseMessage?}`. Sets `status: 3`, `responseMessage`, `respondedAt`.

**Sending (not in this module):** `POST /api/projects/:projectId/invitations` (projects module, `requireProjectRole('OWNER')`), which calls `InvitationsService.sendInvitations`. Also `GET /api/projects/:projectId/invitations` (`MEMBER`) lists them through the projects module.
- Body: `{userIds: string[], role: 'LECTURER'|'REVIEWER'|1|2|3 (strings or numbers), expiredAt?: ISO}`.
- Role mapping (`toInvitedRole`): `LECTURER`, `'1'`, `'2'` → LECTURER. `REVIEWER`, `'3'` → REVIEWER. Anything else → 400. Note that `1` and `2` both map to LECTURER, which is surprising.
- Creates one invitation per user with `status: 2` (auto-accepted), `expiredAt` (default now + 7 days), and a `members/{uid}` doc. Adds all to `projects.memberUserIds`. Single batch. Refuses to invite the project's `ownerId` (403).
- Does NOT verify the user exists. Missing user doc yields placeholder name 'User' and empty email.

**Models:**
- `Invitation {id, projectId, projectTitle, invitedUserId, invitedUserFullName, invitedUserEmail, invitedByUserId, invitedByUserFullName ('Project Leader', hard-coded), status, role ('LECTURER'|'REVIEWER'), expiredAt, createdAt, respondedAt?, responseMessage?, updatedAt?}`.
- Status enum (inferred from code, values used): `2 = accepted`, `3 = rejected`, `4 = cancelled`. Status `1` (presumably pending) is never written in this codebase.
- Role enum: `OWNER` is excluded from invitable roles. `ProjectRole = OWNER|LECTURER|REVIEWER` in `role.middleware.ts`.

**Firestore:**
- `invitations/{id}` (root, read, update status, delete is NOT used; cancel is a status update).
- `projects/{id}` (read, update `memberUserIds`).
- `projects/{id}/members/{uid}` (write on accept and on send).
- `users/{uid}` (read for names/email during send).

**Business rules / gaps:**
- CRITICAL: `accept`, `reject`, and `cancel` do NOT check that the caller is the invited user (or the project owner, for cancel). Any authenticated user who knows an invitation id can accept it, which grants them membership with that role. They can also reject or cancel other people's invitations.
- Accept does not check the invitation's current status or `expiredAt`. A cancelled (4) or rejected (3) invitation can be accepted later, which re-adds membership. `expiredAt` is never enforced anywhere.
- `getInvitationsFrom` and `getById` are readable by any authenticated user (invitation contains emails and invitedBy).
- Accept is a transaction, but reject and cancel are plain updates with no status guard.
- `sendInvitations` has an already-accepted path only (status 2). The invitation records are created already accepted, so the accept endpoint is effectively unused for normal flow.
- `sendInvitations` builds the batch and throws mid-loop for owner. Partial state is not possible because the batch isn't committed until the end, so this is fine.
- `invitedByUserFullName` is hard-coded to 'Project Leader'.
- `reject` does not check `responseMessage` length.

---

#### 14. master-sources

**Purpose:** Catalog of external literature search sources (IEEE Xplore, Scopus, PubMed, etc.). Admin-managed. Projects choose from the active subset.

**Files:** `master-sources.routes.ts` (24), `master-sources.controller.ts` (103), `master-sources.service.ts` (178), `master-sources.schemas.ts` (26).

**Mounts (routes.ts):**
- `/admin/master-sources` (admin router): full base `/api/admin/master-sources`.
- `GET /master-sources/available` is defined directly in `routes.ts` with `masterSourcesController.getAvailable`. Full path `/api/master-sources/available`.

**Endpoints:**

Admin (`requireAuth` + `requireGlobalAdmin` at router level):
- `GET /api/admin/master-sources/` : query `isActive=true|false` (only exact string matters), `sourceName` (substring, case-insensitive). Returns list with `usageCount`, sorted by `sourceName`. Seeds 9 defaults if the collection is empty.
- `POST /api/admin/master-sources/` : Zod body `{sourceName (trim 1-120), baseUrl (valid URL), isActive (boolean, required), logoUrl? (URL or '')}`. Returns 201.
- `GET /api/admin/master-sources/:id` : 404 if missing.
- `PUT /api/admin/master-sources/:id` : Zod partial body (`sourceName?`, `baseUrl?`, `isActive?`, `logoUrl?`). At least one field. Returns the updated doc.
- `PATCH /api/admin/master-sources/:id/toggle-status` : flips `isActive`.
- `GET /api/admin/master-sources/:id/usage` : `{usageCount}`.
- `DELETE /api/admin/master-sources/:id` : 409 if `usageCount > 0`. Otherwise deletes.

Public (NO `requireAuth` on this route):
- `GET /api/master-sources/available` : returns `[{id, name}]` for active sources only. Unauthenticated, by design of the route.

**Model:** `MasterSearchSource {id, sourceName, baseUrl, isActive, logoUrl?, usageCount, createdAt, updatedAt}`.

**Seed (when the collection is empty):** IEEE Xplore (ieeexplore.ieee.org), ACM Digital Library (dl.acm.org), Scopus (scopus.com), ScienceDirect (sciencedirect.com), PubMed (pubmed.ncbi.nlm.nih.gov), Web of Science (webofscience.com), Crossref (api.crossref.org), Semantic Scholar (api.semanticscholar.org), OpenAlex (api.openalex.org). All active.

**Usage count:** `collectionGroup('searchSources')` filtered by `masterSourceId == id`. Written by the paper-pool module (`paper-pool.controller.ts`, `paper-pool.routes.ts`), not reviewed here.

**Firestore:**
- `masterSearchSources/{id}` (root, read and write).
- `collectionGroup searchSources` (read, for usage). Each `projects/{pid}/searchSources/{id}` doc with `masterSourceId`.

**Business rules / gaps:**
- A source in use cannot be deleted (409). Enforced in the controller and again in the service.
- `usageCount` in `getAll` runs a full collectionGroup scan on every list call (scales with total search sources across all projects). Each delete also scans.
- `update()` does a read followed by a full `set()`, so concurrent edits can clobber each other.
- `baseUrl` is validated only by Zod `url()`. There is no allowlist, and it is used as a display link only in this module.
- `isActive` on create is required by the schema (validation), though the service defaults it to true.
- `getAvailable` depends on `getAll`, which seeds if empty. The first unauthenticated call can therefore write to Firestore.
- Missing: pagination, audit log of changes.

---

#### Cross-module observations (for the context notes)

- **Auth gaps (no role or membership check, `requireAuth` only):** audit admin (`/api/auditlog/admin`, the most serious: all audit logs visible to any user), invitations accept/reject/cancel/list-by-project, exclusion-reason create/toggle/delete, checklist instance read/update, data-extraction legacy routes, compat QA/identification/synthesis start/complete/reopen, and the cross-project template/theme scans.
- **No auth at all:** `GET /api/master-sources/available`, `POST /api/auth/login|register|google/login|refresh|dev/quick-login`, and the core-governance GET routes (review needs, commissioning docs, objectives, timeline, research questions, PICOC, question types).
- **Dev-auth fallback:** when `DEV_AUTH_ENABLED` and not production, a request with no Authorization header is auto-authenticated as the default dev account (`requireAuth`). Confirm `DEV_AUTH_ENABLED` is off in deployed environments.
- **Role-matching quirk:** `requireProjectRole(R)` only lets OWNER through in addition to exact-role members. LECTURER-gated routes exclude REVIEWER members. REVIEWER-gated (screen-assist) excludes LECTURER members.
- **Stubs returning 200 with fake or empty data:** compat `assignments/my`, `extracted-data`, `workload-summary`, `export-preview`, `export`, `audit-logs`, `editable-grid`, `consensus/submit`, `reopen`, `comments`, `ask-ai-field` (returns a canned string), `auto-extract`, checklist `auto-fill` (returns a fake taskId), and admin audit fallback seed data.
- **Two RQ stores and two template shapes:** root `researchQuestions` (core-governance) vs `protocol/main.researchQuestions` (ai-setup); `extractionTemplates` with `fields` (canonical) vs `sections` (legacy). Expect drift.
- **Enum-like numerics in use:** project-phase status (0 NotStarted, 1 InProgress, 2 Completed), dedup reviewStatus (0 Pending, 1 Confirmed, 2 Rejected), dedup method (0 DOI_MATCH, 1 TITLE_FUZZY), checklist template type (0 Full Review, 1 Abstract), invitation status (2 accepted, 3 rejected, 4 cancelled), data-extraction fieldType (0/1, meaning inferred), fullTextRetrievalStatus (1 Retrieved, 2 Not retrieved).
- **Firestore hot spots:** collectionGroup scans in master-sources usage, data-extraction template by id, and the synthesis theme scan across all projects. Full-collection reads in audit and exclusion reasons.
- **Secrets handled (names only):** `AGENT_TOKEN_ENCRYPTION_KEY`, `AI_API_KEY` (sent as URL query to Gemini), `SEED_ADMIN_PASSWORD`, `SEED_REVIEWER_PASSWORD`, `GROBID_URL`. Values not recorded here.

#### Notable TODOs / incomplete parts (collected)

- `checklist-templates`: auto-fill is a stub (no queue, no file read). PDF coordinates and PDF URL fields are always null. Template seed is a shortened PRISMA (5 items, not 27).
- `compatibility`: assignments/my, extracted-data, findings stub, reviewerProgresses always `[]`, totalExtractedPapers hard 0, export labelled excel but CSV.
- `data-extraction`: dashboard counts hard-coded 0, status 'todo', workload/export/grid/audit-logs stubs, ask-ai-field fake, auto-extract `[]`, consensus submit and reopen no-ops, comments no-op.
- `ai`: only gemini provider implemented, despite env enum including openai/groq/openrouter. No timeout or retry. No response validation.
- `ai-setup`: activeFeatures lists DataExtraction and SummarySynthesis although they are not wired to AI.
- `grobid`: processHeader and parseTeiHeader are unused, and processHeader sends a wrong Content-Type header. The header title regex also matches `<titleStmt>`.
- `deduplication`: TITLE_EXACT reported as TITLE_FUZZY, TITLE_YEAR never produced, no re-resolve guard.
- `invitations`: accept/reject/cancel have no ownership or status check. expiredAt never enforced. Status 1 never written.
- `audit`: AuditService.log has no callers. Admin view shows fabricated seed logs when empty.
- `core-governance`: deleteReviewNeed does not remove the projects subcollection copy, so deleted needs reappear.
- `agent-access`: no agent delete. Token endpoint returns the decrypted token to any project owner (by design). Task listing uses an unordered project query.
- `exclusion-reasons`: no admin check; createBulk has no validation.
- `master-sources`: no pagination; usage counts scan all search sources on every list.
- `auth`: register can create a Firestore profile under a fake uid with no Firebase user (silent fallback); no logout; no duplicate-email check.

## Phụ lục C: slr-be modules (notifications → users)


Repo: `slr-be` (Express + TypeScript, Firebase Admin / Firestore). All HTTP routes are mounted under `/api` (see `src/app.ts` line 28). Mount table is in `src/routes.ts`. Auth = `requireAuth` (Firebase token, global roles from custom claims; `ADMIN` = global admin). Project roles are read from `projects/{id}/members/{uid}.role` and normalized by `normalizeProjectRole` (`src/middleware/role.middleware.ts`): `OWNER` (legacy `ADMIN` maps to OWNER), `LECTURER`, `REVIEWER`. `requireProjectRole(X)` lets OWNER through everywhere; otherwise the role must equal X exactly (so `LECTURER` is NOT allowed where `REVIEWER` is required). Global ADMIN and the `ownerId` on the project doc are treated as OWNER. Member-less owners are also accepted.

Shared conventions:
- Response envelope usually `{ success, isSuccess, data, message, errors }`; some older handlers return `{ success, data }` only.
- Validation: `validate(zodSchema)` (`src/middleware/validation.middleware.ts`) parses `{body, query, params}` and REPLACES `req.body`/`req.query`/`req.params` with the parsed (zod-stripped) values, so unknown body keys are dropped.
- Upload limits: `upload` (multer memory) = 50 MB; `paperImportUpload` = 10 MB.
- Process ids: `rp_{projectId}` (review process) and `sp_{projectId}` (study selection) are prefix-stripped; a raw projectId is also accepted.
- Phase/status numeric convention used by project phases and processes: 0 = NotStarted, 1 = InProgress, 2 = Completed.

Cross-cutting findings (highest impact first; details in each section):
1. Study-selection endpoints (`/api/study-selection/...`) check only project membership, not role. Any member (including REVIEWER) can start/complete the process, add exclusion reasons, run AI evaluation, submit decisions and resolve conflicts. The canonical `/api/projects/:id/screening/...` routes do enforce roles (resolve = OWNER only).
2. Missing membership checks (any authenticated user, no project membership): `GET /api/candidate-papers`, `POST /api/candidate-papers/select|reject`, `GET /api/papers/:paperId/candidates|candidate-papers`, `POST /api/papers/:paperId/extract-references`. `candidate-papers.service.ts` has no membership or role check at all. `selectCandidates` writes new papers into whatever `projectId` is given in the body.
3. Blind-review leak: `ScreeningService.getDecisions` tries to show a REVIEWER only their own votes by reading `req.projectRole`, but nothing sets that property (the middleware sets `req.projectContext.role`). The branch is dead, so `GET /api/projects/:projectId/screening/:paperId/decisions` (MEMBER) returns every reviewer's vote to any REVIEWER.
4. `PATCH /api/users/:userId/status` (deactivate/reactivate any user) and `PUT /api/users/:userId/profile` (edit any user) require only `requireAuth` (no global-admin or self check). `GET /api/users/`, `/search`, `/export/excel` (CSV with emails) have no admin check either.
5. `POST /api/papers/:paperId/extract-references` returns HARD-CODED sample references (Kitchenham & Charters, Wohlin, Smith et al.) and persists them as candidates. Not real extraction.
6. `POST /api/prisma/reports/cleanup` keeps the OLDEST report and deletes every newer one, including the latest.
7. Study-selection AI evaluation reads research questions and inclusion/exclusion criteria from the PROJECT ROOT document (`projectData.inclusionCriteria` / `criteria.inclusion`). Current code writes these to `projects/{id}/protocol/main` (protocol module, ai-setup module), so the AI prompt is likely given empty criteria.
8. `review-needs.routes.ts` (projects module) is imported in `routes.ts` but NEVER mounted (dead). Live review-needs endpoints are in core-governance (`/api/core-govern/review-needs/...`, GET without auth, POST/DELETE with `requireAuth` only).
9. Legacy `studySelectionRouter` block in `routes.ts` (decision / decisions / resolve under `/api/study-selection`) is fully shadowed by `study-selection.routes.ts` (same paths, registered first), so it is dead code.


---

#### 1. notifications

Purpose: per-user in-app notification inbox (read/unread). No producers exist at runtime.

Files (3): `notifications.controller.ts` (42 lines), `notifications.routes.ts` (14), `notifications.service.ts` (56).

Endpoints (mount `/api/notifications`, all `requireAuth`, user = token uid):
- `GET /api/notifications/` - newest 50 notifications for caller (`orderBy createdAt desc, limit 50`, hard-coded default).
- `GET /api/notifications/unread-count` - returns integer count of `read == false` within the same newest-50 window (so the count is capped at 50).
- `PATCH /api/notifications/:notificationId/read` - sets `read: true` on `users/{uid}/notifications/{id}`. No existence check; Firestore `update` throws NOT_FOUND for unknown ids.

Firestore: `users/{uid}/notifications/{notifId}` (only subcollection; no top-level).

Model `UserNotification`: `id, userId, projectId?, type: string, title, message, read: boolean, createdAt`.

Rules / gaps:
- `NotificationsService.send()` exists but has zero callers in `src` (only `scripts/seed.ts` writes notifications). Nothing in the app creates notifications, so the inbox is effectively empty except for seed data.
- No delete, no pagination cursor, no "mark all read".

#### 2. upload

Purpose: generic admin-only file upload to Firebase Storage.

Files (1): `upload.routes.ts` (49 lines). Handler is inline, no controller/service.

Endpoints (mount `/api/upload`):
- `POST /api/upload/` - `requireAuth` + `requireGlobalAdmin` (403 "Only global admins can manage this resource" otherwise). Multipart field `file` (required, 50 MB). Optional form field `folder` (default `slr-system/uploads`). Stored name `${Date.now()}-${originalname}`. Calls `uploadToFirebaseStorage(buffer, folder, fileName, mimetype)` from `src/config/firebase-storage.ts`. Response `data = { url, secure_url, public_id, bytes, original_filename }`.

Firestore: none. Storage: Firebase Storage.

Rules / gaps:
- `folder` is client-controlled (path injection into storage keys; admin-only mitigates).
- Field names `secure_url` / `public_id` are Cloudinary-era names kept for FE compatibility.
- Paper PDFs and metadata do NOT use this path; they go to Cloudinary (see papers / paper-import).

#### 3. users

Purpose: user profile sync, lookup, and admin-ish user management.

Files (4): `users.controller.ts` (138), `users.routes.ts` (21), `users.service.ts` (202), `users.schemas.ts` (9).

Endpoints (mount `/api/users`, router-level `requireAuth`):
- `POST /api/users/sync` - body `{ email (email, required), displayName? (min 1), photoURL? (url) }`. Creates/updates `users/{uid}` from token uid. Extra keys like `globalRole` are stripped by zod, so clients cannot self-promote here.
- `GET /api/users/me` - returns profile; creates doc if missing (`globalRole` derived from token: `ADMIN` if token has ADMIN else `USER`); 404 "User profile could not be created" if still absent.
- `GET /api/users/search` - keyword search over users (`searchUsers(keyword)`). No role check.
- `GET /api/users/export/excel` - CSV (`users_export.csv`) of ALL users: id, fullName, username, email, role, Active/Inactive, createdAt. No admin check.
- `PUT /api/users/:userId/profile` - body `{ fullName?, email?, username? }`. No self/admin check.
- `PATCH /api/users/:userId/status` - toggles `isActive`. No admin check.
- `GET /api/users/` - paged list; query `search`, `isActive` (string 'true'/'false'), `pageNumber`, `pageSize`. Loads the whole `users` collection and filters in memory. No admin check.

Firestore: `users/{uid}` (read/write). Only the users module and the project/study-selection membership lookups read it.

Model `UserProfile` (service): `id, fullName, username, email, isActive (default true unless === false), role, globalRole ('ADMIN' | 'USER'; role mirrors globalRole), createdAt, updatedAt`.

Rules / gaps:
- Toggle is a plain flip: `isActive = (existing.isActive === false) ? true : false`.
- Status and profile edits are not restricted to self or admin (see cross-cutting #4).
- Users with `isActive: false` are NOT blocked from auth in this module; check `requireAuth` if deactivation is expected to block login.

#### 4. projects

Purpose: project (SLR) lifecycle, members, OSF registration import, and project-level read endpoints (review process, PICOC/RQ read-throughs, invitations).

Files (8): `projects.controller.ts` (521), `projects.service.ts` (683), `projects.routes.ts`, `projects.schemas.ts` (72), `project-membership.ts` (15, `mergeProjectMemberIds` helper: no cap across projects), `osf-registration.parser.ts` (147, parses OSF registration text into sections, `GSRRF-*` ids, criteria `I1..`), `review-needs.routes.ts` (55, DEAD, not mounted), `review-needs.service.ts` (42, only used by the dead route).

Endpoints (mount `/api/projects`, router-level `requireAuth`):
- `GET /api/projects/` and `GET /api/projects/my` - list caller's projects (system ADMIN sees all).
- `GET /api/projects/export/excel` - export.
- `POST /api/projects/` - any authenticated user; body `name` or `title` required (refine), `description?` (<=2000), `domain?`, name/title <=200. Creator becomes OWNER (member doc role `OWNER`), status `PLANNING`.
- `POST /api/projects/from-osf-file` - multipart `file`. Parses OSF registration; creates project, writes `projects/{id}/protocol/main` with `source: OSF_REGISTRATION`, `osfRegistration`, `osfScan { totalExpectedSections: 65, importedSectionCount, missingSectionIds, authorCompletionSectionIds }`; creates a review need from `registration.background` (via core-governance service).
- `GET /api/projects/:projectId` - MEMBER.
- `PUT /api/projects/:projectId` - OWNER. body: `name?` (1..200), `description?` (<=2000), `domain?`, `status?` enum `PLANNING|IDENTIFICATION|SCREENING|EXTRACTION|SYNTHESIS|COMPLETED`.
- `PUT /api/projects/:projectId/dates` - OWNER. `startDate?`, `endDate?` (string | null).
- `POST /api/projects/:projectId/activate` - OWNER. `PLANNING -> IDENTIFICATION`; any other status is returned unchanged.
- `POST /api/projects/:projectId/complete` - OWNER. Sets `COMPLETED`. No precondition check on phases.
- `POST /api/projects/:projectId/archive` - OWNER. Sets `ARCHIVED`. (Public OSF/API list filters ARCHIVED out.)
- `DELETE /api/projects/:projectId` - OWNER (service also allows system ADMIN). Deletes the project document only; subcollections are not removed by this code.
- `GET /api/projects/:projectId/review-processes` - MEMBER. Returns the review-process overview (see review-processes).
- `POST /api/projects/:projectId/review-processes` - OWNER. body `name` (trim, 1..200), `notes?` (<=5000, nullable). Transaction: 404 if no project, 403 unless owner/member OWNER/ADMIN, 409 `REVIEW_PROCESS_EXISTS` if `reviewProcess` already on the doc. Writes `reviewProcess = { id: rp_{projectId}, projectId, name, notes, createdBy, createdAt, updatedAt }`.
- `GET /api/projects/:projectId/picos` and `/picocs` - MEMBER. Reads `aiSetup` doc (`picoc` object: population, intervention, comparator, outcome, context). Returns single-element array when any field non-empty.
- `GET /api/projects/:projectId/research-questions` and `/search-questions` - MEMBER. Reads `aiSetup` researchQuestions (`questionText`).
- `GET /api/projects/:projectId/my-membership` - `requireAuth` only (self-scoped). Returns `role` as number (OWNER=1, LECTURER=2, REVIEWER=3) plus `roleText`, `isLeader`. Owner (or system ADMIN) => OWNER.
- `GET /api/projects/:projectId/members` - MEMBER.
- `POST /api/projects/:projectId/members` - OWNER. body `userId`, `role` in `LECTURER | REVIEWER` (cannot add OWNER this way), `email?`. Owner id cannot be re-added (403 "The project creator must remain the project owner").
- `PUT /api/projects/:projectId/members/:userId` - OWNER. body `role` in `OWNER | LECTURER | REVIEWER`. Setting OWNER transfers `ownerId` and demotes the previous owner member doc to `REVIEWER`. Changing the current owner's role to non-OWNER is refused ("Assign another project leader before changing the current leader role").
- `DELETE /api/projects/:projectId/members/:userId` - OWNER. Owner cannot be removed (403).
- `POST /api/projects/:projectId/invitations` - OWNER. Delegates to invitations module.
- `GET /api/projects/:projectId/invitations` - MEMBER (`?status`).

Firestore:
- `projects/{id}` fields seen: `name, title, description, domain, status, ownerId, memberUserIds, startDate, endDate, createdAt, updatedAt, osfImport {sourceDocumentId, timelineEventId}`, plus phase objects written by other modules: `reviewProcess`, `studySelection {status, statusText, startedAt, completedAt, updatedAt}`, `qualityAssessment`, `dataExtraction`, `synthesis`, `identification` (status defaults for identification = 2 when absent).
- `projects/{id}/members/{uid}` `{ role, fullName, email, updatedAt }` (read by collectionGroup('members') once in service).
- `projects/{id}/protocol/main` (written by OSF import).
- `projects/{id}/aiSetup` (PICOC / RQ read-throughs).
- `projects/{id}/reviewNeeds/{id}` (review-needs service, dead route only; core-governance also writes it, see below).
- `users/{uid}` read for member profile.

Model `ProjectData.status`: `PLANNING | IDENTIFICATION | SCREENING | EXTRACTION | SYNTHESIS | COMPLETED | ARCHIVED` (ARCHIVED not in update schema). Project roles: `OWNER | LECTURER | REVIEWER`.

Rules / gaps:
- Creation is open to any authenticated user (intended per comment).
- `getActivatedProjectStatus`: only PLANNING changes.
- `complete` does not check that phases are complete, while review-processes complete does not either.
- Review needs created at OSF import go through core-governance (top-level `reviewNeeds` plus `projects/{id}/reviewNeeds`, both written). The projects-local review-needs code is dead.
- PICOC/RQ endpoints read `aiSetup`, but protocol module (`protocol/main`) holds a different PICO shape (see protocol). Two sources of truth.
- Invitations are out of scope here (invitations module).

#### 5. protocol

Purpose: SLR protocol document (research questions, PICO, inclusion/exclusion criteria) stored as a single doc per project.

Files (4): `protocol.controller.ts` (27), `protocol.routes.ts` (16), `protocol.schemas.ts` (38), `protocol.service.ts` (49).

Endpoints (mount `/api/projects/:projectId/protocol`, `requireAuth`):
- `GET /api/projects/:projectId/protocol/` - MEMBER. 404 "Protocol document not found" if `protocol/main` missing.
- `PUT /api/projects/:projectId/protocol/` - OWNER. Body (zod, all optional except inner required fields):
  - `researchQuestions[]`: `{ id, code?, question (min 1), rationale? }`
  - `pico`: `{ population[], intervention[], comparison[], outcome[], context[] }` (each defaults to `[]`)
  - `inclusionCriteria[]`, `exclusionCriteria[]`: `{ id, code?, description (min 1) }`
  Service does `set(payload, { merge: true })` with `updatedAt`, then re-reads.

Firestore: `projects/{id}/protocol/main` (single doc). Also written by `ai-setup` (`pico`, `researchQuestions`, `updatedAt`) and by OSF import (`osfRegistration`, `osfScan`, `source`).

Model `ProtocolData`: `researchQuestions[], pico{population, intervention, comparison, outcome, context}, inclusionCriteria[], exclusionCriteria[], updatedAt`.

Rules / gaps:
- Top-level merge: any array provided replaces the whole array (no per-item merge). No uniqueness check on item ids.
- Shape mismatch with aiSetup PICOC (`comparator` string vs `comparison` array). Two representations of the same PICO.
- `study-selection` AI evaluation reads criteria from the project root document, not from this doc (see cross-cutting #7). `ai.controller` and `agent-access` read `protocol` first, then project root.

#### 6. papers

Purpose: core paper (record) model per project: list/detail/create/delete, PDF upload entry points, full-text Markdown, statistics, and candidate (reference) suggestions. This is the largest module in scope.

Files (21): `papers.controller.ts` (212), `papers.service.ts` (838), `papers.routes.ts` (46), `papers.schemas.ts` (75), `papers.types.ts` (61), `paper-assets.ts` (252, Cloudinary metadata/PDF asset helpers), `paper-markdown.ts` (146, `slr-paper-metadata-v1` / full-text markdown rendering), `paper-fulltext.controller.ts` (187), `paper-statistics.controller.ts` (116), `paper-statistics.routes.ts` (21), `paper-statistics.service.ts` (274), `paper-statistics.types.ts` (36), `candidate-papers.controller.ts` (149), `candidate-papers.routes.ts` (19), `candidate-papers.service.ts` (535), `candidate-papers.types.ts` (42), `paper-discovery.routes.ts` (25, stubs).

Endpoints:
Project-scoped (mount `/api/projects/:projectId/papers` and alias `/api/project/:projectId/papers`, router-level `requireAuth`):
- `GET /` - MEMBER. Query: `status?` (IMPORTED|DUPLICATE|SCREENING_TITLE_ABSTRACT|SCREENING_FULL_TEXT|INCLUDED|EXCLUDED), `limit` (1..100, default 50), `cursor?`, `searchText?`, `keyword?`, `yearFrom?`, `yearTo?`, `searchSourceId?`, `importBatchId?`, `doiState?` (all|has|missing), `fullTextState?`, `onlyUnused?` (bool), `recentlyImported?` (bool), `pageNumber?`, `pageSize?` (1..100). Passthrough extra keys.
- `POST /` - LECTURER. `createPaperSchema`: `title` (min 1), `abstract?`, `authors[]` (string or `{name, affiliation?}`), `doi?`, `year?` (int), `journal?`, `source` (default MANUAL).
- `POST /import` - LECTURER. `importPapersBatchSchema`: `source` (required), `papers[]` min 1 with `title`, `abstract?`, `authors?`, `doi?`, `year?`, `journal?`, `sourceId?`.
- `GET /papers-with-candidates` - MEMBER (candidate summaries per paper).
- Stats (all MEMBER, in-memory aggregation over all papers): `GET /overview`, `/by-year`, `/publication-types`, `/top-journals` (top 10), `/top-conferences` (top 10), `/top-publishers` (top 10), `/languages`, `/fulltext-status`, `/top-keywords` (top 20), `/data-quality`.
- `GET /:paperId/fulltext-markdown` - MEMBER. 404 if no PDF; 202 while processing; 409 otherwise when not available.
- `GET /:paperId` - MEMBER.
- `POST /:paperId/pdf` - LECTURER. Multipart `file` (50 MB). Uploads PDF to Cloudinary (raw), then enqueues GROBID processing (`tryEnqueuePdfProcessing`). Response contains ticket/processing info.
- `DELETE /:paperId` - OWNER.

Global (mounted in `routes.ts`, `requireAuth`, membership checked in service where noted):
- `POST /api/papers/assign` - legacy FE contract. Body (zod `assignPapersSchema`): `paperIds[] (min 1)`, `memberIds[]` (exactly 2), `studySelectionProcessId`, `phase` (coerce int, 1..2). Service requires caller to be project OWNER (or global ADMIN). See rules.
- `GET /api/papers/:paperId` - membership via `getByIdGlobal`.
- `DELETE /api/papers/:paperId` - permission checked in service.
- `GET /api/papers/:paperId/candidates` and `/candidate-papers` - NO membership check.
- `POST /api/papers/:paperId/extract-references` - NO membership check; returns hard-coded samples (see Notable).
- `GET /api/papers/top-cited`, `GET /api/papers/:paperId/references|citations|graph|suggestions` - stubs: return `[]` / `{nodes:[], edges:[]}`. Comment: "Citation/reference persistence is not part of the unified BE schema yet."
- `GET /api/candidate-papers/` - `getCandidatesByReviewProcess` (`status` filter). NO membership check.
- `POST /api/candidate-papers/select` - body `{ projectId, candidateIds[] }`. Promotes candidates to new papers (status IMPORTED) in the given project. NO membership check.
- `POST /api/candidate-papers/reject` - body `{ candidateIds[] }`. Sets Rejected. NO membership check.
- Paper-fulltext routes (controller here, mounted in `routes.ts`, `requireLecturerForFulltext` takes projectId from body/query): `POST /api/paper-fulltext/upload` (multipart `File`), `/upload-pdf` (`file`), `/upload-signature`, `/finalize-upload`, `/:paperId/extract-metadata` (retries GROBID job; 202).

Firestore:
- `projects/{id}/papers/{paperId}` (operational fields; see Model).
- `projects/{id}/papers/{paperId}/candidates/{candidateId}` (candidate subcollection).
- `candidate_papers/{candidateId}` (top-level candidate index).
- `projects/{id}/importBatches/{batchId}` `{ id, source, count, createdAt }`.
- `projects/{id}/members/{uid}` (role checks in assign).
- `projects/{id}/reviewProcessPapers/{paperId}` (assignment doc; assign writes `reviewerIds`, `memberIds`, `phase`, `reviewersAssignedBy`, `reviewersAssignedAt`, `updatedAt`).
- `projects/{id}/duplicatePairs` (duplicate detection, shared with deduplication module).
- `collectionGroup('papers')` queries: used by `findPaperLocation` (candidate & global paper lookups), which is a full scan.
- `users/{uid}` (assign: global role check).

Model `Paper` (`papers.types.ts`):
- `id, projectId, title, normalizedTitle, abstract?, authors: (string | {name, affiliation?})[], doi?, normalizedDoi?, year?, journal?, source ('MANUAL'|'FILE_UPLOAD'|'CROSSREF'|'RIS'|'BIBTEX'|'PDF'|...), sourceId?, importBatchId?, status: PaperStatus, isDuplicate, duplicateOfPaperId?, pdf? (PaperPdfMetadata), pdfUrl?, pdfFileName?, metadataFile? (PaperAsset), isConflict?, conflictResolvedBy?, conflictResolvedReason?, exclusionReasonId?, screeningStage? ('TITLE_ABSTRACT'|'FULL_TEXT'), createdAt, updatedAt`.
- `PaperStatus = IMPORTED | DUPLICATE | SCREENING_TITLE_ABSTRACT | SCREENING_FULL_TEXT | INCLUDED | EXCLUDED`.
- `PaperPdfMetadata`: `storagePath, fileName, sizeBytes, uploadedAt, processingStatus (PENDING|PROCESSING|COMPLETED|FAILED), grobidExtracted?, url?, processingJobId?, processingError? {code,message}, fullText? (FullTextInfo), provisionalTitle?`.
- Candidate statuses (`CandidateStatus`): `0 Detected`, `1 Matched`, `2 Rejected`, `3 Suggested`.
- Candidate DTO fields: `candidateId, originPaperId, originPaperTitle, title, authors?, publicationYear?, doi?, rawReference?, status, statusText, confidenceScore, extractionQualityScore, matchConfidenceScore, isSelectedInProjectRepository, validationNote?`.

Storage model (important):
- Firestore paper doc stores operational fields only. Bibliographic fields (`title, normalizedTitle, abstract, authors, doi, normalizedDoi, year, journal, source`) are stripped by `paperRecord()` and kept in a Cloudinary raw "metadata file" (`metadataFile`, markdown with schema `slr-paper-metadata-v1`). `hydratePapers()` fetches each file (8 concurrent) on every list or detail read. Firestore cannot filter/sort on title/year/doi, so `listPaperPool` loads ALL papers and filters/paginates in memory (`needsMetadataFilter` forces hydrating everything).
- PDFs are in Cloudinary (`[projectSlug][paperSlug][timestamp]` base names; delivery URL helpers in `paper-assets.ts`).

Business rules:
- `isPaperPoolVisible(p) = p.status !== 'DUPLICATE' && p.isDuplicate !== true` (used by pool, review-process, study-selection, PRISMA counts).
- `assignPapers` (legacy `/api/papers/assign`): caller must be project OWNER (or global ADMIN). Exactly 2 member ids. Both members must exist (owner id tolerated without member doc) and each member's normalized role must be `LECTURER` or `REVIEWER`, and both roles must be identical (owner-role members rejected unless global ADMIN). Every paper must already exist in `reviewProcessPapers` (else 400 `PAPER_NOT_IN_REVIEW_PROCESS`). Writes `reviewerIds` and `memberIds` (same array), `phase`. Note the phase range in the schema (1..2) differs from the 0/1 convention used by screening and study-selection.
- `importBatch`: creates batch doc and papers with `status: IMPORTED, isDuplicate: false`, each with metadata file upload; rolls back uploaded metadata on failure. No duplicate detection in this path (dedupe lives in the paper-import bibliography path and deduplication module).
- `listPaperPool`: order `createdAt desc`; default `pageSize` 25 (max 100); `recentlyImported` = last 7 days; `onlyUnused` is a no-op (returns true; comment says review-process assignment is stored outside the paper doc, so the flag is reserved).
- Delete: project route needs OWNER. Global delete checks owner/creator permission in the service.
- Full-text Markdown: 202 while GROBID is pending, 409 when failed or not applicable.

Notable TODO / incomplete:
- `extractReferences` persists three HARD-CODED sample references per paper (`cand_{paperId}_{1..3}`) with fixed confidences, into both the paper subcollection and `candidate_papers`. Real reference extraction (GROBID references) is not wired here.
- `findPaperLocation` does `collectionGroup('papers').get()` (full scan of every paper in every project) for candidate and global lookups.
- `getPapersWithCandidates`: `duplicateCount` counts `Matched` candidates (label mismatch).
- Discovery endpoints (`top-cited`, references, citations, graph, suggestions) are stubs that return empty data.
- Statistics read every paper into memory per request (no aggregation queries).

#### 7. paper-import

Purpose: import papers from files (RIS, BibTeX, PDF), DOI, Crossref search, and a public API-key upload path (Cloudinary direct upload).

Files (6): `paper-import.controller.ts` (136), `paper-import.routes.ts` (38), `paper-import.schemas.ts` (42), `paper-import.service.ts` (500), `paper-parser.util.ts` (224: `parseRis`, `parseBibTex`, `parseCsv`; CSV parser exported but not routed), `public-paper-import.routes.ts` (194).

Endpoints:
Project-level (mount `/api/papers` via `router.use('/papers', paperImportRoutes)`, router `requireAuth`; project from body `projectId`, role LECTURER):
- `POST /api/papers/import/ris` - multipart `file` (10 MB), body `projectId`. Parses RIS, drops empty-title rows (skipped), drops duplicates against existing papers in project (`deduplicationService.findDuplicateInList`), imports rest. 201 with `{importBatchId, totalRecords, importedRecords, duplicateRecords, skippedRecords, updatedRecords, errors, importedPaperIds}`.
- `POST /api/papers/import/bibtex` - same flow for BibTeX.
- `POST /api/papers/import/pdf` - multipart `file` (10 MB). `importPdf`: validates PDF (`assertUploadablePdf`), creates paper with PROVISIONAL title from file name (`provisionalTitle: true`), uploads PDF, enqueues GROBID (`tryEnqueuePdfProcessing`). Errors: `NO_IMPORTABLE_PAPERS`.
- `POST /api/papers/import/doi` - body `{ doi (min 1), projectId, searchSourceId? }`. Crossref lookup (`getWorkByDoi`), maps to paper, `importBatch(source CROSSREF)`. NO duplicate check (importing the same DOI twice creates two papers). Errors: `INVALID_DOI`, `DOI_NOT_FOUND` (404), `CROSSREF_LOOKUP_FAILED`.
- `POST /api/papers/import/cross-ref` - body `{ query: {query, queryAuthor, queryTitle, rows (1..100), offset, cursor, sort, order}, projectId, searchSourceId? }`. Runs Crossref search and imports ONLY the FIRST hit (`items.slice(0, 1)`). Returns 200 with zero counts when no hit.
- `GET /api/works/` - `requireAuth`. Crossref search (`crossrefSearchSchema`: query, queryAuthor, queryTitle, rows, offset, cursor, sort, order, projectId?). When `projectId` is given, marks works already present in the project. Errors: `CROSSREF_SEARCH_FAILED`.
- `GET /api/works/:doi(*)` - `requireAuth`. Work detail (optional `projectId`). Mount `/api/works`.

Public (mount `/api/public/papers`, `requirePublicApiKey` = header `X-API-Key` checked against `PUBLIC_UPLOAD_API_KEY` with constant-time compare):
- `GET /api/public/papers/projects` - lists non-ARCHIVED projects (`id, name, description, status, createdAt`).
- `POST /api/public/papers/upload-signature` - body `projectId`, `fileName`. Returns Cloudinary signed-upload params (raw resource, folder `slr-system/projects/{projectId}/papers`, expected public id, `baseName`). 404 if project missing.
- `POST /api/public/papers/finalize-upload` - body `projectId, baseName, publicId, secureUrl, fileName, bytes|sizeBytes?, metadata? {title, doi, abstract, authors[], year, journal}`. Creates paper after direct upload; GROBID queued. 201.
- `POST /api/public/papers/upload-pdf` - legacy proxy, multipart `file` (must be PDF by mimetype or `.pdf` name), body `projectId`. 201.

Firestore: `projects/{id}` (existence), `projects/{id}/papers` (read for dedupe, write for import), `projects/{id}/importBatches` (via papers service). GROBID jobs go to top-level `pdfProcessingJobs`. Metadata and PDFs go to Cloudinary.

Rules:
- Bibliography dedupe (RIS/BibTeX only) uses `DeduplicationService` against existing papers and within the batch; DOI and import paths do not.
- Parser output `ParsedPaper` carries `searchSourceId` when provided.
- BOM stripped (`﻿`) before parsing.
- `NO_IMPORTABLE_PAPERS` 400 when file yields zero rows.

#### 8. paper-pool

Purpose: the project's candidate paper pool "sources" (search databases/master sources), saved filter presets, and search-source strategies used to bulk-filter papers.

Files (3): `paper-pool.controller.ts` (181), `paper-pool.routes.ts` (69), `paper-pool.schemas.ts` (24).

Endpoints (mount `/api/projects/:projectId` for project routes; top-level router at `/api`):
- `GET /api/projects/:projectId/sources` - MEMBER. All `searchSources` of project.
- `GET /api/projects/:projectId/filter-metadata` - MEMBER. `{ searchSources, importBatches }`.
- `GET /api/projects/:projectId/filter-settings` - MEMBER.
- `GET /api/projects/:projectId/filter-settings/:filterId` - MEMBER. 404 "Saved filter not found".
- `POST /api/projects/:projectId/filter-settings` - LECTURER. body `name` (trim 1..200), `searchText?`, `filters` (record, default `{}`).
- `PUT /api/projects/:projectId/filter-settings/:filterId` - LECTURER. Same schema, `update`.
- `DELETE /api/projects/:projectId/filter-settings/:filterId` - LECTURER.
- `GET /api/master-sources/available` - (paper-pool version: configured sources merged with defaults; `masterSearchSources where isActive == true`). NOTE: `routes.ts` registers `masterSourcesController.getAvailable` at the same path BEFORE mounting this router, so this handler is shadowed (dead).
- `POST /api/search-sources` - LECTURER (project from body `projectId`). `searchSourceSchema`: `sourceId?`, `masterSourceId?`, `projectId` (required), `name` (trim 1..500), `url` (URL or `''`, default `''`), `strategies?` (unknown[]). Upsert with `merge`.
- `POST /api/search-sources/bulk` - LECTURER. Body = array of the same objects; all must share one `projectId` (400 "All search sources must belong to the same project"); batch upsert with `createdAt/updatedAt`.
- `PUT /api/search-sources/:sourceId/strategies` - LECTURER (project resolved via collectionGroup('searchSources') lookup by document id; 404 if absent). Body stored as-is in `strategies` (no schema).

Firestore:
- `projects/{id}/searchSources/{sourceId}` `{ projectId, name, url, masterSourceId?, sourceId?, strategies[], createdAt, updatedAt }`.
- `projects/{id}/filterSettings/{filterId}` `{ name, searchText?, filters: Record<string, unknown> }`.
- `projects/{id}/importBatches` (read for filter metadata).
- `masterSearchSources/{id}` (top-level, read where `isActive == true`).
- `collectionGroup('searchSources')` (lookup by `__name__`).

Filter keys consumed by review-processes `add-from-filter-setting`: `keyword, yearFrom, yearTo, searchSourceId, importBatchId, doiState, fullTextState, onlyUnused, recentlyImported` + `searchText`.

Rules / gaps:
- Filter preset `filters` is free-form (no per-key schema); unknown keys ignored downstream.
- `listSources` returns all sources, no pagination.
- No validation of `strategies` shape.

#### 9. pdf-processing

Purpose: durable background queue for GROBID full-text extraction of paper PDFs (worker runs in the API process).

Files (5): `pdf-processing.worker.ts` (388), `pdf-processing.service.ts` (91), `pdf-processing.types.ts` (35), `extraction-status.ts` (42), `index.ts` (4).

Endpoints: none directly. Triggered by:
- `papers.controller.uploadPdf` (`POST /api/projects/:projectId/papers/:paperId/pdf`) via `tryEnqueuePdfProcessing`.
- `paper-fulltext.controller` (`uploadPdf`, `finalizeUpload`, and `extractMetadata` which calls `retryPdfProcessing`, i.e. `POST /api/paper-fulltext/:paperId/extract-metadata`).
- `paper-import.service` (`importPdf`, `finalizeDirectPdfImport`).
- Worker started in `src/server.ts` (`pdfProcessingWorker.start()`), stopped on shutdown.

Firestore:
- `pdfProcessingJobs/{projectId}__{paperId}` (top-level; deterministic id). Fields: `id, projectId, paperId, pdfPublicId, claimToken?, status (PENDING|PROCESSING|COMPLETED|FAILED), attempts, maxAttempts, nextAttemptAt, leaseUntil?, lastError? {code, message, retryable?}, createdAt, updatedAt, startedAt?, finishedAt?`.
- `projects/{id}/papers/{paperId}` fields updated: `pdf.processingStatus`, `pdf.processingJobId`, `pdf.processingError`, `pdf.fullText`, `pdf.grobidExtracted`. GROBID metadata merged fill-only into bibliography.

Rules (`pdf-processing.worker.ts` constants):
- Enqueue resets paper's `pdf.processingStatus = PENDING` and clears error/fullText; transaction throws 409 `PDF_REPLACED` if the stored storagePath changed. Re-enqueue replaces the job (same id).
- `maxAttempts` = env `PDF_PROCESSING_MAX_ATTEMPTS` (default 3, range 1..10).
- Poll every 60 s (`scan` picks `PENDING|PROCESSING` jobs due or with expired lease). Worker is in-memory (queue/active/timers), so it assumes a single API instance.
- Lease = download 60 s + `GROBID_FULLTEXT_TIMEOUT_MS` (default 180 s) + 180 s grace. An expired lease found at claim time fails the job NON-retryable ("Processing did not finish before the lease expired").
- Download cap: `PDF_PROCESSING_MAX_BYTES` (default 50 MB).
- Retryable failure: back to `PENDING` with `nextAttemptAt = now + 30 s * 2^(attempts-1)` until `attempts >= maxAttempts`, then `FAILED`.
- `GROBID_UNAVAILABLE`: retry every 60 s and does NOT consume an attempt (attempts decremented back).
- Superseded job (PDF replaced or paper deleted): job set `COMPLETED` with `lastError.code = SUPERSEDED`, paper not updated.
- Fencing: `claimToken` guards in-flight attempts; `updatePaperIfCurrent` only writes if storagePath/job id still match.
- `ExtractionStatus` (`toExtractionStatus`) maps paper pdf state for the FE: `not_requested | pending | succeeded | failed | partial` (partial when fullText.status = PARTIAL). Used by study-selection `toPaperResponse` (`extraction`).

Notable: no TODO. Lives in-process (not a separate worker), so multi-instance deployments would double-process unless leases coordinate (leases do exist, claim is transactional).

#### 10. prisma

Purpose: PRISMA 2020 flow numbers, versioned PRISMA report snapshots, and DOCX export.

Files (6): `prisma.controller.ts` (131), `prisma.routes.ts` (20), `prisma.service.ts` (270), `prisma.calculator.ts` (44), `prisma.types.ts` (58), `prisma-report.generator.ts` (633, docx builder).

Endpoints (mount `/api/projects/:projectId/prisma`, `requireAuth`, ALL `requireProjectRole('MEMBER')` so REVIEWERs can read/generate):
- `GET /api/projects/:projectId/prisma/` - live statistics (`calculateLiveStatistics`, not persisted).
- `POST /api/projects/:projectId/prisma/reports` - body `version?`, `notes?`, `generatedBy?`. Returns 201 with formatted report. (`force` is supported in the service but not exposed by the controller.)
- `GET /api/projects/:projectId/prisma/reports` - list snapshots, newest first (`totalRecords` = recordsIdentified).
- `GET /api/projects/:projectId/prisma/reports/latest` - latest snapshot; if `?format=docx` returns DOCX. If no report exists, AUTO-CREATES a `1.0` baseline (`generatedBy: 'System (Baseline)'`) as a GET side effect.
- `GET /api/projects/:projectId/prisma/reports/latest/docx` - DOCX of latest.
- `GET /api/projects/:projectId/prisma/reports/:reportId` - snapshot (`?format=docx` also works); null-safe 404 path.
- `GET /api/projects/:projectId/prisma/reports/:reportId/docx` - DOCX of snapshot (falls back to latest, then to live stats).
- `POST /api/projects/:projectId/prisma/reports/cleanup` - deletes duplicates (see rules).

Firestore:
- `projects/{id}/prismaReports/{reportId}` `{ id, projectId, version, generatedBy, generatedAt, notes, statistics }`.
- Reads: `projects/{id}/papers` (count aggregations `isDuplicate == true`, `status == ...`, total count), `projects/{id}` (title for DOCX).

Model `PrismaStatistics`: `recordsIdentified, duplicatesRemoved, recordsScreenedTitleAbstract, recordsExcludedTitleAbstract, reportsSoughtForRetrieval, reportsNotRetrieved, reportsAssessedForEligibility, reportsExcludedFullText, studiesIncluded`.
Formatted report nodes: `RecordsIdentified` (side box `DuplicateRecordsRemoved`), `RecordsScreened` (side `RecordsExcluded`), `ReportsSoughtForRetrieval` (side `ReportsNotRetrieved`), `ReportsAssessed` (side `ReportsExcluded`), `included` = `StudiesIncludedInReview`.

Calculation (`calculateLiveStatistics`):
- identified = count of ALL paper docs (includes duplicates).
- duplicatesRemoved = count `isDuplicate == true`.
- screened = identified - duplicates.
- passedTitleAbstract = count(status SCREENING_FULL_TEXT) + count(status INCLUDED).
- excludedTitleAbstract = max(0, screened - passedTitleAbstract). This lumps undecided and conflict papers in TA as "excluded" (approximation).
- reportsSought = passedTitleAbstract; reportsNotRetrieved HARD-CODED 0.
- reportsAssessed = passedTitleAbstract; reportsExcludedFullText = max(0, assessed - included) (also counts pending FT papers as excluded).
- included = count(status INCLUDED).
- Unused queries fetched but ignored: count(status SCREENING_TITLE_ABSTRACT), count(status EXCLUDED).

Versioning:
- `generateReport`: if no `force` and the latest snapshot has identical 9 statistics, returns the existing snapshot (no new version). Otherwise version = latest + 0.1 (formatted to 1 decimal), first version `'1.0'`, or caller-supplied `version` (not validated).
- Version is stored as string.

Rules / gaps:
- `cleanupDuplicateReports`: ordered by `generatedAt asc`, keeps index 0 (OLDEST) and deletes all others (including the latest). Likely the reverse of the intent (cross-cutting #6).
- Exclusion reasons breakdown is empty (`reasons`/`breakdown` not populated); PRISMA node breakdowns not computed. Study-selection exclusion reasons (`studySelectionExclusionReasons`) are not used here.
- DOCX percentages are computed against `max(1, recordsIdentified)`.

#### 11. quality-assessment

Purpose: quality-assessment templates per project and reviewer quality scores per paper.

Files (5): `quality.controller.ts` (53), `quality.routes.ts` (22), `quality.schemas.ts` (36), `quality.service.ts` (84), `quality.types.ts` (27).

Endpoints (mount `/api/projects/:projectId/quality`, `requireAuth`):
- `GET /api/projects/:projectId/quality/templates` - MEMBER.
- `POST /api/projects/:projectId/quality/templates` - OWNER. body `name` (min 1), `criteria[]` (min 1) of `{ id, question (min 1), description?, maxScore (default 1), weight (default 1) }`. 201.
- `GET /api/projects/:projectId/quality/papers/:paperId` - MEMBER. All reviewer assessments for paper.
- `POST /api/projects/:projectId/quality/papers/:paperId` - REVIEWER (passes for REVIEWER and OWNER; LECTURER is refused). body `templateId?`, `scores` (record of `{ score: number, comment? }`), `totalScore: number`. Doc id = caller uid (one assessment per reviewer per paper, overwritten by merge). 201.

Firestore:
- `projects/{id}/qualityTemplates/{templateId}` `{ id, projectId, name, criteria[], createdAt }`.
- `projects/{id}/papers/{paperId}/qualityAssessments/{reviewerId}` `{ id, projectId, paperId, reviewerId, templateId?, scores, totalScore, createdAt, updatedAt }`.
- Read-only: `projects/{id}/papers/{paperId}.qualityResolution.finalDecision` (1 = high quality, other numeric = low; see below). Read by review-processes overview and phase-compatibility. NO writer exists in the in-scope code, so the high/low counts will always be zero unless data is written by some other path.

Rules / gaps:
- `totalScore` is client-supplied; not computed from `scores`, `weight`, or `maxScore`, and not checked against the template. `scores` keys are not validated against template criterion ids.
- No consensus/resolution workflow in this module (where `qualityResolution` gets set is unknown in scope).
- Review-process quality stats: included, non-duplicate papers in the process; `finalDecision` 1 = high, other numeric = low; otherwise "in progress" if any assessment exists, else "not started".

#### 12. review-processes

Purpose: the review process (the SLR "process" wrapper over project phases), paper assignment into the process, process overview/progress, phase reopen, start/complete.

Files (3 + 1): `review-processes.controller.ts` (96), `review-processes.service.ts` (754), `review-processes.schemas.ts` (19). Controller for process creation lives in `projects.controller.ts`.

Endpoints:
- `GET /api/review-processes/:id` - membership (any member; global ADMIN ok). Overview object.
- `POST /api/review-processes/:id/papers` - body `paperIds` (1..500 unique). Role OWNER, ADMIN, or LECTURER (member doc). Inserts `projects/{p}/reviewProcessPapers/{paperId}` with `status: ASSIGNED` for papers that exist, are pool-visible, and are not yet assigned. Returns `{ inserted, skippedAsDuplicate, reviewProcessSnapshot }`. Missing paper id => 404 for the whole batch.
- `POST /api/review-processes/:id/papers/add-from-filter-setting` - body `filterSettingId`. Pages through `listPaperPool` (100 per page) with saved filter options, then assigns (same as above). Returns `{ inserted, skippedAsDuplicate, matchedTotal, processSnapshot }`.
- `POST /api/review-processes/:id/reopen-phase/:phase` - OWNER or LECTURER only (normalized role; global ADMIN ok). `phase`: `0|identification`, `1|screening|studyselection`, `2|extraction|dataextraction`, `3|quality|qualityassessment`, `4|synthesis`. Sets that phase object to `{status: 1, statusText: 'InProgress', completedAt: null, updatedAt}` on the project doc. Other values => 400 `INVALID_PHASE`.
- `POST /api/review-processes/:id/start` - OWNER/ADMIN/LECTURER. Sets `reviewProcess.status = 1`, keeps `startedAt`.
- `POST /api/review-processes/:id/complete` - OWNER/ADMIN/LECTURER. Sets `reviewProcess.status = 2`, `completedAt`. No phase precondition.
- Project-level creation: `POST /api/projects/:projectId/review-processes` (see projects).

Firestore:
- `projects/{id}` fields: `reviewProcess {id, projectId, name, notes, createdBy, createdAt, updatedAt, status?, statusText?, startedAt?, completedAt?}`, `studySelection`, `qualityAssessment`, `dataExtraction`, `synthesis`, `identification` (phase objects `{status, statusText, startedAt, completedAt}`), `updatedAt`.
- `projects/{id}/reviewProcessPapers/{paperId}` `{ id, projectId, reviewProcessId, paperId, status: 'ASSIGNED', assignedBy, assignedAt, updatedAt }` (also gets reviewer fields from `papers.assignPapers`).
- Reads: `projects/{id}/papers`, `projects/{id}/papers/{pid}/qualityAssessments`, `projects/{id}/qualityTemplates`, `projects/{id}/members/{uid}`, `projects/{id}/filterSettings/{filterId}`.
- Orphan assignment cleanup: `getOverview` deletes assignments whose paper no longer exists (fire-and-forget batch).

Model (overview, `buildReviewProcessOverview`): `id, processId ('rp_...'), projectId, name, statusText, status (0|1|2), currentPhase (1 = Screening, 2 = Extraction/Quality once studySelection completed), progressPercent (assigned / visible papers * 100), totalPapersImported, totalIncludedPapers, totalExcludedPapers, identificationProcess, studySelectionProcess {selectionStatistics, phaseStatistics {titleAbstract, fullText}}, qualityAssessmentProcess {qualityStatistics}, dataExtractionProcess, synthesisProcess, startedAt, completedAt, notes, createdAt, modifiedAt`.

Business rules:
- Process status: 2 if explicitly completed OR all four phases (studySelection, qualityAssessment, dataExtraction, synthesis) are 2. 0 if configured status 0. Else 1.
- Study-selection stats per phase: included (TA counts `SCREENING_FULL_TEXT` as included in TA phase), excluded (`EXCLUDED`), inScreening (non-conflict papers in that phase's screening status), conflict (`isConflict`), pending = total - included - excluded - inScreening - conflict (clamped at 0), completionPercentage = (included + excluded) / total * 100.
- `progressPercent` = min(100, round(assigned / visible pool * 100)).
- Phase reopen overwrites a phase object (status 1, completedAt null) but does not reset its children.
- `assertCanManageProcess` error text says "REVIEWER role" although it permits OWNER/ADMIN/LECTURER (stale message). A member doc without a role is treated as VIEWER and refused.
- `skippedAsDuplicate` counts both already-assigned and non-visible (duplicate) papers.
- Start after complete is allowed (no state machine).

Notable TODO / incomplete: no state machine for phases; complete does not verify phases; quality stats depend on `qualityResolution` which has no writer in scope.

#### 13. screening

Purpose: title/abstract (TA) and full-text (FT) screening votes and the status machine that turns votes into INCLUDED / EXCLUDED / conflict. This is the shared engine used by study-selection.

Files (5): `screening.controller.ts` (52), `screening.routes.ts` (34), `screening.schemas.ts` (28), `screening.service.ts` (233), `screening.types.ts` (15).

Endpoints (canonical; mount `/api/projects/:projectId/screening`, `requireAuth`):
- `POST /api/projects/:projectId/screening/:paperId/decisions` - `requireProjectRole('REVIEWER')` (OWNER and REVIEWER pass; LECTURER refused). body `stage` (`TITLE_ABSTRACT|FULL_TEXT`), `decision` (`INCLUDE|EXCLUDE|UNCERTAIN`), `exclusionReasonId?`, `comment?`. 201 with decision.
- `GET /api/projects/:projectId/screening/:paperId/decisions` - MEMBER. Returns ALL decisions for the paper (see cross-cutting #3).
- `POST /api/projects/:projectId/screening/:paperId/resolve` - OWNER. body `stage`, `finalDecision` (`INCLUDE|EXCLUDE`), `reason?`, `exclusionReasonId?`.

Legacy (routes.ts `/api/study-selection/...`): the same logic is reached via `study-selection.controller` (see study-selection). The legacy block in routes.ts is dead.

Firestore:
- `projects/{id}/papers/{paperId}/screeningDecisions/{reviewerId}_{stage}` `ScreeningDecision` (one vote per reviewer per stage; re-voting overwrites).
- `projects/{id}/papers/{paperId}/aiAnalysis/{'0' for TA | '1' for FT}` (read as AI vote; `recommendation` 0/1/2).
- `projects/{id}/papers/{paperId}` fields updated: `status, isConflict, screeningStage, updatedAt`; on resolve also `conflictResolvedBy, conflictResolvedReason, exclusionReasonId`.

Model `ScreeningDecision`: `id, projectId, paperId, reviewerId, stage ('TITLE_ABSTRACT'|'FULL_TEXT'), decision ('INCLUDE'|'EXCLUDE'|'UNCERTAIN'), exclusionReasonId?, comment?, createdAt, updatedAt`.
AI numeric mapping (`aiDecisionValue`): `0 -> INCLUDE`, `1 -> EXCLUDE`, `2 -> UNCERTAIN`.

Business rules (state machine, per paper):
- Vote set = all human decisions for the stage + the AI vote for that stage (if an aiAnalysis doc exists). Commit e4e84f0 ("count human and AI reviewers toward review requirement") made the AI vote count as a reviewer.
- Threshold: 2 votes total (human + AI) before any status change.
- With >= 2 votes: all INCLUDE => TA: `SCREENING_FULL_TEXT`; FT: `INCLUDED`. All EXCLUDE => `EXCLUDED`. Any UNCERTAIN, or INCLUDE mixed with EXCLUDE => `isConflict = true` (status unchanged).
- With 1 vote: TA stage and status `IMPORTED` => `SCREENING_TITLE_ABSTRACT`; otherwise unchanged.
- `reconcileAiDecision` runs the same logic when an AI result is saved (study-selection `ai-evaluate`), so an AI vote can complete a paper with a single human vote.
- `resolveConflict`: TA INCLUDE => `SCREENING_FULL_TEXT`, FT INCLUDE => `INCLUDED`, EXCLUDE => `EXCLUDED`; sets `isConflict: false`, `conflictResolvedBy`, `conflictResolvedReason`, `exclusionReasonId`.
- `mapPaperSelectionStatus` (study-selection) reports status 4 (resolved) whenever `conflictResolvedBy` is set, even if later votes change the paper.

Gaps / notable:
- No check that the paper is in a matching stage/status before accepting a vote (a FT vote on an EXCLUDED paper is accepted; a late vote can move an already INCLUDED/EXCLUDED paper).
- `resolveConflict` does not verify the paper is actually in conflict.
- `conflictResolvedBy` is not cleared when new votes arrive, so a stale resolved flag persists.
- `exclusionReasonId` is not validated against the project's exclusion reasons.
- The REVIEWER filter in `getDecisions` is dead (reads `req.projectRole`, never set). See cross-cutting #3.
- Single transaction per decision; query reads inside transaction are fine.

#### 14. search

Purpose: external literature search via Semantic Scholar (used by lecturers to find candidate papers).

Files (4): `search.controller.ts` (27), `search.routes.ts` (13), `search.service.ts` (53), `search.types.ts` (10).

Endpoints:
- `GET /api/projects/:projectId/search/semantic-scholar` - `requireAuth` + `requireProjectRole('LECTURER')` (OWNER and LECTURER pass; REVIEWER refused). Query: `query` (required string; 400 `{success:false, error:{message}}` if missing), `limit` (default 20), `offset` (default 0).

Behaviour:
- Calls `env.SEMANTIC_SCHOLAR_BASE_URL` (Graph API paper search), fields `title, abstract, authors, year, externalIds, citationCount, url`, timeout 15 s. Optional `x-api-key` from `env.SEMANTIC_SCHOLAR_API_KEY`.
- Response mapped to `SearchResultPaper { paperId, title, abstract?, year?, authors[] (names), doi? (externalIds.DOI), url?, citationCount? }` with `{ total, data }`.
- Any upstream error is logged and swallowed: returns `{ total: 0, data: [] }` with 200 (callers cannot distinguish failure from no results).

Rules / gaps: no caching, no rate limiting, no persistence (results are not stored; import is a separate step).

#### 15. study-selection

Purpose: FE-facing study selection process (TA and FT phases): paper lists by phase, decisions and conflicts, exclusion reason library per project, AI first-pass evaluation, reviewer assignment readouts, and process start/complete. Delegates the vote engine to `screening`.

Files (8): `study-selection.controller.ts` (459), `study-selection.service.ts` (1038), `study-selection.routes.ts` (39), `selection-criteria.routes.ts` (11), `checklist-template.controller.ts` (57), `checklist-template.service.ts` (149), `checklist-template.routes.ts` (33), `checklist-template.schemas.ts` (25), `checklist-template.types.ts` (41).

Endpoints (mount `/api/study-selection`, router-level `requireAuth`, `:processId` = `sp_{projectId}`; authorization = project membership only, no role check):
- `GET /api/study-selection/:processId` - process summary (status, statistics).
- `POST /api/study-selection/:processId/start` and `/complete` - sets project `studySelection` `status` 1 / 2.
- `GET /api/study-selection/:processId/phase-status`
- `GET /api/study-selection/:processId/eligible-papers`
- `GET /api/study-selection/:processId/included-papers`
- `GET /api/study-selection/:processId/statistics` - counts per status (included, excluded, conflict, in screening).
- `GET /api/study-selection/:processId/conflicts` and `/conflicts-by-phase`
- `GET /api/study-selection/:processId/exclusion-reasons`; `POST .../exclusion-reasons` body `{ libraryReasonIds?: string[], customReasons?: [{code: int, name}] }` (at least one; 409 duplicate code or name case-insensitively; library reasons must be `isActive`).
- `POST /api/study-selection/:processId/papers/:paperId/decision` - body `phase` (1 = FULL_TEXT, otherwise TITLE_ABSTRACT), `decision` (0 INCLUDE, 1 EXCLUDE, other = UNCERTAIN), `exclusionReasonId?`, `reason?` (stored as comment). Calls `ScreeningService.submitDecision`, returns the caller's decision.
- `GET /api/study-selection/:processId/papers/:paperId/decisions`
- `POST /api/study-selection/:processId/papers/:paperId/resolve` - body `phase`, `finalDecision` (0 INCLUDE, else EXCLUDE), `resolutionNotes?`, `exclusionReasonId?`.
- `GET /api/study-selection/:processId/papers/conflict-status`
- `GET /api/study-selection/:processId/papers/:paperId/reviewer-decisions`
- `GET /api/study-selection/:processId/papers/:paperId/ai-result` (`phase` query)
- `POST /api/study-selection/:processId/papers/:paperId/ai-evaluate` - TA (phase 0).
- `POST /api/study-selection/:processId/papers/:paperId/full-text/ai-evaluate` - FT (phase 1).
- `GET /api/study-selection/:processId/title-abstract/papers`, `GET .../full-text/papers`, `GET .../assigned-papers`, `GET .../papers` (list with filters: `search, year, status, phase, pageNumber, pageSize, hasFullText, hasConflict`)
- `GET /api/study-selection/:processId/papers/:paperId/status`, `.../conflict-detail` (`isFinishReview`, `assignedMembers`, phase decisions), `GET .../papers/:paperId`.
- `GET /api/selection-criteria/process/:processId` - stub returns `[]`.
- Checklist templates (see below).

Legacy mount detail: `routes.ts` also mounts a `studySelectionRouter` at the same path. Every route it defines is shadowed by `study-selection.routes.ts`, so it is dead code.

Checklist template endpoints:
- `GET /api/projects/:projectId/study-selection-checklist-template` - MEMBER (list, sorted by version desc).
- `POST /api/projects/:projectId/study-selection-checklist-template` - OWNER. body `name` (trim, required), `description` (default ''), `sections[]` min 1: `{ title (req), description (default ''), order (int >= 0), items[] min 1: { text (req), order (int >= 0) } }`.
- `GET /api/projects/:projectId/study-selection-checklist-templates/:templateId` - MEMBER.
- `POST /api/study-selection-checklist-templates/:templateId/activate` - `requireAuth` only in router; service requires project OWNER or admin. Locates template by scanning ALL projects (`db.collection('projects').get()`), then sets `isActive` true for it and false for others (batch).

Firestore:
- `projects/{id}` fields: `studySelection` (`status` 0/1/2, `statusText`, `startedAt`, `completedAt`, `updatedAt`), `ownerId`, `reviewProcess` etc. `researchQuestions`, `inclusionCriteria`, `exclusionCriteria`, `criteria` read at root for AI evaluation (see notable).
- `projects/{id}/reviewProcessPapers/{paperId}`: reviewer assignment (`reviewerIds` or `memberIds`; owners and global/project admins are filtered out of eligibility).
- `projects/{id}/papers/{paperId}` (and `screeningDecisions`, `aiAnalysis` subcollections).
- `projects/{id}/studySelectionExclusionReasons/{id}` `{ id, studySelectionProcessId, libraryReasonId, code, name, source (0 library, 1 custom), isActive, createdAt }`.
- `exclusionReasonLibraries/{id}` (top-level, `isActive` must be true).
- `projects/{id}/members/{uid}`, `users/{uid}` (reviewer name/email).
- `projects/{id}/studySelectionChecklistTemplates/{id}` (`COLLECTION` constant) `{ id, projectId, name, description, version, isActive, sections[{id, templateId, title, description, order, items[{id, sectionId, text, order}]}], createdAt, updatedAt }`.

Model / codes:
- Paper selection status (`mapPaperSelectionStatus`): `0` screening, `1` included, `2` excluded, `3` conflict, `4` resolved.
- Decisions returned as `decision: 0 Include | 1 Exclude | 2 Uncertain`, `phase: 0 Title/Abstract | 1 Full Text`.
- `isFinishReview` = paper has conflict OR every assigned reviewer has submitted a decision for the phase.
- Assigned reviewer entries carry `decision: 'Pending'` until joined with decisions.

AI evaluation (`evaluateAi`):
- Inputs: `paper.title`, `paper.abstract`, and `researchQuestions`, `inclusionCriteria`, `exclusionCriteria` read from the PROJECT ROOT doc (`projectData.researchQuestions`, `inclusionCriteria || criteria.inclusion`, `exclusionCriteria || criteria.exclusion`). See notable.
- Calls `AIService.getScreeningRecommendation` (Gemini or other provider configured by env; prompt in `ai.service.ts`). On error it returns `UNCERTAIN` with confidence 0.
- Fallback heuristic (only when confidence is 0): keywords `code, software, empirical, evaluation, model, language model, llm, copilot, repair, generation, deep learning, neural` found in title+abstract. >= 2 matches => INCLUDE with confidence `min(0.75 + 0.04*n, 0.95)` and reasoning "aligns strongly with software engineering and code generation criteria". Otherwise UNCERTAIN 0.5 "Manual reviewer judgment recommended". Domain-specific, hard-coded for one SLR topic.
- Stored at `projects/{p}/papers/{pid}/aiAnalysis/{phase}` with `relevanceScore`, `recommendation` (0/1/2), `aiOutput` (criteriaGroupResults with hard-coded rule text "Focuses on AI/LLM in Software Engineering", reasoning), `phase`, `reviewerId` (caller), timestamps. Then `reconcileAiDecision`.

Notable / incomplete:
- Authorization is membership-only for every study-selection endpoint: REVIEWER can start/complete the process, add exclusion reasons, run AI, submit and resolve (cross-cutting #1). Compare canonical screening routes (REVIEWER for decisions, OWNER for resolve).
- Criteria/research questions read from project root (cross-cutting #7). Likely always empty for projects created with the current protocol module.
- Hard-coded SE/LLM keyword rules and rule text in `evaluateAi`.
- `selection-criteria` endpoint is a stub (`[]`), `getEmptyCriteria`.
- Checklist activation is O(all projects) read.
- `exclusionReasonId` on decisions is not validated against the project's reason list.

#### 16. synthesis

Purpose: thematic synthesis: themes (with a research question link) and evidence items per theme.

Files (5): `synthesis.controller.ts` (37), `synthesis.routes.ts` (17), `synthesis.schemas.ts` (24), `synthesis.service.ts` (72), `synthesis.types.ts` (18).

Endpoints (mount `/api/projects/:projectId/synthesis`, `requireAuth`):
- `GET /api/projects/:projectId/synthesis/themes` - MEMBER.
- `POST /api/projects/:projectId/synthesis/themes` - LECTURER (OWNER passes; REVIEWER refused). body `title` (min 1), `description?`, `researchQuestionId?`.
- `POST /api/projects/:projectId/synthesis/themes/:themeId/evidence` - LECTURER. body `paperId` (min 1), `excerpt` (min 1), `findingSummary` (min 1). 404 "Theme not found".

Firestore: `projects/{id}/synthesisThemes/{themeId}` `{ id, projectId, researchQuestionId?, title, description?, evidence: SynthesisEvidence[], createdAt, updatedAt }`. Evidence is embedded as an array in the theme doc. `themeRef.collection('evidence').doc().id` is used only to generate an id; no `evidence` subcollection is written.

Model: `SynthesisEvidence { id, paperId, excerpt, findingSummary, createdAt }`.

Rules / gaps:
- `addEvidence` is a read-then-update of the whole evidence array without a transaction (concurrent adds can drop items).
- `paperId` is not checked against the project's papers.
- No synthesis phase status is set here; phase state only changes via review-process endpoints.

---

#### Quick reference: who can do what (in-scope, as implemented)

| Area | Read | Write | Notes |
|---|---|---|---|
| Papers list/detail | MEMBER | LECTURER create/import/pdf; OWNER delete | global `/api/papers/:id` membership via service |
| Assign reviewers (`/api/papers/assign`) | - | OWNER (or global ADMIN) | exactly 2 same-role reviewers |
| Paper import (RIS/BibTeX/PDF/DOI/cross-ref) | - | LECTURER | DOI and cross-ref path has no dedupe |
| Paper pool sources / filter presets | MEMBER | LECTURER | |
| Screening decisions (canonical) | MEMBER | REVIEWER or OWNER (LECTURER refused) | reviewer vote visibility not enforced |
| Screening resolve (canonical) | MEMBER | OWNER | |
| Study-selection endpoints | membership | membership only (no role) | gap, see cross-cutting #1 |
| Review process assign | membership | OWNER/ADMIN/LECTURER | |
| Reopen phase | membership | OWNER/LECTURER | |
| Quality templates | MEMBER | OWNER | |
| Quality assessments | MEMBER | REVIEWER or OWNER | |
| PRISMA live/report | MEMBER | MEMBER (incl. REVIEWER) | cleanup deletes latest |
| Semantic Scholar search | LECTURER | - | |
| Synthesis themes/evidence | MEMBER | LECTURER | |
| Protocol | MEMBER | OWNER | |
| Projects | per role | per role | creation open to any user |
| Users | any authenticated | any authenticated | admin checks missing, see cross-cutting #4 |
| Upload (`/api/upload`) | - | global ADMIN | |
| Notifications | own | own (mark read) | no producers |

## Phụ lục D: slr-fe UI



---

#### 1. Stack and tooling

Source: `slr-fe/package.json`, `slr-fe/vite.config.ts`, `slr-fe/eslint.config.js`.

- Name: `systematic-review-support-websystem`, `"type": "module"`, version 0.0.0.
- Scripts:
  - `dev` = `vite`
  - `build` = `tsc -b && vite build`
  - `lint` = `eslint .`
  - `preview` = `vite preview`
- No test runner and no test files. `playwright` is a devDependency, but `scripts/test_step1.mjs` and `scripts/test_step2.mjs` are the only automation files. There is no Prettier config.
- Runtime deps (grouped):
  - Core: `react` / `react-dom` ^19.2, `typescript` ~5.9, `vite` ^7.2 with `@vitejs/plugin-react` ^5.1.
  - Routing: `react-router` ^7.9.6 AND `react-router-dom` ^7.13.0. Both are installed. Routes import from both packages, so this is mixed usage.
  - State: `@reduxjs/toolkit` ^2.11, `react-redux` ^9.2, `redux-persist` ^6 (storage = localStorage).
  - Server state: `@tanstack/react-query` ^5.90. 53 files use `useQuery` or `useMutation`.
  - HTTP: `axios` ^1.13 (single instance in `src/config/axios.ts`).
  - Forms: `react-hook-form` ^7.71. Usage is limited, since most forms use hand-rolled state.
  - Styling: `tailwindcss` ^4.1 with `@tailwindcss/vite`, `tailwind-merge` ^3.4, `clsx` ^2.1.
  - Icons: `lucide-react` ^0.575 and `react-icons` ^5.5 (about 304 import lines across both).
  - Charts: `recharts` ^3.8. Citation graph: `cytoscape` ^3.33 + `cytoscape-fcose` + `react-cytoscapejs`.
  - Data grid: `ag-grid-community` / `ag-grid-react` ^35.2 (data-extraction grid).
  - Rich text: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline` (v2.11).
  - PDF: `@react-pdf-viewer/*` (core, default-layout, highlight, page-navigation, search) and `pdfjs-dist` ^3.4.
  - DnD: `@dnd-kit/core`, `@dnd-kit/utilities`.
  - Motion: `framer-motion` ^12.38, `gsap` ^3.14.
  - Markdown: `react-markdown` ^10.1.
  - Toasts: `react-hot-toast` ^2.6.
  - Export: `file-saver`, `html-to-image`.
  - Realtime: `@microsoft/signalr` ^10 (client is a no-op, see section 9).
  - Legacy: `@supabase/supabase-js` ^2.94 (README and env example say it is unused in `src`).
  - Misc: `uuid` ^13.
- No UI component library (no MUI, Chakra, AntD, Radix, shadcn). UI primitives are hand-rolled under `src/components/ui/`.

##### vite.config.ts
- Plugins: `react()`, `tailwindcss()`.
- Dev proxy:
  - `/api` to `backendUrl`, changeOrigin.
  - `/hubs` to `backendUrl`, `ws: true`.
- `backendUrl` = `VITE_BE_URL` (trailing slash stripped), else `VITE_API_URL` minus `/api`, else `http://localhost:5000`.
- `loadEnv(mode, cwd, '')` is used, so all env vars are read.

##### eslint.config.js (flat config, ESLint 9)
- Extends `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` flat recommended, and `react-refresh` vite.
- Turned off: `no-explicit-any`, `react-hooks/exhaustive-deps`, `set-state-in-effect`, `immutability`, `static-components`, `purity`, `preserve-manual-memoization`, `react-refresh/only-export-components`.
- `no-unused-vars` is a warning, with `_` ignore patterns.
- Ignores: `dist`, `node_modules`, `*.d.ts`.

##### tsconfig
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` (standard Vite split). Build runs `tsc -b`.

---

#### 2. Deployment and environments

##### Dockerfile (2 stages)
- Stage 1: `node:20-alpine`. Build args `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` are copied into ENV. Then `npm ci` and `npm run build`.
- Stage 2: `nginx:1.25-alpine`. Copies `nginx.conf` to `/etc/nginx/conf.d/default.conf` and `dist` to `/usr/share/nginx/html`. Exposes 80.
- Note: `VITE_FIREBASE_API_KEY` and other `VITE_*` vars are not passed as build args. Only `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` are. Google sign-in is wired through the Firebase REST exchange, so the Firebase key would be missing in the Docker build unless it is added.

##### nginx.conf
- `listen 80`, `server_name localhost`, `client_max_body_size 10m`.
- `location /api/` proxies to `http://slr-backend:5000/api/` with the usual forwarded headers. It also sets `Upgrade` and `Connection "upgrade"`. No `/hubs` location exists.
- `location /` serves `/usr/share/nginx/html` with `try_files $uri $uri/ /index.html` (SPA fallback).
- `error_page 500 502 503 504 /50x.html` is set, but no `50x.html` is shipped.

##### vercel.json
- Single rewrite: `/(.*)` to `/index.html` (SPA fallback). Vercel-ready.

##### .dockerignore
- Excludes: `node_modules`, `dist`, `.git`, `.github`, `*.log`, `.env`, `.env.local`, `.env.production`, `README.md`, `Dockerfile`, `.dockerignore`.

##### .gitignore notable entries
- `dist/`, `.env`, `.env.*.local`, `.env.production`, `node_modules/`.
- `dist/` exists on disk but is gitignored.

##### .github/workflows/ci.yml ("CI Frontend (dev)")
- Triggers: push and pull_request on `dev`, plus `workflow_dispatch`.
- Job `test-and-build` (ubuntu-latest, Node 20, npm cache):
  - `npm ci`
  - `npm run lint` with `continue-on-error: true` (lint failures do not fail CI).
  - `npm run build`.
- Job `docker-build-check` (needs test-and-build): Buildx and `docker/build-push-action@v5`, `push: false`, GHA cache.
- `.github/copilot-instructions.md` is a coding-standards file for AI assistants. Key rules: files at most ~600 lines, hooks for data fetching, no `any`, no `console.log`, no barrel exports, and presentation separated from logic.

##### Environment variables (names only, values never recorded)
- `.env.example` declares:
  - `VITE_BE_URL` (blank means use the Vite proxy in dev)
  - `VITE_API_URL`
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_EXCHANGE_URL`
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (marked legacy, unused)
- `.env` and `.env.production` also exist locally. Both are gitignored. `.env.production` sets only `VITE_BE_URL` and `VITE_API_URL`.
- Variables read by code (`import.meta.env`):
  - `VITE_API_URL` in `src/config/axios.ts` (defaults to `/api`).
  - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_EXCHANGE_URL`, `VITE_GOOGLE_CLIENT_ID` in `src/components/auth/LoginForm.tsx` and `src/services/authService.ts`.
  - `import.meta.env.DEV` is used once.
- `VITE_BE_URL` is read only by `vite.config.ts`, not by app code.

##### index.html and public
- `index.html` holds the page shell. `public/favicon.ico` is the only public asset.

---

#### 3. App entry, providers, routing setup

##### src/main.tsx (provider order, outermost first)
1. `QueryClientProvider` (`src/config/queryClient.ts`)
2. `Provider` (Redux `store` from `src/redux/store.ts`)
3. `PersistGate` (redux-persist, `loading={null}`)
4. `BrowserRouter` (from `react-router`)
5. `ToastProvider` (`src/components/ui/toast/ToastProvider.tsx`, custom toast on react-hot-toast)
6. `<App />`

##### src/config/queryClient.ts
- Defaults: `retry: 1`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`, `staleTime: 2 min`.

##### src/App.tsx
- Reads `state.auth` (`isAuthenticated`, `accessTokenExpiresAt`, `isInitialized`).
- On mount and on auth change, if the token is expired, it calls `authService.refresh()`. Success dispatches `updateAccessToken`. Failure dispatches `logout`. Then it sets `isInitialized`.
- While not initialized, it renders a full-screen spinner ("Initializing application...").
- Top-level routes:
  - `auth/*` to `AuthRoutes`
  - `admin/*` to `AdminRoutes`
  - `404` to `NotFoundPage`
  - `*` to `MainRoutes`
- The whole tree is wrapped in `ErrorBoundary` (`src/components/common/ErrorBoundary.tsx`).

##### Redux store (`src/redux/store.ts`)
- Slices: `auth`, `ui`, `project`, `documentEditor`.
- Persisted via redux-persist, key `root`, version 1, whitelist `auth`, `ui`, `project`, `documentEditor`.
- `authTransform` forces `isInitialized: false` on rehydrate.
- Migration 0 clears `auth`.
- The root reducer resets all state on `auth/logout`. A middleware on logout calls `queryClient.clear()`, `persistor.purge()`, and removes `persist:auth` from localStorage.
- `serializableCheck: false`.
- Slice files: `src/redux/slices/authSlice.ts` (login, logout, updateUser, updateAccessToken, setInitialized), `uiSlice.ts` (`currentSection`, used by SectionGuard), `projectSlice.ts` (`currentProjectMember`, `clearCurrentProject`), `documentEditorSlice.ts`.

##### Route guards in use
- `ProtectedRoute` (`src/routes/ProtectedRoute.tsx`): props `allowedRoles?: string[]`. Role comparison is case-insensitive and trimmed.
  - Not authenticated, redirect to `/auth/signin`.
  - Authenticated but role not allowed, redirect to `/`.
  - With no `allowedRoles`, any authenticated user passes.
  - Shows a toast warning on denial.
- `ProtectedRouteForProject` (`src/components/routes/ProtectedRouteForProject.tsx`): project-scoped. It calls `useProjectMember(projectId)` (fetches `/projects/{id}/my-membership`-style data through `projectService.getMyMembership`).
  - Not initialized, renders null.
  - Not authenticated, redirect to `/auth/signin` with `state.from`.
  - While loading membership, shows "Verifying project access...".
  - No membership or error: `redirectTo` if set, else an "Access Denied" panel.
  - Role check: `allowedRoles` accepts numbers and strings. Strings are normalized: OWNER and ADMIN become 1, LECTURER becomes 2, REVIEWER becomes 3. Anything else becomes 99.
  - Denied: `forbiddenTo ?? redirectTo`, else an "Insufficient Permissions" panel.
  - Path params in `redirectTo` are resolved (e.g. `/projects/:projectId`).
- `AdminAccessGuard` (`src/components/auth/AdminAccessGuard.tsx`): mounted inside `MainLayout`. For admins who move from `/admin` to client pages, it shows a "Switch to Client Pages?" modal. For admins moving into `/admin`, it shows an info toast.
- `SectionGuard` (`src/components/auth/SectionGuard.tsx`): syncs `ui.currentSection` ("admin" or "client"). `MainLayout` uses "client", `AdminDashboard` uses "admin".
- `InteractionGuard` (`src/components/auth/InteractionGuard.tsx`): designed to make admins read-only on client pages (shows "Admin Read-Only Mode"). It is commented out in `MainLayout.tsx`, so it is currently inactive.
- `AdminProfileRedirect` (`src/components/profile/AdminProfileRedirect.tsx`): shown instead of `MyProfilePage` at `/profile` when the role is Admin.

---

#### 4. Route table (every path, page, guard)

##### 4a. Top level (`src/App.tsx`)
| Path | Element | Guard |
|---|---|---|
| `auth/*` | `AuthRoutes` | none |
| `admin/*` | `AdminRoutes` | Admin role (inside) |
| `404` | `NotFoundPage` | none |
| `*` | `MainRoutes` | see 4c |

##### 4b. Auth (`src/routes/AuthRoutes.tsx`)
| Path | Component | Guard |
|---|---|---|
| `/auth` (index) | Navigate to `signin` | none |
| `/auth/signin` | `pages/auth/LoginPage.tsx` (uses `components/auth/AuthLayout`, `components/auth/LoginForm`) | none |
| `/auth/policy` | `pages/auth/PolicyPage.tsx` | none |
| `/auth/*` other | Navigate to `/404` | none |

##### 4c. Admin (`src/routes/AdminRoutes.tsx`), all under `/admin`
- Parent: `ProtectedRoute allowedRoles={["Admin"]}`, then layout `pages/admin/AdminDashboard.tsx` (sidebar + `AdminHeader` + `<Outlet/>`, wrapped in `SectionGuard section="admin"`).
| Path | Component | Role |
|---|---|---|
| `/admin` (index) | `pages/admin/AdminOverview.tsx` | Admin |
| `/admin/audit-logs` | `pages/admin/AuditLogPage.tsx` | Admin |
| `/admin/projects` | `pages/admin/SLRProjectManagement.tsx` | Admin |
| `/admin/users` | `pages/admin/UserManagement.tsx` | Admin |
| `/admin/agents` | `pages/admin/AgentManagement.tsx` | Admin |
| `/admin/master-sources` | `pages/admin/MasterSourcePage.tsx` | Admin |
| `/admin/settings` | `pages/admin/SystemSettings.tsx` | Admin |
| `/admin/templates` | `pages/admin/TemplateManager.tsx` | Admin |
| `/admin/profile` | `pages/profile/MyProfilePage.tsx` | Admin |
| `/admin/*` other | Navigate to `/404` | none |

- Sidebar labels in `AdminDashboard.tsx`: Overview, SLR Projects, Search Sources, Users Management, AI Agents, Checklist Templates, Audit Logs, System Settings. Footer: Client Home (`/`), My Profile, Sign out.
- `pages/admin/TemplateCustoimzer.tsx` (typo in filename) is not routed. It is only used by `TemplateManager`.

##### 4d. Main client routes (`src/routes/MainRoutes.tsx`)
Layout: `MainLayout` (`src/layouts/MainLayout.tsx`) at path `/`. All page components are `React.lazy` with a `Suspense` spinner fallback.

Public and semi-public:
| Path | Component | Guard |
|---|---|---|
| `/` (index) | `pages/home/HomePage.tsx` | none (marketing/landing page) |
| `/profile` | `pages/profile/MyProfilePage.tsx`, or `AdminProfileRedirect` if role is Admin | none in router (page needs auth data) |
| `/invitations/:invitationId` | `pages/invitations/InvitationDetailPage.tsx` | none in router (page uses `useProjects`) |
| any unmatched under `/` | none. The `*` fallback to `/404` is commented out. | none |

Project area (`ProtectedRoute` with no roles, meaning any signed-in user; then `ProjectLayout` at `/projects`):
| Path | Component | Extra guard |
|---|---|---|
| `/projects` (index) | `pages/projects/ProjectListPage.tsx` | auth |
| `/projects/:projectId/checklists` | `pages/checklist/ChecklistDashboardWrapper.tsx` (wraps `ChecklistDashboard.tsx`) in `ErrorBoundary` | auth |
| `/projects/:projectId/checklists/:checklistId` | `pages/checklist/ChecklistEditorPage.tsx` in `ErrorBoundary` | auth |
| `/projects/:id/settings` | `pages/projects/ProjectSettingsPage.tsx` | auth |
| `/projects/:id/*` | `pages/projects/ProjectDetailPage.tsx` (nested routes: `overview`, `workspace/:stepId`, `workspace`, `*`) | auth |
| `/projects/:projectId/identification` | `pages/reviewProcess/IdentificationPhaseWorkspace.tsx` | auth |
| `/projects/:projectId/screening` | `pages/reviewProcess/studySelection/ScreeningPhaseRouter.tsx` (leader sees dashboard, reviewer sees screening workspace) | auth |
| `/projects/:projectId/screening/dashboard` | `pages/manage-study-selection/ManageStudySelectionPage.tsx` | auth |
| `/projects/:projectId/screening/full-text` | `pages/reviewProcess/studySelection/fullTextScreening/FullTextScreeningWorkspace.tsx` | auth |
| `/projects/:projectId/quality-assessment` | `pages/reviewProcess/qualityAssessment/QualityAssessmentWorkspace.tsx` | auth |
| `/projects/:projectId/extraction` | `pages/reviewProcess/dataExtraction/DataExtractionPhaseWorkspace.tsx` | auth |
| `/projects/:projectId/extraction/grid` | `.../dataExtraction/components/gridWorkspace/ExtractionGridWorkspace.tsx` | auth |
| `/projects/:projectId/synthesis/*` | `pages/reviewProcess/synthesisExecution/SynthesisPhaseWorkspace.tsx` | auth |
| `/projects/:projectId/prisma-report` | `pages/reviewProcess/prismaReport/PrismaReportWorkspace.tsx` | auth |
| `/projects/:projectId/processes/:processId` | `pages/reviewProcess/ReviewProcessWorkspace.tsx` (legacy path) | auth |
| `/projects/:projectId/papers/:paperId` | `pages/projects/PaperDetailsPage.tsx` | auth |
| `/projects/:id/audit-logs` | `pages/projects/ProjectAuditLogPage.tsx` | auth |

Legacy process-scoped routes (router-level guards):
| Path | Component | Guard (`ProtectedRouteForProject`) |
|---|---|---|
| `/projects/:projectId/processes/:processId/identification/:identificationPhaseId` | `IdentificationPhaseWorkspace` | `allowedRoles=["OWNER","ADMIN",1,2]`, `forbiddenTo=/projects` |
| `/projects/:projectId/processes/:processId/screening/:screeningProcessId` (index = `ScreeningPhaseRouter`) | | `allowedRoles=[1,3]`, `redirectTo=/projects` |
| `.../screening/:screeningProcessId/dashboard` | `ManageStudySelectionPage` | same as above |
| `.../screening/:screeningProcessId/papers-statistic` (index = `StuSePaperStatisticPage`) | | `allowedRoles=[1]` (leader only) |
| `/projects/:projectId/processes/:processId/full-text-screening/:screeningProcessId` | `FullTextScreeningWorkspace` | none in router (page-level only) |
| `/projects/:projectId/processes/:processId/quality-assessment/:qualityAssessmentId` | `QualityAssessmentWorkspace` | none in router |
| `/projects/:projectId/processes/:processId/extraction` | `DataExtractionPhaseWorkspace` | none in router |
| `/projects/:projectId/processes/:processId/extraction/workspace/:studyId` | `DataExtractionPhaseWorkspace` | none in router |
| `/projects/:projectId/processes/:processId/extraction/grid` | `ExtractionGridWorkspace` | none in router |
| `/projects/:projectId/processes/:processId/synthesis/*` | `SynthesisPhaseWorkspace` | none in router |
| `/projects/:projectId/processes/:processId/prisma-report` | `PrismaReportWorkspace` | none in router |

Notes on routing:
- Role numbers in route guards: 1 = Owner/Leader, 2 = Lecturer/Member, 3 = Reviewer.
- The `:id/*` catch-all on ProjectDetailPage appears before the canonical `:projectId/...` routes. React Router ranks static segments higher, so `identification`, `screening`, and similar paths still match their specific routes first. Verify this when editing routes.
- `ReviewProcessWorkspace` for `/projects/:id/workspace` is referenced in role docs but is not a registered path. The workspace is reached through `ProjectDetailPage` (`workspace/:stepId`) or the legacy `processes/:processId` route.
- `/404` is served by `App.tsx` (`path="404"`). Unknown client paths currently fall through to `MainRoutes` and render nothing, because the `*` fallback is commented out.

##### 4e. Layouts (`src/layouts/`)
- `MainLayout.tsx`
  - Renders `SignalRConnectionManager` (no-op), `Header` (hidden on screening, review-process dashboard, data-extraction, QA, synthesis, and PRISMA workspaces), `<main>` with `<Outlet/>`, and `Footer` (hidden on screening).
  - Regex-based detection of workspace pages from `pathname`.
  - Mounts `AdminAccessGuard` and `SectionGuard section="client"`. `InteractionGuard` is commented out.
  - The screening workspace uses a full-height `h-dvh` layout with no page scroll.
- `ProjectLayout.tsx`
  - Reads `projectId` or `id` from params. Calls `useProjectMember(activeProjectId)` so membership is cached in Redux and React Query.
  - On unmount, dispatches `clearCurrentProject`.
- `AdminDashboard.tsx` lives in `pages/admin/` but acts as the admin layout. See 4c.

---

#### 5. Pages (`src/pages/`, 190 files total)

Notes: "Routed" means the page is referenced by a route file. "Imported by" lists parent components. Hook names are the custom hooks or React Query hooks the page file imports.

##### 5a. Public and auth
- `auth/LoginPage.tsx`: Sign-in screen. Composes `AuthLayout` and `LoginForm`. `LoginForm` offers username/password (`authService.login`) and Google sign-in (Google Identity Services script from `accounts.google.com/gsi/client`, then Firebase REST exchange through `authService.googleLogin`). Routed at `/auth/signin`.
- `auth/PolicyPage.tsx`: Static policy text page. Routed at `/auth/policy`.
- `home/HomePage.tsx`: Marketing landing page. Hero, a 4-step flow (Search, Screen, Extract, Report), a PRISMA funnel mock, and metric tiles. Uses hard-coded sample numbers (1,248 records, 214 duplicates, 812 screened, 64 included) for display. Anchors `#workflow`, `#features`, `#about` are linked from `Header`. Routed at `/`.
- `not-found/NotFoundPage.tsx`: 404 page with a Button. Routed at `/404`.

##### 5b. Admin (all under `/admin`, see 4c)
- `admin/AdminDashboard.tsx`: Admin shell (sidebar, header, drawer for mobile). Layout only.
- `admin/AdminOverview.tsx`: Summary cards and recent activity. Hooks: `useUsers`, `useProjects`, `useAuditLogs`.
- `admin/SLRProjectManagement.tsx`: Table of all SLR projects with search, status badge, and actions (`ActionButton`). Opens `ProjectFormModal` and `ProjectMembersModal`. Hooks: `useProjects`, `useDebounce`. Components: `Tooltip`, `Select`, `ConfirmModal`.
- `admin/UserManagement.tsx`: User table with role and status badges. Modals: `AddUserModal`, `UpdateUserModal`, `ChangePreviewModal`, `StatusConfirmModal`. Hook: `useUsers`. Uses `ui/Table`.
- `admin/MasterSourcePage.tsx`: CRUD for master search sources (databases). Hook: `useMasterSources`. Uses `Modal`, `ConfirmModal`, `FormField`, `Select`.
- `admin/AgentManagement.tsx`: AI agent management page. No custom hooks imported directly. Routed at `/admin/agents`.
- `admin/AuditLogPage.tsx`: System-wide audit log. Hooks: `useAuditLogs`, `useUsers`. Subcomponents in `admin/auditLogs/components/`: `AuditLogTable`, `AuditLogFilters`, `AuditLogDetailModal`, `AuditLogExportDialog`. Utils in `auditLogs/utils.ts` and constants in `auditLogs/constants.ts`.
- `admin/SystemSettings.tsx`: System settings. Uses `components/admin/settings/ProjectExclusionCodeTab`.
- `admin/TemplateManager.tsx`: Checklist templates list. Uses `checklistTree.ts` and `CHECKLIST_SECTIONS`. Launches `TemplateCustoimzer.tsx` (unrouted, typo in name) for editing.
- `admin/components/ErrorBanner.tsx`: Shared error banner for admin pages.

##### 5c. Profile and invitations
- `profile/MyProfilePage.tsx`: Profile view with `CopyField`, `getInitials`. Hooks: `useUsers`, `useProjects`. Routed at `/profile` (client) and `/admin/profile` (admin).
- `invitations/InvitationDetailPage.tsx`: Shows an invitation. Actions open `AcceptInvitationModal` and `RejectInvitationModal` (`components/admin/slr-projects/invitation/`). Hook: `useProjects`. Routed at `/invitations/:invitationId`.

##### 5d. Projects
- `projects/ProjectListPage.tsx`: List of projects the user belongs to, with a create button. Uses `ProjectTable` and `ProjectFormModal`. Hook: `useProjects`. Routed at `/projects`.
- `projects/ProjectDetailPage.tsx`: Project shell with header, step progress nav (`StepProgressNav`), and nested tabs: `overview` (`OverviewTabContent`), `workspace/:stepId` (`PaperPoolTab`). Also `ProjectSetupSection`, `BusinessJustificationSection`, `ActivateProjectStep`, `ProjectDrawers`, `ProjectMembersModal`, `ProjectFormModal`. Hooks: `useProjects`, `useReviewProcesses`, `useProjectGovernance`, `useProjectMember`.
- `projects/ProjectSettingsPage.tsx`: Settings for members and agents. Uses `ProjectMembersModal` and `ProjectAgentAssignments`. Hook: `useProjects`. Routed at `/projects/:id/settings`.
- `projects/ProjectAuditLogPage.tsx`: Project-scoped audit log with `SummaryCard`. Hook: `useAuditLogs`. Routed at `/projects/:id/audit-logs`.
- `projects/PaperDetailsPage.tsx`: Single paper view. Hooks: `usePaperDetails`, `usePaperDiscovery`, `useProjectMember`. Uses `PaperViewer/components`, `PdfJsViewer`, and `CitationGraphModal`. Routed at `/projects/:projectId/papers/:paperId`.
- `projects/AIProjectSetupWizard.tsx`: Multi-step AI-assisted setup for PICO-C and research questions. Imported by `components/projects/detail/ProjectSetupSection.tsx` (not routed). State in `aiSetupWizard/hooks/useAIProjectSetupState.ts`. Steps and views: `SetupWizardFlow`, `SetupEditForm`, `SetupSummaryView`, shared `Common.tsx`. Types in `aiSetupWizard/types.ts`, constants in `aiSetupWizard/constants.ts`.

##### 5e. Checklist (PRISMA-style review checklists)
- `checklist/ChecklistDashboardWrapper.tsx`: Route wrapper. Uses React Query (`useQuery`, `useMutation`) and `checklistApi`. Renders `ChecklistDashboard`. Routed at `/projects/:projectId/checklists`.
- `checklist/ChecklistDashboard.tsx`: Checklist cards with a modal. Imported by the wrapper.
- `checklist/ChecklistEditorPage.tsx`: Editor for one checklist. Uses `components/checklist/ChecklistEditor`. Routed at `/projects/:projectId/checklists/:checklistId`.

##### 5f. Manage study selection (leader dashboard for screening)
- `manage-study-selection/ManageStudySelectionPage.tsx`: Leader screening dashboard. Hook: `useStudySelection`. Uses `PaperViewer` (shared) and `Button`. Modals and panels in `manage-study-selection/components/`:
  - `StuSePanelTab`, `PaperList`, `SelectionActionPanel`, `CriteriaTab` (criteria), `AIAnalysisTab`
  - `AssignedReviewersModal`, `StuSeReviewerProgressModal`, `StuSeSettingsModal`, `StuSeDataSetModal`, `StuSeChecklistTemplateModal`
  - `StuSePhaseHeaderController`, `YearRangeSlider`
- `manage-study-selection/StuSePaperStatisticPage.tsx`: Per-reviewer statistics (Included/Excluded). Hooks: `useStudySelection`, `usePaperDetails`. Uses `PaperDetailsView`. Routed at `.../screening/:screeningProcessId/papers-statistic`, leader only.

##### 5g. Review process (phase workspaces)
Entry point: `reviewProcess/ReviewProcessWorkspace.tsx` (hook `useReviewProcessWorkspace`). It shows `ProcessHeader`, `WorkflowTimeline` (phase start, complete, reopen, open), `PrismaReportCard`, and modals for `PaperPoolSelectorModal`, `StudySelectionCriteriaModal`, `QualityAssessmentCriteriaModal`, `SynthesisStrategyModal`. Only the leader (`member.isLeader`) gets phase action buttons.

- Identification: `reviewProcess/IdentificationPhaseWorkspace.tsx` and `reviewProcess/identification/`.
  - Hook: `useIdentificationWorkspace`, plus `useFileImport`, `useSelection`, `useSnapshotDataset`, `useDeduplicationKeyboard`.
  - Tabs (`sections/TabNavigation.tsx`): Searches, Strategies, Import batches, Papers library, Build dataset (snapshot), Ready papers.
  - Modals: `ImportBatchPapersDrawer`, `ManualDeduplicationModal`, `IdentificationCompleteModal`. Shared: `components/identification/modals/ImportRISModal`, `CreateSearchExecutionModal`.
  - Phase constants in `identification/constants.ts`.
- Study selection (screening): `reviewProcess/studySelection/`.
  - `ScreeningPhaseRouter.tsx` splits by role: leader (1) to `ManageStudySelectionPage`, reviewer (3) to `TitleAbstractScreeningWorkspace`.
  - `titleAbstractScreening/TitleAbstractScreeningWorkspace.tsx`: reviewer's title and abstract queue. Uses `PaperQueue`, `ScreeningHeader`, `AiAnalysisPanel`, `SelectionChecklist`, `PaperViewer`, and a citation graph (`graph/CitationGraphCanvas`, `CitationGraphModal`, `PaperDetailsPanel`). Hook: `useStudySelection` (local). Constants in `titleAbstractScreening/constants.ts`.
  - `fullTextScreening/FullTextScreeningWorkspace.tsx`: full-text workflow with `FullTextPaperQueue`, `FullTextReader`, `FullTextRightPanel`, `DecisionBar`, `ConflictDetails`, `AiAnalysisPanel`, `FullTextScreeningHeader`. Hook: `useFullTextScreening`.
  - `components/` (shared): `ExcludeMenu`, `MetadataSuggestionModal`, `UploadFullTextPdfModal`, `ScreeningStepper`, `ScreeningPipelineHeader`, `StudySelectionProcessHeader`. Two of these are unused: `ScreeningStepper` and `StudySelectionProcessHeader`.
- Data extraction: `reviewProcess/dataExtraction/DataExtractionPhaseWorkspace.tsx` (hook `useDataExtractionWorkspace`).
  - Role-based views: `DataExtractionDashboard`, `DataExtractionReviewerWorkspace` (reviewer form, with `ReviewerSidebar`, `ReviewerPdfPanel`, `ReviewerFormPane`), `DataExtractionConsensusWorkspace` (leader consensus, with `ConsensusSidebar`, `ConsensusHeader`, `ConsensusDocumentDrawer`, `ConsensusStateScreen`).
  - Grid: `components/gridWorkspace/ExtractionGridWorkspace.tsx` (AG Grid, `EditableGridCell`, `CellAuditHistoryModal`, `MultiSelectDropdown`). Routed at `/projects/:projectId/extraction/grid`.
  - Comments: `components/comments/FieldComments.tsx`, `IsolatedFieldComments.tsx`.
  - Other: `AssignReviewersModal`, `ExtractionFieldInput`, `ExtractionPreviewModal` (unused), `ExtractionStatusBadge`, `WorkloadSummaryCard`.
  - Hooks: `hooks/useDataExtractionWorkspace.ts`, `hooks/useCellAuditLogs.ts`. Utils: `utils/evidenceCoordinates.ts`.
- Quality assessment: `reviewProcess/qualityAssessment/QualityAssessmentWorkspace.tsx`.
  - Hooks: `hooks/useQualityAssessment.ts` (local), plus `useProjects`.
  - Role views: `ReviewerQAPanel` (scoring), `LeaderQAPanel` (leader overview). Also `AssessmentQueue`, `AssessmentPaperViewer`, `AssessmentContextPanel` (unused), `QAPaperDetails`, `QAAssignModal`, `QAAutoResolveModal`, `ReviewerProgressPanel`.
  - Sections: `QAHeader`, `QAPapersTabContent`, `AssignMembersTabContent`.
- Synthesis: `reviewProcess/synthesisExecution/SynthesisPhaseWorkspace.tsx` (routed under `/synthesis/*`).
  - Sub-views by section (`SECTION_LABELS`): `SynthesisDashboard`, `ThematicWorkspace`, `EvidenceMatrixView`, `SubgroupAnalysisMatrix`, `DescriptiveChartsWorkspace` (recharts pie and bar), `RqReportingWorkspace` (findings per research question), `RichTextEditor` (tiptap).
  - Modals: `SynthesisStrategyModal`, `StrategyGuidelinesModal`, `SynthesisThemeModal`, `SynthesisThemeCard`, `SourceDataAccordion`, `ConfirmationModal`, `SynthesisWorkspaceErrorBoundary`.
  - Hook: `hooks/useSynthesisWorkspace.ts`. Also `useReviewProcesses`.
- PRISMA report: `reviewProcess/prismaReport/PrismaReportWorkspace.tsx` (hook `usePrismaReport`).
  - Sections: `PrismaReportHeader`, `PrismaSummaryHeader`, `PrismaFlowDiagram` (flow diagram), `PrismaExclusionTable`, `PrismaExportActions`, `PrismaReportHistory`.
  - Constants: `prismaReport/constants.ts`.
- Leader-only pages (inside process):
  - `reviewProcess/leader/AssignPapersPage.tsx`: not routed or imported (orphan).
  - `reviewProcess/leader/ResolveConflictPage.tsx`: not routed or imported (orphan). Conflict resolution now lives in the screening workspaces.
  - `reviewProcess/leader/ReviewerProgressPage.tsx` (with `ReviewerAssignmentModal`): imported by `StuSeReviewerProgressModal` (modal use).
  - `reviewProcess/leader/StudySelectionDataSetPage.tsx` (`BuildDatasetPage`): imported by `StuSeDataSetModal`.
  - `reviewProcess/leader/StudySelectionChecklistTemplatePage.tsx`: imported by `StuSeChecklistTemplateModal`. Uses `ChecklistTemplateVersions`, `ChecklistTemplateDetailModal`, `ChecklistTemplatePreview` (orphan).
  - `reviewProcess/leader/settings/ProcessSettingPage.tsx`: imported by `StuSeSettingsModal`. Tabs for exclusion codes (`ProcessExclusionCodeTab`) and similar settings.
  - `reviewProcess/leader/components/PaperCard.tsx`, `SnapshotDatasetView.tsx`.
  - `reviewProcess/leader/types.ts`.

##### 5h. Orphan or unused page-level files (verified by import search)
- Not imported anywhere: `leader/AssignPapersPage.tsx`, `leader/ResolveConflictPage.tsx`, `leader/components/checklist-template/ChecklistTemplatePreview.tsx`, `dataExtraction/components/ExtractionFieldInput.tsx`, `dataExtraction/components/ExtractionPreviewModal.tsx`, `qualityAssessment/components/AssessmentContextPanel.tsx`, `studySelection/components/ScreeningStepper.tsx`, `studySelection/components/StudySelectionProcessHeader.tsx`.
- Not routed (route-level) but still imported: `admin/TemplateCustoimzer.tsx`, `projects/AIProjectSetupWizard.tsx`, `checklist/ChecklistDashboard.tsx`.
- Possibly dead code and worth checking before deleting: all orphans above.

##### 5i. Pages count by area (approx)
- reviewProcess: about 110 files (the largest area by far).
- admin: about 20.
- projects: about 15.
- manage-study-selection: about 12.
- checklist, profile, auth, home, invitations, not-found: about 10.

---

#### 6. Layouts and shared components (`src/components/`, 226 files)

##### 6a. ui/ (design-system primitives, hand-rolled, Tailwind classes)
- Inputs: `Button`, `Input`, `Textarea`, `Select`, `FormSelect`, `Checkbox`, `Switch`, `Label`, `FormField`, `FormSelect`, `FormTextarea`, `HelperText`.
- Layout and containers: `Card` (exports `Card`, `CardHeader`), `Drawer`, `Modal` (exports `Modal`), `ConfirmModal`, `Sidebar` (used by admin shell and some client pages), `Tabs`, `Tooltip`, `Dropdown`.
- Data: `Table`, `Pagination`, `EmptyState`, `Skeleton` (exports `Skeleton`, `CardSkeleton`), `SectionLoading`, `LoadingSpinner` (exports `LoadingSpinner`).
- Text: `MarkdownContent` (react-markdown wrapper, exports `MarkdownContent`).
- `document-editor/`: `DocumentAuthoringEditor`, `DocumentAuthoringModal`, `EditorPanel`, `PreviewPanel`, `PreviewDocument`, `ExportDialog`, `ImportDialog`. Used for protocol and checklist-template authoring. Redux slice `documentEditorSlice`.
- `toast/`: `ToastProvider` (wraps react-hot-toast) and `CustomToast`. Helper calls live in `src/utils/toast.tsx` (`toastWarning`, `toastInfo`, `toastError`, `toastSuccess`).

##### 6b. layout/
- `Header.tsx`: top nav. Left: logo, links. Links are "Projects" always. On `/`, also "Workflow", "Features", "About" (in-page anchors). Right: `NotificationDropdown` (with unread count), profile menu, login button. Admin users see an "Admin Console" entry. The role label is shown from `user.role`.
- `Footer.tsx`: site footer.
- `NotificationDropdown.tsx`: notification list fed by `hooks/useNotifications.ts` and `notificationService`.
- `ReviewLayout.tsx`: review-process layout shell.

##### 6c. auth/
- `AuthLayout.tsx`: split layout for sign-in.
- `LoginForm.tsx`: username/password plus Google button. Google is only shown when `VITE_GOOGLE_CLIENT_ID` and `VITE_FIREBASE_API_KEY` are set.
- Guards: `AdminAccessGuard`, `SectionGuard`, `InteractionGuard` (inactive). See section 3.

##### 6d. routes/ (component-level guard)
- `components/routes/ProtectedRouteForProject.tsx`. See section 3.

##### 6e. Other components
- `SignalRConnectionManager.tsx`: mounted in `MainLayout`. Calls `signalRService.start/stop` and `useSignalR`.
- `common/ErrorBoundary.tsx`: class-based error boundary with `fallbackTitle` and `fallbackMessage` props.
- `home/FlowArrow.tsx`, `home/PrismaStep.tsx`: landing-page pieces.
- `logo/SystemSignature.tsx`: brand wordmark ("SLRS"), with `primaryClassName`, `accentClassName`, `className` props.
- `notes/NotesPanel.tsx`: note-taking panel (used in review screens).
- `profile/AdminProfileRedirect.tsx`: see section 3.

##### 6f. admin/ (admin-specific UI)
- `AdminHeader.tsx`: top bar for admin shell. `onMenuClick` opens the mobile drawer.
- `AdminNotification.tsx`: admin notification dropdown.
- `settings/ProjectExclusionCodeTab.tsx`: exclusion-reason library editor.
- `slr-projects/`:
  - `ActionButton.tsx`, `ProjectFormModal.tsx`, `ProjectMembersModal.tsx`.
  - `add-people/`: `UserSearchSection`, `SelectionSection`, `RoleAssignmentPanel`, `ProjectLeaderStatus`, `InvitationWaitlist`, `SentInvitations`, `CancelInvitationConfirm`, `ReplaceLeaderConfirm`. This is the invite/assign flow for project members.
  - `invitation/`: `AcceptInvitationModal`, `RejectInvitationModal`.
- `user-management/`: `AddUserModal`, `UpdateUserModal`, `ChangePreviewModal`, `StatusConfirmModal`.

##### 6g. projects/ (project-level UI)
- `ProjectTable.tsx`, `ProjectUtilityBar.tsx`: list and toolbar for `ProjectListPage`.
- `ObjectiveForm.tsx`, `PICOCForm.tsx`, `ResearchQuestionForm.tsx`, `ReviewNeedForm.tsx`, `DocumentForm.tsx`: protocol forms.
- `ProjectAgentAssignments.tsx`: AI agent assignment per project.
- `detail/`: `ProjectHeader`, `StepProgressNav`, `OverviewTabContent`, `ProjectSetupSection`, `BusinessJustificationSection`, `ActivateProjectStep` (Draft to Active), `ProjectDrawers`, `ObjectivesTab`, `ResearchQuestionsTab`, `ReviewNeedsTab`, `DocumentsTab`, `ProjectTimetableTab`.
- `protocol/wizard/`: `TemplateWizard.tsx` with `Step1_Overview`, `Step2_FlatSetup`, `Step3_MatrixSetup`, `Step4_Preview`. Used for protocol and extraction template setup. Hook: `hooks/useTemplateWizard.ts`.

##### 6h. reviewProcess/ (shared review-process UI)
- `ProcessHeader.tsx`, `ProcessProgress.tsx`, `ProgressOverviewCard.tsx`, `PhaseProgressStepper.tsx`, `PhaseStatsGrid.tsx`, `PhaseSummaryCard.tsx`, `PrismaReportCard.tsx`.
- `ContextPanel.tsx`, `AlertsCard.tsx`, `ActivityTimeline.tsx`, `TeamMembersCard.tsx`, `UpdateNotesModal.tsx`, `CreateProcessModal.tsx`, `ReviewProcessCard.tsx`.
- `workflow/`: `WorkflowTimeline`, `PhaseCard`, `PhaseActions`, `PhaseStatistics`, `PhaseStatusBadge`, `constants.ts`, `types.ts`. This is the phase state machine UI.
- `modals/PaperPoolSelectorModal.tsx`.
- `leader/`: leader tools for assignment and conflict work:
  - `AssignmentHeader`, `BulkAssignmentPanel`, `BulkAssignmentPanelDataExtraction`, `FullTextAssignmentTable`, `TitleAbstractAssignmentTable`, `PapersTable`, `PaperFilters`, `PaperPdfActions`, `PaperViewerModal`.
  - `ConflictResolutionHeader`, `ConflictResolutionModal`, `QuickDecisionPanel`, `ResolutionFormPanel`, `ReviewerDecisionCard`, `ReviewerDecisionsSection`, `ThirdReviewerAssignment`.
  - `ManageStuSeCriteria`, `StudySelectionCriteriaModal`, `QualityAssessmentCriteriaModal`.
  - `ProjectPICOCElement`, `ProjectResearchQuestions`.
  - `settings/AddExclusionReasonsModal`, `settings/ProcessExclusionCodeTab`.

##### 6i. paperPool/ (paper repository and identification pool)
- Page shells: `PaperRepositoryPage.tsx`, `SearchSourcePage.tsx`, `DeduplicationPage.tsx`, `HeroNav.tsx`, `PoolWorkflowStepper.tsx`.
- Tabs and panels: `PaperPoolTab.tsx` (5-step workspace, routed through `ProjectDetailPage` `workspace/:stepId`), `FilterPanel.tsx`, `FilterSidebar.tsx`, `CrossrefFilterSidebar.tsx`, `CrossrefWorksExplorer.tsx`, `SavedFilterDropdown.tsx`, `ManageFiltersModal.tsx`, `NameFilterModal.tsx`.
- Paper table: `PaperTable.tsx`, `PaperRow.tsx`, `BulkActionBar.tsx`, `DeletePaperModal.tsx`, `PaperImportModal.tsx`.
- Search: `SearchStrategyForm.tsx`, `types/search-strategy.ts`.
- Review process from pool: `ReviewProcessPanel.tsx`, `ReviewProcessCard.tsx`, `ReviewProcessRail.tsx`, `AddToProcessByFilterModal.tsx`, `AddToProcessBySelectionModal.tsx`.
- `deduplication/`: `DeduplicationTabContent`, `DuplicateQueuePanel`, `PaperComparisonCard`, `DeduplicationProgressBanner`.
- `snowballing/`: `SnowballingCandidatesPage`, `SnowballingPaperWorkspace`, `SnowballingPaperList`, `CandidateRow`, `CandidateDetailPanel`, `FiltersBar`, `OriginPaperCard`. Uses `mocks/snowballingMockData.ts` (mock data is still used in production code paths).
- `statistics/`: `PaperStatisticsDashboard`, `StatCard`, `ChartCard`, `FilterPanel`, `BarChartComponent`, `LineChartComponent`, `PieChartComponent` (recharts).
- `constants.ts`, `types.ts`, `types/search-strategy.ts`.

##### 6j. papers/ and shared/paper/
- `components/papers/`: `PaperDetailsView`, `PaperAbstractSection`, `PaperAccessPanel`, `PaperMetadataGrid`, `PaperReferencesSection`, `ReferenceExtractionButton`, `ReferenceExtractionPanel`.
- `components/shared/paper/`:
  - `PaperViewer.tsx` and `PaperViewerModal.tsx` (shared viewer, used by screening and leader screens).
  - `PaperViewer/components/`: `PaperHeroHeader`, `PaperSectionSidebar`, `PaperNodeList`, `ContentSection`, `GraphSection`, `IdentifierSection`, `PublicationInfoCard`, `SystemMetadataCollapse`, `ConflictDetails`, `DecisionStatus`, `ResolutionDetails`, `StatusBadge`, `TabButton`.
  - `PaperViewer/hooks/usePaperViewerState.ts`, `constants.ts`, `types.ts`.
  - `PdfJsViewer/PdfJsViewer.tsx` and `hooks/usePdfHighlights.ts` (pdf.js with highlight support).

##### 6k. identification/ (components)
- `identification/import/QuickImportCard.tsx`.
- `identification/modals/ImportRISModal.tsx`, `CreateSearchExecutionModal.tsx`.
- `identification/strategies/SearchStrategiesPanel.tsx`.

##### 6l. checklist/ (components)
- `ChecklistEditor.tsx`, `ChecklistItem.tsx`, `ChecklistPdfPanel.tsx`, `ChecklistPreviewModal.tsx`, `CompletionProgress.tsx`, `SampleAnswerModal.tsx`, `SectionSidebar.tsx`.
- Checklist types: `src/types/checklist.ts`, `checklistApi.ts`. Constants: `src/constants/checklistData.ts`.

##### 6m. ui/ vs components/ui naming
- Only one `ui` folder exists (`src/components/ui`). Primitives are imported with relative paths, not an alias. `tsconfig` has no path alias.

---

#### 7. Hooks, services, and data layer

##### Hooks (`src/hooks/`, 41 files)
- Data fetching (React Query): `useProjects`, `useProjectMember`, `useProjectGovernance`, `useReviewProcesses`, `useReviewProcessWorkspace`, `usePaperPool`, `useProjectPapers`, `usePaperDetails`, `usePaperActions`, `usePaperDiscovery`, `usePaperImport`, `useImportBatches`, `useSearchExecutions`, `useSearchSources`, `useMasterSources`, `useUniquePapers`, `useReadyPapers`, `useDuplicatePairs`, `useSnowballCandidates`, `useCrossrefWorks`, `useStudySelection`, `useStudySelectionChecklistTemplate`, `useStudySelectionChecklistSubmission`, `useSelectionCriteria`, `useQualityAssessment`, `useQualityAssessmentProcess`, `useDataExtractionTab`, `useNestedDataItems`, `useExtractionTemplates`, `useExclusionReasonLibrary`, `usePrismaReport`, `usePhaseProcessMutations`, `usePlanningData`, `useChecklistData`, `useAuditLogs`, `useUsers`, `useNotifications`.
- UI or utility hooks: `useDebounce`, `useHttp` (generic request helper), `useSignalR` (connection state, returns Disconnected because the client is a stub), `useSignalRSubscription`, `useTemplateWizard`, `useMasterSources`.
- Hook files are often wrappers over `services/*`. Feature-local hooks live in folders (e.g. `pages/reviewProcess/*/hooks/`).

##### Services (`src/services/`, 40+ files)
- `config/axios.ts`: single axios instance.
  - baseURL = `VITE_API_URL` or `/api`. Timeout 30s. `withCredentials: true`. JSON content type (FormData strips it).
  - Request interceptor: attaches the Bearer token from Redux. If the token is expired, it calls `refreshToken()` (mutex). Session expiry triggers `handleGlobalLogout`, a toast, and a redirect to `/auth/signin`.
- Service modules (one per domain): `authService` (login, googleLogin, refresh, logout), `projectService` (getMyMembership and project CRUD), `paperService`, `paperPoolService`, `paperImportService`, `paperStatisticsService`, `candidatePaperService` (snowballing), `importBatchService`, `searchExecutionService`, `searchSourceService`, `masterSourceService`, `deduplicationService`, `identificationProcessService`, `studySelectionService`, `studySelectionChecklistTemplateService`, `studySelectionChecklistSubmissionService`, `selectionCriteriaService`, `reviewProcessService`, `qualityAssessmentService`, `dataExtractionService`, `dataExtractionProcessService`, `dataExtractionConductingService`, `synthesisExecutionService`, `prismaReportService`, `checklistService` (`checklistApi`), `exclusionReasonLibraryService`, `invitationService`, `userService`, `auditLogService`, `notificationService`, `aiProjectSetupService`, `coreAndGovernanceService` (legacy governance), `signalrClient` (no-op stub).

##### Config and constants
- `src/config/axios.ts`, `src/config/queryClient.ts`, `src/config/pdfWorker.ts` (pdf.js worker URL).
- `src/constants/queryKeys.ts`: central React Query key factory (e.g. `QUERY_KEYS.projects.myMembership(id)`).
- `src/constants/phaseConfig.ts`: phase icons and display names. Phases: identification, screening ("Study Selection"), extraction ("Data Extraction"), quality ("Quality Assessment"), synthesis, prisma ("PRISMA Report").
- `src/constants/dataExtraction.ts`, `checklistData.ts`, `templateSections.ts`.
- `src/enums/http-method.ts`.

##### Types (`src/types/`, 40+ files)
- Domain types per feature: `project`, `paper`, `identification`, `studySelection`, `qualityAssessment`, `dataExtraction`, `synthesis`, `synthesisExecution`, `prismaReport`, `reviewProcess`, `reviewProcessWorkspace`, `checklist`, `checklistApi`, `selectionCriteria`, `searchSource`, `searchExecution`, `masterSource`, `deduplication`, `notification`, `auditLog`, `signalr`, `templateWizard`, `user`, `auth`, `http`, `documentEditor`, `exclusionReasonLibrary`, `paperStatistics`, `coreAndGovernance`.
- Note: `src/types/project.ts` defines `ProjectRole` with Owner = 1, Lecturer = 2, Reviewer = 3 and compatibility aliases.

##### Utilities (`src/utils/`)
- `auth.ts` (`isTokenExpired`), `cn.ts` (clsx plus tailwind-merge), `dateFormat.ts`, `dateUtils.ts`, `errorUtils.ts`, `formatAuthors.ts`, `formatData.ts`, `projectUtils.ts`, `synthesisValidation.ts`, `suggestedTemplateGenerator.ts`, `versionHelper.ts`, `uuid.ts`, `documentEditorHelpers.ts`, `toast.tsx`.

##### Redux and query state (summary)
- Global client state: `auth` (token, user, flags), `ui` (`currentSection`), `project` (`currentProjectMember`), `documentEditor`.
- Server state: React Query, cache cleared on logout.
- Realtime: none. Live updates come from polling and query invalidation (per `signalrClient.ts` comment: "SignalR is decommissioned in favor of TanStack Query polling").

---

#### 8. Styling, theming, UI conventions

- Tailwind CSS v4 via `@tailwindcss/vite`. CSS is `src/index.css` with `@import "tailwindcss";` and an `@theme { ... }` block. `src/App.css` only contains a comment saying Tailwind is imported in `index.css`.
- Design tokens (`@theme`, in `src/index.css`):
  - Surfaces: `--color-bg-primary #F7F9FA`, `--color-bg-secondary #EEF2F5`, `--color-surface-white`, `--color-surface-ground`, `--color-surface-card`.
  - Text: `--color-text-primary #122331`, `--color-text-secondary #647381`, `--color-text-muted #8B9AA4`, `--color-text-main`, `--color-text-on-primary`.
  - Brand: `--color-accent #0071BC`, `--color-primary #0071BC`, `--color-primary-hover #005F9E`, `--color-primary-light #F0F7FC`, `--color-soft-blue`.
  - Borders: `--color-border #DCE4E9`, `--color-border-default`, `--color-border-focus #0071BC`.
  - Status: `--color-success #16A34A`, `--color-warning #F59E0B`, `--color-error #DC2626`.
  - Z-index scale: badge 10, header 100, dropdown 1000, drawer 2000, modal 5000, popover 7000, tooltip 99999, toast 100000, section-loading 100001.
  - Fonts: `--font-sans`, `--font-primary`, `--font-secondary`, `--font-serif` (font stacks defined in `@theme`).
  - Animations: `--animate-blink`, `--animate-spin-slow`, `--animate-shimmer`.
- Dark mode: none. `grep "dark:"` returns 0 files and there is no `prefers-color-scheme` or `data-theme` handling. The app is light only.
- Theming is single-theme. No ThemeProvider.
- Two design documents describe the visual language. They conflict.
  - `docs/design-system.md` ("SLRS Design System"): warm ivory and beige backgrounds, deep burgundy accent, serif headings, flat cards, uppercase micro-labels. Explicitly bans bright blue, purple, and green.
  - `docs/ui-redesign-guide.md` (Vietnamese, newer): navy `#173247` for titles, blue `#087BC1` accent, `#F6F9FB` app background, sans-serif for the app. It states that for the Admin area it supersedes the color rules in `design-system.md`.
  - The code `@theme` palette (`#0071BC` accent, `#F7F9FA` background) matches neither document exactly. It is closer to the redesign guide.
  - `PRODUCT.md` says: professional, modern, trustworthy. WCAG 2.1 AA target. Respect reduced motion. Do not rely on color alone.
- Component conventions (from code reading):
  - Hand-rolled primitives with Tailwind utility classes. Variants are passed as props (e.g. `Button` `variant="primary" | "secondary"`).
  - `cn()` helper (clsx + tailwind-merge) for conditional classes.
  - Modals use `Modal` (portal-based, z-index 5000). Destructive confirms use `ConfirmModal`.
  - Toasts: `toastSuccess`, `toastError`, `toastWarning`, `toastInfo` from `src/utils/toast.tsx`.
  - Tables: `ui/Table` for admin and leader lists. Some workspaces use AG Grid directly.
  - Icons: react-icons (`Fi*`, `Md*`, `Si*`) and lucide-react are both used. Mixing is common.
- `src/index.css` also has global rules for scrollbars and `font-family` on body and inputs. `.app-content`, `.standard-content`, and `.home-content` classes are used by `MainLayout`.

---

#### 9. Realtime and background behavior

- `SignalRConnectionManager` is mounted in `MainLayout`. It calls `signalRService.start(token)` on login and `stop()` on logout.
- `src/services/signalrClient.ts` is a no-op singleton (comment: "SignalR is decommissioned in favor of TanStack Query polling"). `start`, `stop`, `registerHandler` are all no-ops. `getConnectionState` always returns `Disconnected`.
- `useSignalR` tracks state, which is always Disconnected.
- `vite.config.ts` still proxies `/hubs` with WebSocket support, and `nginx.conf` has no `/hubs` location. Both are dead config if the hub is gone.
- `@microsoft/signalr` remains as a dependency.
- Notifications are polled via `useNotifications` and `notificationService`.

---

#### 10. i18n and copy

- No i18n library (no i18next, react-intl, or `useTranslation`).
- Copy is hard-coded, mostly English. Some pages are in Vietnamese: route fallback messages in `MainRoutes.tsx` ("Không thể tải Checklist", "Đã xảy ra lỗi..."), and some docs.
- Mixed language in the UI is therefore expected. Do not assume a single locale.

---

#### 11. Accessibility and UX notes (from code and PRODUCT.md)

- `PRODUCT.md` target: WCAG 2.1 AA, respect reduced motion, do not rely on color alone for state.
- `Header` has `aria-label` on the menu toggle and notifications button. `HomePage` has `aria-label` on the hero title and PRISMA funnel.
- `ProtectedRouteForProject` has a "Go Back" button using `window.history.back()`.
- `InteractionGuard` (inactive) would block buttons for admins on client routes.
- Reduced-motion handling: no `prefers-reduced-motion` query found in the explored files. Treat this as a gap versus PRODUCT.md (not verified exhaustively).

---

#### 12. Product and roles (from docs)

##### Product summary (README.md, PRODUCT.md)
- Name: SRSS (Systematic Review Support System). Also called SLRS in code and docs.
- Purpose: a web platform for Systematic Literature Reviews following PRISMA 2020. Workflow runs from identification (search, import, dedupe) through screening (title/abstract, full text), quality assessment, data extraction, synthesis, and PRISMA reporting.
- README tech table: React + Vite, React Router DOM, Axios, Redux Toolkit, Tailwind/SCSS/CSS Modules (actual: Tailwind only), ESLint and Prettier (actual: no Prettier config), Vercel-ready.
- README folder structure shows `main.jsx` and `App.jsx`. The actual code uses `.tsx`.
- README setup: `cp .env.example .env`, leave `VITE_API_URL` and `VITE_BE_URL` empty for the Vite proxy. Set `VITE_GOOGLE_CLIENT_ID` and `VITE_FIREBASE_API_KEY` for Google sign-in.
- PRODUCT.md users: researchers conducting SLRs, project coordinators, administrators.
- PRODUCT.md anti-references: ornate decoration, generic dashboards that obscure workflow, invented metrics or statuses.

##### Roles in code
- System roles (`user.role`, string): `Admin` and other user roles. `ProtectedRoute` compares case-insensitively.
  - Admin: `/admin/*` plus client pages in read-only intent (InteractionGuard disabled, so currently not enforced in UI).
  - Non-admin: client routes only.
- Project roles (numeric, from `projectService.getMyMembership` and `useProjectMember`):
  - 1 = Owner / Leader. `isLeader = true`.
  - 2 = Lecturer / Member.
  - 3 = Reviewer.
  - `useProjectMember` maps text roles: OWNER, ADMIN, LEADER to 1; LECTURER, MEMBER to 2; REVIEWER to 3; anything unknown falls back to 3.

##### Workflow phases (phaseConfig and role docs)
1. Identification: search sources (IEEE, Scopus, ACM, PubMed, Crossref, OpenAlex, Semantic Scholar), search executions, RIS and BibTeX import, import batches, deduplication, snapshot dataset, "ready papers".
2. Study selection (screening): title/abstract screening by reviewers (Include or Exclude with a reason code), full-text screening with PDF upload, conflict resolution by leader.
3. Quality assessment: QA checklist scoring (Yes = 1, Partially = 0.5, No = 0 per role guide), threshold to proceed.
4. Data extraction: reviewer forms per study, consensus workspace for leader, grid view for all.
5. Synthesis: thematic and descriptive synthesis, evidence matrix, RQ reporting.
6. PRISMA report: flow diagram, exclusion table, export.

Cross-cutting: PICO-C and research questions, protocol setup (optionally AI-assisted), audit logs, invitations and member management, snowballing from citations.

##### project_leader_role_guide.md (Vietnamese)
- Leader is "Project Owner / Trưởng nhóm": defines protocol, manages members and roles, runs the paper pool (5-step stepper: research strategy, search strategy, paper repository, review process, select and assign), controls phase start, complete, and reopen, sets inclusion and exclusion criteria and QA criteria, resolves conflicts as final arbiter, views per-reviewer stats, exports PRISMA.
- Route map in the guide: `/projects`, `/projects/:id/overview`, `/projects/:id/workspace/:stepId` (PaperPoolTab, steps 1 to 5), `/projects/:id/settings`, `/projects/:id/audit-logs`, `/projects/:id/workspace` or `.../processes/:processId`, `/projects/:id/identification`, `/projects/:id/screening/dashboard`, `.../papers-statistic` (leader only), `/projects/:id/screening/full-text`, `/projects/:id/quality-assessment`, `/projects/:id/extraction`, `/projects/:id/extraction/grid`, `/projects/:id/synthesis/*`, `/projects/:id/prisma-report`.
- Permission matrix (leader can do all of the following; reviewer cannot): edit protocol, import papers, assign papers, start and complete phases, resolve conflicts, view stats, invite and remove members.
- Role mapping in this guide: Leader = Role 1. The guide says Reviewer = Role 2, which conflicts with code (Reviewer = 3). See section 13.

##### reviewer_role_guide.md (Vietnamese)
- Reviewer (Screener / Extractor) does blind independent review. Phases: title and abstract, full text, QA scoring, data extraction.
- Title and abstract: Include, or Exclude with a mandatory exclusion reason from the library plus optional notes.
- Full text: open PDF or DOI, fill study selection checklist, final Include or Exclude.
- QA: score QA checklist per question (Yes = 1, Partially = 0.5, No = 0), auto total, threshold to continue.
- Data extraction: fill form (author, year, venue, country, language, architecture, dataset, tools, RQ answers), Save Draft or Submit.
- Route map (reviewer):
  - `/projects`, `/projects/:id/overview` (read only), `/projects/:id/workspace` (progress view), identification (read only), `.../screening/:screeningProcessId` (`TitleAbstractScreeningWorkspace`), `.../full-text-screening/:screeningProcessId`, `.../quality-assessment/:qualityAssessmentId`, `.../extraction/workspace/:studyId`, `.../extraction/grid` (read only).
- Note: the guide says reviewer on `.../screening/:id` is routed by `ScreeningPhaseRouter` with Role = 2. Code uses 3 (`member.role === 3`). The route guard for the legacy screening path also allows `[1, 3]`.
- Permission matrix: reviewer can screen assigned papers, score QA, extract data, view progress. Cannot import, assign, control phases, resolve conflicts, invite members.

##### docs/ (selected)
- `docs/design-system.md`: "SLRS Design System" (burgundy, serif, editorial). See section 8.
- `docs/ui-redesign-guide.md`: Vietnamese redesign guide (navy and blue), explicitly supersedes design-system.md for Admin. See section 8.
- `docs/reviewer-step5-ux-brainstorm.md`: UX problem. Reviewer sees active checkboxes on Step 5 (Select and Assign) but cannot act, because bulk assignment is gated to `isLeader` on both frontend (`BulkActionBar`, `ReviewProcessPanel`) and backend. Proposed fixes discussed there.
- `docs/modules/checklist/CHECKLIST_MODULE_GUIDE.md` and `CHECKLIST_FEATURES.md`: PRISMA 2020 checklist module (types, components, editor).
- `docs/core-governance/CORE_GOVERNANCE_README.md` and `ai-project-setup.md`: older Core and Governance module docs (mentions Supabase and env vars now legacy).
- `docs/integration/*.md` (~25 files): integration reports, gap reports, and backend contract notes for identification, screening, PRISMA, citation graph, Grobid suggestions, and paper deletion. Contains status reports (e.g. `FrontendIntegration-Complete.md`, `RealAPIIntegration-Complete.md`), plus `current-code-base-content.txt`.
- `docs/api/*.md` (~30 files): backend API docs (Project, Paper, ReviewProcess, Selection, Import, Dedup, PRISMA, Checklist, SearchExecution, SearchSources, Snapshot, etc.). These describe the backend contract the UI calls.
- `docs/archive/`: one archived risk assessment.
- `docs/PaperPool-FilterCollections-API-Contract.md`, `PaperPool-FilterSettings-API-v2.md`: filter collection contracts used by the paper pool.
- `docs/ui-redesign-guide.md` and `docs/reviewer-step5-ux-brainstorm.md` are the most UI-relevant.
- `.github/copilot-instructions.md`: coding standards for AI tooling (see section 2).

---

#### 13. Discrepancies and gaps (worth knowing)

1. Role numbering conflict. Docs say Reviewer = Role 2. Code uses:
   - `ProjectRole.Reviewer = 3` (`src/types/project.ts`)
   - `ScreeningPhaseRouter` branches on `member.role === 3` for reviewer and `=== 1` for leader.
   - `useProjectMember` maps REVIEWER to 3.
   - `ProtectedRouteForProject` normalizes REVIEWER to 3, and LECTURER/MEMBER to 2.
   - The reviewer guide's "Role = 2" is out of date. Treat code (3) as the source of truth.
2. Routing library mix. Both `react-router` and `react-router-dom` are installed and used in different files. Both are v7, so they probably work, but this is a maintenance risk.
3. Unrouted `*` fallback. `MainRoutes` comments out `<Route path="*" element={<Navigate to="/404" />} />`. Unknown client paths render blank content inside `MainLayout`.
4. InteractionGuard disabled. Admin read-only behavior on client pages is not enforced (the wrapper is commented out in `MainLayout`).
5. SignalR is a stub, but the hook, the manager component, the nginx/vite `/hubs` config, and the dependency remain. The UI is polling-based.
6. Supabase is a leftover dependency and env var. `coreAndGovernanceService.ts` and `docs/core-governance` still reference it.
7. Google sign-in config gap. Docker build passes only `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` as build args. `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_AUTH_EXCHANGE_URL` are not passed, so Google sign-in will be off in Docker images unless added.
8. nginx has no 50x page. `error_page` points at `/50x.html`, which is not shipped.
9. CI lint is non-blocking (`continue-on-error: true`). ESLint rules are heavily relaxed (`exhaustive-deps`, `no-explicit-any` off).
10. No tests in the frontend. Only two `scripts/test_step*.mjs` helpers.
11. Orphan components and pages (see 5h). Dead code candidates.
12. Typo file: `pages/admin/TemplateCustoimzer.tsx`.
13. Design direction conflict between `docs/design-system.md` (burgundy/serif) and `docs/ui-redesign-guide.md` (navy/blue). Code palette matches neither exactly.
14. Dark mode is not implemented. No theme switch.
15. Mock data in production code. `mocks/snowballingMockData.ts` is imported by snowballing components.
16. Mixed icon libraries (react-icons and lucide-react), mixed routers, mixed Vietnamese and English copy.
17. `README.md` describes `main.jsx` and `App.jsx` and mentions SCSS and CSS Modules and Prettier, none of which match the repo.
18. `dist/` is present locally but gitignored. Do not treat it as source.
19. Several long files exceed the 600-line guidance in `copilot-instructions.md` (not measured per file in this pass).

---

#### 14. Quick reference: where to look

- Add a route: `src/routes/MainRoutes.tsx` (client), `src/routes/AdminRoutes.tsx` (admin), `src/routes/AuthRoutes.tsx` (auth).
- Change role gating: `src/routes/ProtectedRoute.tsx` (global role), `src/components/routes/ProtectedRouteForProject.tsx` (project role), `src/types/project.ts` (role enum), `src/hooks/useProjectMember.ts` (role normalization).
- Auth flow: `src/pages/auth/LoginPage.tsx`, `src/components/auth/LoginForm.tsx`, `src/services/authService.ts`, `src/redux/slices/authSlice.ts`, `src/config/axios.ts` (refresh and interceptors), `src/App.tsx` (init and refresh on boot).
- Global shell: `src/layouts/MainLayout.tsx`, `src/components/layout/Header.tsx`, `src/pages/admin/AdminDashboard.tsx`.
- Design tokens: `src/index.css` `@theme` block.
- UI primitives: `src/components/ui/*`.
- API base URL and dev proxy: `src/config/axios.ts`, `vite.config.ts`, `nginx.conf`.
- Deploy: `Dockerfile`, `nginx.conf`, `vercel.json`, `.github/workflows/ci.yml`.

---

## Phụ lục E: slr-fe data layer, FE↔BE contract


Scope: `slr-fe` (React 19 + Vite 7 + TS, Redux Toolkit + redux-persist, TanStack Query v5, axios). Backend: `../slr-be` (Express + TypeScript + Firebase/Firestore, mounted at `/api`).

Legend for endpoint status: `OK` = FE path has a matching route literal in slr-be/src (full or near-full match). `MISS` = grep-verified absent from slr-be/src. `?` = not verified individually (heuristic match only).

Base URL: `api` axios instance uses `baseURL = VITE_API_URL || "/api"`. Paths below are relative to that base, so `/projects` means `<base>/projects`. In prod `.env.production` has `VITE_API_URL=https://api.hyperdatalab.org/api`. In dev, Vite proxies `/api` to `VITE_BE_URL` (fallback `localhost:5000`).

---

#### 1. Config layer (`src/config/*`)

- `config/axios.ts`: single `api` instance. `timeout 30000`, `withCredentials: true`, JSON content type (deleted for FormData).
  - Request interceptor: attaches `Authorization: Bearer <accessToken>` from Redux `auth`. If `isAuthenticated` and token expired (`utils/auth.isTokenExpired`), it awaits a single-flight `refreshToken()` (mutex via `refreshPromise`). If refresh fails it calls `handleGlobalLogout()` (dispatch `logout`, warning toast "Session Expired", `location.replace("/auth/signin")`), then rejects with "Token expired".
  - Response interceptor: on 401 with `isAuthenticated`, one retry after refresh (`_retry` flag). On refresh failure, dispatches `logout`. Logs timeouts and network errors.
- Refresh uses raw `axios.post(`${API_BASE_URL}/auth/refresh`, null, {withCredentials:true})` in `services/authService.refresh()`, to avoid interceptor loops. The refresh token is expected as an httpOnly cookie. The response is `{isSuccess, data:{accessToken, accessTokenExpiresAt,...}}`.
- `config/queryClient.ts`: `QueryClient` with `retry: 1`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`, `staleTime: 2 min`. Cleared on logout by the Redux middleware.
- `config/pdfWorker.ts`: `PDF_WORKER_URL = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url)`, so the worker is bundled locally, not from a CDN. Used by `PdfJsViewer`, `PaperDetailsView`, `ChecklistPdfPanel`, `ConsensusDocumentDrawer`. Note `pdfjs-dist ^3.4.120` and `@react-pdf-viewer/*` are both in deps.
- `enums/http-method.ts`: `HttpMethod` const (GET/POST/PUT/PATCH/DELETE). Only consumed by `useHttp`.
- `types/http.ts`: `RequestConfig`, `ApiResponse<T>{success,data,message?}`, `UseHttpResponse`.
- Generic `hooks/useHttp.ts`: wraps `api.request` with loading/error/data state. Error message comes from `response.data.message`.
- Vite (`vite.config.ts`): proxies `/api` and `/hubs` (ws:true) to backend. The `/hubs` proxy is dead, see SignalR.
- `nginx.conf` (container): `location /api/` proxies to `http://slr-backend:5000/api/`, with `client_max_body_size 10m`, and SPA fallback `try_files ... /index.html`. `vercel.json` has the same SPA rewrite.
- `.env.example` documents `VITE_BE_URL`, `VITE_API_URL`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_EXCHANGE_URL`, `VITE_GOOGLE_CLIENT_ID`, and legacy `VITE_SUPABASE_*` (comment: "current src tree does not use Supabase"). `.env.production` is tracked in git (it is in .gitignore but was committed). It holds Firebase API key, Google client ID, and BE URLs. These are client-side public keys, but worth knowing.

#### 2. Auth flow

- Two login paths in `services/authService.ts`:
  1. Credential login: `POST /auth/login` with `{keyLogin, password}`. Also `POST /auth/dev/quick-login` with `{keyLogin}` (dev shortcut) and `POST /auth/register` with `{fullName,email,username,password,role:number}`.
  2. Google via Firebase: FE gets a Google ID token, then exchanges it at Firebase Identity Toolkit (`accounts:signInWithIdp`, URL from `VITE_FIREBASE_AUTH_EXCHANGE_URL` and key `VITE_FIREBASE_API_KEY`). It then calls `POST /auth/google/login` with `{idToken: <firebaseIdToken>}`. BE verifies via firebase-admin. The FE does not use the Firebase SDK, it does a raw REST exchange.
- Login response: `{isSuccess, message, errors, data:{userId, username, email, accessToken, accessTokenExpiresAt, role}}`.
- Token storage: `accessToken` and `accessTokenExpiresAt` live in Redux `auth`, which is persisted to localStorage by redux-persist (`key "root"`, whitelist `auth`, `ui`, `project`, `documentEditor`). The persisted state is the access token itself, so an XSS can read it. Refresh is cookie-based.
- Redux `authSlice` actions: `login`, `logout`, `updateUser`, `updateAccessToken`, `setInitialized`. The root reducer resets all state on `auth/logout`. The logout middleware calls `queryClient.clear()`, `persistor.purge()`, and removes `persist:auth`.
- Route guards:
  - `routes/ProtectedRoute.tsx`: global guard (`allowedRoles` string[]). Compares role case-insensitively (`trim().toLowerCase()`). Used with `["Admin"]` in `AdminRoutes`.
  - `components/routes/ProtectedRouteForProject.tsx`: per-project guard. Compares against `currentProjectMember.role` (number or string) and `roleText`. Maps role strings to numbers via `normalizeRoleToNumber`: OWNER/ADMIN=1, LECTURER=2, REVIEWER=3, else 99. `MainRoutes` uses `[1,2]`, `[1,3]`, `[1]` with this guard.
- `redux/slices/projectSlice.ts`: `currentProject {id,title}`, `currentProjectMember {role, roleText, isLeader}`, `paperPoolSteps` keyed by projectId.
- `components/auth/*`: LoginForm, AuthLayout, AdminAccessGuard, SectionGuard, InteractionGuard.

#### 3. State management

- Redux Toolkit store (`redux/store.ts`), `serializableCheck:false`, plus `logoutCleanupMiddleware`. Slices:
  - `auth`: `{isAuthenticated, accessToken, accessTokenExpiresAt, user, isInitialized}`.
  - `ui`: `{currentSection: "admin"|"client"|null}`.
  - `project`: see above.
  - `documentEditor`: `{draft: DocumentDraft{title, paragraphs, sections}}`, for the checklist document editor. Uses uuid.
- Server state is TanStack Query. Central keys are in `constants/queryKeys.ts` (`QUERY_KEYS`, plus `DEPRECATED_QUERY_KEYS` aliases). Many hooks still use inline array keys (e.g. `["paper-pool", projectId]`, `["users","me"]`, `["selection-criteria", id]`, `["crossref-works", ...]`, `["candidates","overview",...]`), so invalidation is inconsistent.
- `contexts/`: no React context folder found. State is Redux plus Query plus local `useState`.
- `ToastProvider` (`components/ui/toast/ToastProvider.tsx`) wraps the app. `utils/toast.tsx` wraps `react-hot-toast`.

#### 4. SignalR

- `services/signalrClient.ts`: a **no-op** `SignalRManager` singleton. The header says "SignalR is decommissioned in favor of TanStack Query polling and mutation invalidation". `start`, `stop`, `registerHandler`, `removeHandler` do nothing. `getConnectionState()` always returns `Disconnected`.
- `hooks/useSignalR.ts`: `useSignalRSubscription(event, handler)` and `useSignalR()`. `useSignalR` polls the no-op state every 2s. Both are inert.
- `components/SignalRConnectionManager.tsx`: mounted in `layouts/MainLayout.tsx`. Calls `signalRService.start/stop` on auth change. Both are no-ops.
- `types/signalr.ts` events, all dead on the FE: `ReceiveMessage`, `ReceiveUserMessage`, `ReceiveGroupMessage`, `OnMetadataExtracted`, `OnChecklistAutoFillStatus`. Also an `AutoFillStatus` enum (Queued, ExtractingText, TextExtracted, AnalyzingWithAI, SavingResults, Completed, Failed).
- Backend: **no SignalR or hub code exists in slr-be** (grep for signalr/socket.io/WebSocket/`/hubs` returns nothing). `@microsoft/signalr` is still a FE dependency, and the `/hubs` Vite proxy is dead config. Auto-fill progress is therefore polled, not pushed.

#### 5. Services: full FE endpoint inventory

Files live in `src/services/*.ts`. Each object is exported (e.g. `projectService`, `studySelectionService`). Path templates use `${id}`-style params. Status column is the BE check.

##### authService.ts
- POST /auth/login (OK)
- POST /auth/dev/quick-login (OK)
- POST /auth/register (OK)
- POST /auth/refresh (raw axios, OK)
- POST /auth/google/login (OK)
- External: POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=...

##### userService.ts (`/users`)
- GET /users/search (OK)
- GET /users (list, OK)
- PUT /users/:id/profile (OK)
- PATCH /users/:id/status (OK)
- GET /users/progress-overview (**MISS**: no route in users.routes.ts)
- GET /users/me (OK)
- POST /users/change-password (**MISS**)
- GET /users/export/excel (OK)

##### projectService.ts (`/projects`)
- POST /projects (OK)
- POST /projects/from-osf-file (OK, multipart)
- GET /projects/:id (OK)
- GET /projects (OK)
- GET /projects/my (OK)
- PUT /projects/:id (OK)
- PUT /projects/:id/dates (OK)
- POST /projects/:id/activate, /complete, /archive (OK)
- DELETE /projects/:id (OK)
- GET /projects/:id/members (OK)
- GET /projects/:id/my-membership (OK)
- POST /projects/:id/invitations (OK)
- PUT /projects/:id/members/:userId (OK)
- DELETE /projects/:id/members/:userId (OK)
- GET /projects/:id/picocs (OK)
- GET /projects/:id/research-questions (OK)
- GET /projects/export/excel (OK)

##### invitationService.ts (`/invitations`)
- GET /invitations/:projectId/from (?)
- GET /invitations/:id (?)
- DELETE /invitations/:id (?)
- POST /invitations/:id/reject (?)
- POST /invitations/:id/accept (?)

##### notificationService.ts (`/notifications`)
- GET /notifications (OK)
- GET /notifications/unread-count (OK)
- **PUT** /notifications/:id/read: **MISS by method**. BE defines `PATCH /:notificationId/read`.
- **PUT** /notifications/read-all: **MISS** (no route).

##### coreAndGovernanceService.ts (`/core-govern`, plus `/research-questions`)
- GET /core-govern/review-needs/project/:projectId (OK)
- POST /core-govern/review-needs (OK)
- DELETE /core-govern/review-needs/:needId (OK)
- GET /core-govern/commissioning-documents/project/:projectId (OK)
- POST /core-govern/commissioning-documents (OK)
- DELETE /core-govern/commissioning-documents/:documentId (OK)
- GET /core-govern/review-objectives/project/:projectId (OK)
- POST /core-govern/review-objectives (OK)
- DELETE /core-govern/review-objectives/:objectiveId (OK)
- GET /research-questions/project/:projectId (OK)
- POST /core-govern/research-questions (OK)
- DELETE /core-govern/research-questions/:questionId (OK)
- GET /core-govern/question-types (OK)
- **PUT** /core-govern/question-types/:id (**MISS**, BE has GET only)
- GET /core-govern/picoc-elements/research-question/:questionId (OK)
- POST /core-govern/picoc-elements (OK)
- DELETE /core-govern/picoc-elements/:picocId (OK)

##### aiProjectSetupService.ts (`/projects/:projectId/ai-setup`)
- POST /projects/:id/ai-setup/analyze-topic (OK)
- POST /projects/:id/ai-setup/generate-picoc (OK)
- POST /projects/:id/ai-setup/generate-rqs (OK)
- GET /projects/:id/ai-setup/setup-details (OK)
- PUT /projects/:id/ai-setup/setup-details (OK)

##### searchSourceService.ts
- GET /projects/:id/sources (?)
- POST /search-sources/bulk (OK)
- POST /search-sources (OK)
- PUT /search-sources/:sourceId/strategies (OK)
- POST /ai/projects/:id/analyze-picoc (**MISS**: BE AI router is mounted at `/projects/:projectId/ai` and has only `GET /papers/:paperId/screen-assist`)

##### masterSourceService.ts (`/admin/master-sources`)
- GET /admin/master-sources (?)
- GET /master-sources/available (OK, top-level route)
- GET /admin/master-sources/:id (?)
- POST /admin/master-sources (?)
- PUT /admin/master-sources/:id (?)
- PATCH /admin/master-sources/:id/toggle-status (?)
- GET /admin/master-sources/:id/usage (?)
- DELETE /admin/master-sources/:id (?)

##### exclusionReasonLibraryService.ts (`/exclusion-reason-libraries`)
- GET /exclusion-reason-libraries (OK)
- GET /exclusion-reason-libraries/:id (OK)
- POST /exclusion-reason-libraries/bulk (OK)
- DELETE /exclusion-reason-libraries/:id (OK)
- PATCH /exclusion-reason-libraries/:id/toggle-active (OK)

##### auditLogService.ts
- GET /auditlog/admin (OK)
- GET /auditlog/project-leader/:projectId (OK)

##### checklistService.ts
- GET /checklist/templates (OK)
- GET /checklist/templates/:id (OK)
- POST /checklist/templates (OK, global-admin route)
- POST /reviews/:reviewId/checklist (OK)
- GET /reviews/:reviewId/checklist (OK)
- GET /checklist/:id (OK)
- PUT /checklist/:id/items/:itemId (OK)
- GET /checklist/:id/completion (OK)
- POST /checklist/:id/generate-report (OK, returns a docx blob, downloaded via `window.URL.createObjectURL`)
- POST /checklist/:id/auto-fill (OK, multipart)

##### candidatePaperService.ts (snowballing)
- GET /candidate-papers (OK)
- POST /candidate-papers/reject (OK)
- POST /candidate-papers/select (OK)
- GET /projects/:projectId/papers/papers-with-candidates (OK)
- GET /papers/:paperId/candidates (OK)
- POST /papers/:paperId/extract-references (OK)

##### paperService.ts
- GET /identification-processes/:id/unique-papers (**MISS** for identification; BE has the data-extraction variant only)
- GET /data-extraction-processes/:id/unique-papers (OK)
- POST /papers/assign (OK)
- GET /papers/:paperId (OK)
- DELETE /papers/:paperId (OK)
- DELETE /papers/:paperId/pdf (?)

##### paperImportService.ts
- POST /papers/import/pdf (OK)
- POST /papers/import/ris (OK)
- POST /papers/import/bibtex (OK)
- POST /papers/import/doi (?)
- POST /papers/import/cross-ref (?)
- GET /works (OK, Crossref search)
- GET /works/:doi (OK)

##### paperPoolService.ts
- GET /projects/:id/papers (OK)
- GET /projects/:id/filter-metadata (OK)
- GET/POST /projects/:id/filter-settings (OK)
- GET/PUT/DELETE /projects/:id/filter-settings/:filterId (OK)

##### paperStatisticsService.ts (`/projects/:id/papers/...`)
- GET /projects/:id/papers/{overview, by-year, publication-types, top-journals, top-conferences, top-publishers, languages, fulltext-status, top-keywords, data-quality} (?, the BE has paper-statistics routes, not individually checked)

##### identificationProcessService.ts (`/identification-processes`)
- GET /identification-processes/:id (**MISS**: only start/complete/reopen exist)
- POST /identification-processes/:id/start (OK)
- POST /identification-processes/:id/complete (OK)
- POST /identification-processes/:id/reopen (OK)
- GET /identification-processes/:id/ready-papers (**MISS**)
- GET /identification-processes/:id/snapshot (**MISS**)
- POST /identification-processes/:id/snapshot (**MISS**)

##### searchExecutionService.ts
- POST /identification-processes/:id/search-executions (**MISS**)
- GET /search-executions/:id (**MISS**)
- GET /identification-processes/:id/search-executions (**MISS**)
- PUT /search-executions/:id (**MISS**)
- DELETE /search-executions/:id (**MISS**)
- GET /identification-processes/:id/statistics (**MISS**)

##### importBatchService.ts
- POST /search-executions/:id/import-batches (**MISS**)
- GET /import-batches/:id (**MISS**)
- GET /search-executions/:id/import-batches (**MISS**)
- GET /identification-processes/:id/import-batches (**MISS**)
- PUT /import-batches/:id (**MISS**)
- DELETE /import-batches/:id (**MISS**)
- GET /import-batches/:id/papers (**MISS**)

Summary: the entire **Identification phase data layer** (search executions, import batches, identification process GET, ready papers, snapshot) has no route in slr-be at this commit.

##### deduplicationService.ts
- GET /projects/:id/duplicate-pairs (OK)
- PATCH /projects/:id/duplicate-pairs/:pairId/resolve (OK)
- POST /projects/:id/papers/:paperId/mark-as-duplicate (**MISS**)
- POST /projects/:id/deduplication/run (OK, BE `POST /run`)

##### dataExtractionService.ts (templates)
- POST /data-extraction/templates/upsert (OK)
- GET /data-extraction/process/:processId/templates (OK)
- GET /data-extraction/templates/:templateId (OK)
- DELETE /data-extraction/templates/:templateId (OK)

##### dataExtractionProcessService.ts
- GET /data-extraction-processes/:id (?)
- POST /data-extraction-processes/:id/start (?)
- POST /data-extraction-processes/:id/complete (?)

##### dataExtractionConductingService.ts (`/data-extraction-processes/:id/...`)
- GET .../dashboard (OK)
- PUT .../papers/:paperId/assign (?)
- POST .../papers/:paperId/submit (?)
- POST .../papers/:paperId/direct-extract (?)
- POST .../papers/:paperId/auto-extract (?)
- POST .../ask-ai-field (?)
- GET .../papers/:paperId/consensus (?)
- GET .../papers/:paperId/reviewer-workspace (?)
- POST .../papers/:paperId/fields/:fieldId/comments (?)
- POST .../papers/:paperId/consensus/submit (?)
- GET .../export (OK), GET .../export/csv (OK), GET .../export/preview (?)
- GET .../editable-grid (?), PUT .../editable-grid/cell (OK)
- GET .../audit-logs (OK)
- GET .../workload-summary (?)
- POST .../papers/:paperId/reopen (OK)

##### reviewProcessService.ts
- POST /projects/:id/review-processes (OK)
- GET /projects/:id/review-processes (OK)
- GET /review-processes/:id (OK)
- **PUT** /review-processes/:id (**MISS**)
- POST /review-processes/:id/start (OK)
- POST /review-processes/:id/complete (OK)
- **POST** /review-processes/:id/cancel (**MISS**)
- **DELETE** /review-processes/:id (**MISS**)
- POST /review-processes/:id/reopen-phase/:phase (OK)
- POST /review-processes/:id/papers (OK)
- POST /review-processes/:id/papers/add-from-filter-setting (OK)

##### studySelectionService.ts (largest, about 46 calls)
- POST /review-processes/:id/study-selection (**MISS**)
- GET /study-selection/:id/phase-status (OK)
- GET /study-selection/:id (OK)
- POST /study-selection/:id/start (OK)
- POST /study-selection/:id/complete (OK)
- GET /study-selection/:id/eligible-papers (OK)
- POST /study-selection/:pid/papers/:paperId/decision (OK)
- GET /study-selection/:pid/papers/:paperId/decisions (OK)
- GET /study-selection/:pid/conflicts (OK)
- POST /study-selection/:pid/papers/:paperId/resolve (OK)
- GET /study-selection/:pid/papers/:paperId/status (OK)
- GET /study-selection/:pid/statistics (OK)
- GET /study-selection/:pid/papers (OK)
- POST /papers/:paperId/full-text (?)
- POST /paper-fulltext/upload-signature (OK)
- POST /paper-fulltext/finalize-upload (OK)
- POST /paper-fulltext/upload (OK, multipart with PascalCase fields)
- GET /study-selection/:id/title-abstract/papers (OK)
- GET /study-selection/:id/full-text/papers (OK)
- POST /paper-fulltext/:paperId/extract-metadata (OK)
- POST /papers/:paperId/apply-metadata (?)
- GET /study-selection/:id/assigned-papers (OK)
- GET /study-selection/:id/conflicts-by-phase (OK)
- GET /study-selection/:pid/papers/:paperId (OK)
- GET /study-selection/:pid/papers/:paperId/conflict-detail (OK)
- GET /papers/:id/references (?)
- GET /papers/:id/citations (?)
- GET /papers/:id/graph (?)
- GET /papers/top-cited (OK)
- GET /papers/:id/suggestions (?)
- GET /study-selection/:pid/papers/:paperId/ai-result (?)
- POST /study-selection/:pid/papers/:paperId/ai-evaluate (OK)
- POST /study-selection/:pid/papers/:paperId/full-text/ai-evaluate (OK)
- POST /study-selection/:pid/exclusion-reasons (OK)
- GET /study-selection/:pid/exclusion-reasons (OK)
- PATCH /study-selection/exclusion-reasons/:id/toggle-active (**MISS**)
- DELETE /study-selection/exclusion-reasons/:id (**MISS**)
- POST /study-selection/:id/papers/bulk-resolve (**MISS**)
- GET /study-selection/:pid/papers/:paperId/reviewer-decisions (OK)
- GET /study-selection/:id/included-full-text-papers (**MISS**)
- GET /study-selection/:id/included-papers (OK)
- POST /study-selection/:id/bulk-dataset (**MISS**)
- GET /study-selection/:pid/reviewers/:reviewerId/assignment-table (**MISS**)
- GET /study-selection/:pid/papers/conflict-status (OK)
- GET /study-selection/:id/live-review-import (**MISS**)
- GET /study-selection/:id/final-resolution-progress (**MISS**)

##### studySelectionChecklistSubmissionService.ts
- GET /study-selection-checklist-submissions/context (**MISS**)
- POST /study-selection-checklist-submissions (**MISS**)
- GET /study-selection-checklist-submissions/reviewer-submission (**MISS**)

##### studySelectionChecklistTemplateService.ts
- GET /projects/:id/study-selection-checklist-template (?)
- POST /projects/:id/study-selection-checklist-template (?)
- GET /projects/:id/study-selection-checklist-templates/:templateId (?)
- POST /study-selection-checklist-templates/:templateId/activate (OK)

##### selectionCriteriaService.ts
- POST /selection-criteria/generate-ai/:processId (**MISS**)
- POST /selection-criteria/save-ai-result (**MISS**)
- GET /selection-criteria/process/:processId (OK, returns an empty-criteria stub)

##### prismaReportService.ts
- POST /projects/:id/prisma/reports (OK)
- GET /projects/:id/prisma/reports/:reportId (OK), with fallback `/projects/current/...` when no projectId
- GET /projects/:id/prisma/reports (OK)
- GET /projects/:id/prisma/reports/latest (OK)
- GET /projects/:reviewProcessId/prisma/reports/latest/docx (OK, the param is a review process id passed as project)

##### qualityAssessmentService.ts (`/quality-assessment`)
- GET /quality-assessment/:id (OK)
- POST /quality-assessment/:id/start (OK)
- POST /quality-assessment/:id/complete (OK)
- POST /quality-assessment/assignments (**MISS**)
- POST /quality-assessment/auto-resolve (**MISS**)
- GET /quality-assessment/:id/leader (OK)
- GET /quality-assessment/:id/assignments/my (OK)
- GET /quality-assessment/:id/strategies (OK)
- POST /quality-assessment/decisions (**MISS**)
- PUT /quality-assessment/decisions/:id (**MISS**)
- POST /quality-assessment/resolutions/ (**MISS**)
- PUT /quality-assessment/resolutions/:id (**MISS**)
- POST /quality-assessment/decisions/ai (**MISS**)
- POST /quality-assessment/strategies/upsert (**MISS**)
- POST /quality-assessment/checklists/bulk (**MISS**)
- POST /quality-assessment/criteria/bulk (**MISS**)
- GET /quality-assessment/:id/export/excel (OK)

Summary: all QA write paths (assign, decide, resolve, AI decide, strategies upsert, bulk checklists/criteria) are absent in BE. Only reads, start/complete, and export exist (`phase-compatibility.routes.ts`). The BE QA module (`/projects/:projectId/quality/...`) is not what the FE calls.

##### synthesisExecutionService.ts
- GET /synthesis-execution/:rpId/workspace (OK)
- GET /synthesis-execution/:rpId/extracted-data (OK)
- GET /synthesis/process/:id/synthesis-strategies (OK)
- POST /synthesis/strategies/upsert (OK)
- POST /synthesis-execution/:rpId/start (OK)
- POST /synthesis-execution/:rpId/complete (OK)
- POST /synthesis-execution/:processId/themes (OK)
- PUT /synthesis-execution/themes/:themeId (OK)
- DELETE /synthesis-execution/themes/:themeId (OK)
- POST /synthesis-execution/themes/:themeId/evidence (?)
- DELETE /synthesis-execution/evidence/:evidenceId (?)
- PUT /synthesis-execution/findings/:findingId (?)

##### searchSource / other
- `services/masterSourceService.ts` covered above.
- `services/importBatchService.ts`, `searchExecutionService.ts`, `identificationProcessService.ts`: covered above.

##### Raw fetch (non-axios)
- `studySelectionService.uploadPaperFullText`: signed Cloudinary upload via `fetch(sigData.uploadUrl, POST multipart)`. Flow: `/paper-fulltext/upload-signature`, then Cloudinary, then `/paper-fulltext/finalize-upload`. Falls back to `/paper-fulltext/upload` on error. BE has cloudinary and multer-storage-cloudinary, so this is wired end to end.
- No `supabase` client calls exist in src (only the legacy `.env` keys).

##### Other services FE calls that are not in an api. call
- `services/paperImportService` also exposes `searchWorks` and `getWorkDetail` (Crossref via BE `/works`).

#### 6. Hooks (`src/hooks/*`): one line each

Query keys are from `constants/queryKeys.ts` unless noted as inline.

- useAuditLogs: admin and project-leader audit logs. GET /auditlog/admin, /auditlog/project-leader/:id. Keys `auditLogs.admin`, `auditLogs.projectLeader`.
- useChecklistData: pure checklist-editor state and logic (`useChecklistData`, `useChecklistEditorState`). No network.
- useCrossrefWorks: Crossref search with cursor pagination, plus a DOI detail mutation. GET /works, GET /works/:doi. Inline key `["crossref-works", params, cursorDepth]`.
- useDataExtractionTab: composes useExtractionTemplates with `templateToDataItems`/`dataItemsToTemplate`. No direct network.
- useDebounce: generic value debounce. No network.
- useDuplicatePairs: duplicate-pair list, resolve mutation (optimistic), and run-deduplication mutation. GET /projects/:id/duplicate-pairs, PATCH .../resolve, POST .../deduplication/run. Key `paperPool.duplicatePairs`. Invalidates `paperPool.papers` and `paperPool.metadata`.
- useExclusionReasonLibrary: library list, detail, bulk create, toggle, delete. /exclusion-reason-libraries. Keys `exclusionReasonLibrary.list/detail/all`.
- useExtractionTemplates: list, get, upsert, delete data-extraction templates. /data-extraction/process/:id/templates, /data-extraction/templates/:id, POST upsert, DELETE. Not key-based (direct calls).
- useHttp: generic axios wrapper with loading/error/data state. No keys.
- useImportBatches: import-batch lists (by identification process, by search execution), detail, mutations. All BE-missing. Keys `identification.importBatches`, `searchExecutions.importBatches`, `importBatches.detail`.
- useMasterSources: master source list, detail, create, update, toggle, usage, delete. /admin/master-sources (BE mounts it). Keys `masterSources.list/detail/all`.
- useNestedDataItems: local tree state for data-item (extraction field) definitions. No network.
- useNotifications: notification list, unread count, mark read. Keys `user.notifications.list/unreadCount`. Mark-read uses PUT, which mismatches BE PATCH.
- usePaperActions: upload full-text PDF (signed-upload flow) and apply metadata suggestion. POST /paper-fulltext/*, POST /papers/:id/apply-metadata. Invalidates `["study-selection", pid, "papers"]`, `["paper-pool", pid]`, `papers.all/detail`.
- usePaperDetails: GET /papers/:id. Key `papers.detail`.
- usePaperDiscovery: references, citations, citation graph. GET /papers/:id/references, /citations, /graph. Keys `papers.references/citations/graph`.
- usePaperImport: RIS, BibTeX, PDF import mutations. POST /papers/import/ris|bibtex|pdf. Invalidates `["paper-pool", pid]`, `paperPool.metadata`.
- usePaperPool: paginated paper pool, filter metadata, filter settings CRUD. /projects/:id/papers, /filter-metadata, /filter-settings. Keys `paperPool.papers/metadata/filterSettings`.
- usePhaseProcessMutations: identification and study-selection start/complete mutations. POST /identification-processes/:id/start|complete, /study-selection/:id/start|complete. Invalidates `reviewProcesses.detail` and `identification.all` / `["study-selection"]`.
- usePlanningData: project context (extraction process, review process) plus research questions. Inline `["planning-project-context", ...]`, key `projects.researchQuestions`.
- usePrismaReport: latest report, history, detail, generate. /projects/:rp/prisma/reports(...). Keys `prismaReports.latest/byReviewProcess/detail`.
- useProjectGovernance: review needs, commissioning documents, objectives, research questions, PICOC. /core-govern/... Keys `projects.needs`, `projects.documents`, and similar.
- useProjectMember: current user's membership and member list. GET /projects/:id/my-membership, /members. Keys `projects.myMembership`, `projects.members`.
- useProjectPapers: assign-papers mutation (POST /papers/assign). Invalidates `["project-papers"]`, `["title-abstract-assignment-papers", pid]`, `["full-text-assignment-papers", pid]`, `["conflict-detail", ...]`.
- useProjects: project list, my projects, project detail. GET /projects, /projects/my, /projects/:id. Keys `projects.list/myList/detail`.
- useQualityAssessment: UI state only (react-router params and memo). No network.
- useQualityAssessmentProcess: **empty file (0 bytes)**, dead code.
- useReadyPapers: identification ready-papers list. GET /identification-processes/:id/ready-papers, **MISS**. Key `identification.readyPapers`.
- useReviewProcessWorkspace: orchestrator for the synthesis workspace (strategies, workspace, source-data groups, themes). GET /synthesis-execution/:id/workspace, /extracted-data, /synthesis/process/:id/synthesis-strategies. Keys `synthesisExecution.workspace/sourceDataGroups/strategies`.
- useReviewProcesses: review process detail, by project, invalidation mutations. GET /review-processes/:id, /projects/:id/review-processes. Keys `reviewProcesses.detail/byProject/all`.
- useSearchExecutions: search-execution lists, detail, prisma stats. All identification-phase, **MISS**. Keys `identification.searchExecutions/statistics`, `searchExecutions.detail`.
- useSearchSources: project search sources, master sources available, bulk upsert. GET /projects/:id/sources, /master-sources/available, POST /search-sources/bulk. Keys `searchSources.byProject`, `masterSources.all`, `paperPool.metadata`.
- useSelectionCriteria: generate AI criteria, save AI criteria, list criteria. POST /selection-criteria/generate-ai/:id (**MISS**), POST /save-ai-result (**MISS**), GET /process/:id (OK). Key `["selection-criteria", id]`.
- useSignalR: inert connection-state poller and subscription hook. See section 4.
- useSnowballCandidates: snowballing candidate lists (by review process, by paper), papers-with-candidates overview. GET /candidate-papers, /projects/:id/papers/papers-with-candidates, /papers/:id/candidates. Keys `candidates.byReviewProcess`, inline `["candidates", ...]`.
- useStudySelection: study-selection phase status, assignment paper lists (infinite), conflicts, decisions, AI analysis, exclusion codes, etc. Keys `studySelection.*`, and inline `["title-abstract-assignment-papers", ...]`, `["full-text-assignment-papers", ...]`.
- useStudySelectionChecklistSubmission: reviewer checklist submission. GET /study-selection-checklist-submissions/reviewer-submission, **MISS**. Inline key `["reviewer-submission", params]`.
- useStudySelectionChecklistTemplate: checklist template get, create, activate, detail. /projects/:id/study-selection-checklist-template(s), POST activate. Key `studySelection.checklistTemplate`.
- useTemplateWizard: local wizard state for building extraction templates. No network (uses `dataItemsToTemplate`).
- useUniquePapers: unique papers for identification process. GET /identification-processes/:id/unique-papers, **MISS**. Key `identification.uniquePapers`.
- useUsers: users list, `me`, search, progress overview, profile update, status toggle. GET /users, /users/me, /users/search, /users/progress-overview (**MISS**). Keys inline `["users","me"]`, `["users","search",...]`, `["users","progress-overview",...]`.

#### 7. Types, enums, constants

##### Domain enums (FE uses numeric values; these are the contract the BE must return)
- `ProjectRole` (types/project.ts): Owner=1, Leader=1 (alias), Lecturer=2, Member=2 (alias), Reviewer=3. The BE uses **string** names: `OWNER | LECTURER | REVIEWER | MEMBER` in `requireProjectRole`, and global `ADMIN`. The FE bridges them in `ProtectedRouteForProject`.
- `ProjectStatus` (string union): `"Draft" | "Active" | "Completed"`.
- `InvitationStatus`: Pending=1, Accepted=2, Rejected=3, Cancelled=4, Expired=5.
- `ReviewProcessStatus`: Pending=0, InProgress=1, Completed=2, Cancelled=3. Also `ReviewProcessStatusText` union: Pending, NotStarted, InProgress, Completed, Cancelled.
- `PrismaPhase`: Identification=0, Screening=1, Eligibility=2, QualityAssessment=3, DataExtraction=4, Synthesis=5, Reporting=6.
- `ProcessPhase`: TitleAbstract=1, FullText=2. `PaperPhase` and `ScreeningPhase`: TitleAbstract=0, FullText=1. (The numbering is inconsistent across files.)
- `SelectionProcessStatus`: NotStarted=0, InProgress=1, Completed=2.
- `ScreeningDecisionType`: Include=0, Exclude=1.
- `PaperSelectionStatus`: Pending=0, Included=1, Excluded=2, Conflict=3, Resolved=4.
- `FullTextRetrievalStatus`: Unknown=0, Retrieved=1, NotRetrieved=2.
- `ExclusionReasonCode`: NotRelevantToTopic=0, NotRelevantPopulation=1, NotRelevantIntervention=2, NotEmpiricalStudy=3, NotResearchPaper=4, OutsideTimeRange=5, UnsupportedLanguage=6, DuplicateStudy=7, Other=99.
- `CandidateStatus` (snowballing): Detected=0, Matched=1, Rejected=2, Suggested=3.
- `DeduplicationReviewStatus`: Pending=0, Confirmed=1, Rejected=2. `DeduplicationMethod` also exists. `DuplicateResolutionDecision`: KEEP_BOTH=0, CANCEL=1.
- `NotificationType`: System=1, Project=2, Invitation=3, Review=4, Comment=5. `NotificationEntityType` also exists.
- `ChecklistType`: FULL=0, ABSTRACT=1. (Defined twice, in `types/checklist.ts` and `types/checklistApi.ts`.) `ChecklistTemplate` also in `types/checklist.ts`.
- `SearchExecutionType`: DatabaseSearch=0, ManualImport=1.
- `FieldTypeEnum` (data extraction): Text=0, Integer=1, Decimal=2, Boolean=3, SingleSelect=4, MultiSelect=5. `SectionTypeEnum` also exists. `constants/dataExtraction.ts` maps FE `DataItemType` strings to these via `FRONTEND_TO_BACKEND_TYPE` and `BACKEND_TO_FRONTEND_TYPE`.
- `IdentificationStatus` = 0 | 1 | 2.
- `ImportState` (paper import UI): string states idle, validating, uploading, processing, success, error. `ImportStateType` derived.
- `AuditLogStatus`: "Success" | "Failed". `AuditLogActionType` and `AuditLogSortField` are union strings. `AuditLogExportFormat`: csv | json | xlsx.
- `AutoFillStatus` (signalr types, currently dead): string states.
- `ConnectionState`: Disconnected, Connecting, Connected, Reconnecting.
- `SynthesisProcessStatus`: "NotStarted" | "InProgress" | "Completed". `FindingStatus`: "Draft" | "Finalized". `SynthesisType` union.
- `PRISMA_STAGE_LABELS`, `PrismaStage`, `PrismaFlowSection` in `types/prismaReport.ts`.
- `WizardStep` = 1 | 2 | 3 | 4.
- `PHASE_NAMES` (`constants/phaseConfig.ts`): identification "Identification", screening "Study Selection", extraction "Data Extraction", quality "Quality Assessment", synthesis "Synthesis", prisma "PRISMA Report". `PHASE_ICONS` too.

##### Key domain types (types/*.ts, about 45 files)
- `types/auth.ts`: `User{id,name,email?,username?,role?}`, `AuthState`, `LoginRequest{keyLogin,password}`, `LoginResponse`, `RegisterRequest{fullName,email,username,password,role:number}`, `RefreshResponse`.
- `types/user.ts`: `User{id,fullName,email,username,isActive,role}`, `UserProgress`, `UpdateUserProfileRequest`, `ChangePasswordRequest`.
- `types/project.ts`: `ApiResponse`, `PaginatedResponse`, `ProjectRole`, `InvitationStatus`, `getProjectRoleLabel`.
- `types/paper.ts`: paper DTOs, `ProcessPhase`, `CandidateStatus`, `ImportState`.
- `types/studySelection.ts`: study-selection process and decision types (listed above).
- `types/dataExtraction.ts`: `DataItemDefinitionExtended`, `ExtractionTemplateDto`, `FieldOption`, `TargetReviewer`.
- `types/coreAndGovernance.ts`: `SystematicReviewProject`, `ReviewNeed`, `ReviewObjective`, `ResearchQuestion`, `PICOCElement`, `QuestionType`, and Create*Input types. Field names are snake_case (`project_id`, `need_id`), which matches the abandoned Postgres DDL, not the BE camelCase.
- `types/signalr.ts`: event payload types (dead).
- Also present: `types/deduplication.ts`, `identification.ts`, `prismaReport.ts`, `reviewProcess.ts`, `reviewProcessWorkspace.ts`, `searchExecution.ts`, `searchSource.ts`, `selectionCriteria.ts`, `synthesis.ts`, `synthesisExecution.ts`, `qualityAssessment.ts`, `masterSource.ts`, `exclusionReasonLibrary.ts`, `notification.ts`, `paperStatistics.ts`, `studySelectionChecklistTemplate.ts`, `studySelectionChecklistSubmission.ts`, `templateWizard.ts`, `documentEditor.ts`, `auditLog.ts`, `checklistApi.ts`.

##### Constants (`src/constants/*`)
- `queryKeys.ts`: `QUERY_KEYS` tree, about 200 lines (static, projects, reviewProcesses, paperPool, synthesisExecution, identification, papers, searchExecutions, importBatches, researchQuestions, user.notifications, invitations, studySelection, and more). `DEPRECATED_QUERY_KEYS` maps old names to new.
- `phaseConfig.ts`: PHASE_ICONS, PHASE_NAMES, PhaseName.
- `checklistData.ts`: static PRISMA 2020 main and abstract checklist templates (`PRISMA_2020_MAIN_TEMPLATE`, `PRISMA_2020_ABSTRACT_TEMPLATE`, item arrays).
- `dataExtraction.ts`: `DATA_ITEM_TYPES`, `TYPES_WITH_OPTIONS` (SingleSelect, MultiSelect), type maps.
- `templateSections.ts`: `TEMPLATE_SECTIONS`.
- Component-local constants also exist: `components/paperPool/constants.ts`, `pages/*/constants.ts` (identification, prismaReport, fullTextScreening, aiSetupWizard, auditLogs).

#### 8. Utils and helpers (`src/utils/*`, `src/lib` does not exist)

- `auth.ts`: `isTokenExpired(expiresAt)`. Null counts as expired.
- `cn.ts`: clsx plus tailwind-merge.
- `dateFormat.ts`: `formatDate`, `formatRelativeTime`. `dateUtils.ts`: `toISODateTime`, `toDateInputValue`.
- `documentEditorHelpers.ts`: checklist draft JSON validation and normalization.
- `errorUtils.ts`: `getErrorMessage(error, default)`.
- `formatAuthors.ts`, `formatData.ts` (`formatNumber`, `formatVnCurrency`).
- `projectUtils.ts`: `resolveProjectLeader`.
- `suggestedTemplateGenerator.ts`: generates a suggested data-extraction template structure.
- `synthesisValidation.ts`: `validateSynthesisStrategy`.
- `toast.tsx`: `toastSuccess`, `toastError`, `toastWarning`, `toastInfo`, `toastLoading`, `toastPromise`, `dismissToast` (react-hot-toast).
- `uuid.ts`: `generateId`. `versionHelper.ts`: `incrementPatchVersion`, `getNextVersion`.
- No `src/lib/` directory exists.

#### 9. Root folders

- `db/coreAndGovernance.sql`: Postgres DDL, 12 tables: `systematic_review_project`, `review_need`, `commissioning_document`, `review_objective`, `question_type`, `research_question`, `picoc_element`, `population`, `intervention`, `comparison`, `outcome`, `context`. Snake_case, uuid PKs. This is a **Supabase/Postgres-era schema**, which the BE no longer uses (the BE is Firestore, see `firestore.rules`). The FE `types/coreAndGovernance.ts` still mirrors it. Treat as legacy reference only.
- `scripts/test_step1.mjs` and `scripts/test_step2.mjs`: Playwright (`chromium` via msedge channel, headless) smoke scripts against `http://localhost:5173`. Step 1 is admin login (happy and unhappy paths), step 2 is project creation. They write screenshots to a hardcoded absolute path under `C:/Users/LENOVO/.gemini/...`, so they only run on the original author's machine. Not part of the build.
- `dist/`: committed Vite build output (with a `pdf.worker.min` chunk). Stale, not a source of truth.
- `docs/`: many API and integration docs (`docs/api/*.md`, `docs/integration/*.md`). These describe the endpoints above and are useful to cross-check, but not authoritative.
- Root `project_leader_role_guide.md` and `reviewer_role_guide.md`: user-facing role docs.
- `.github/copilot-instructions.md` and `.github/workflows/ci.yml`: CI and coding-style notes, not read in detail.

#### 10. Endpoints that look inconsistent (leftover from the old .NET backend or drift)

Backend is Express/Firestore, so these are contract drift or .NET-style leftovers.

1. **PascalCase multipart and body fields**: `paperFulltextService` sends `File`, `ProjectId`, `PaperId`, `ExtractWithGrobid` (`studySelectionService.uploadPaperFullText`). BE explicitly accepts `req.body.ProjectId || projectId` and `upload.single('File')` for compatibility with the FE. Classic .NET naming, now preserved on the Node side.
2. **Response envelope is mixed**: FE checks `isSuccess` in 55 files. BE uses `success` in 36 files and `isSuccess` in 30 files. FE services mostly read `response.data.data`, so the shape is partly relied on.
3. **Numeric enums everywhere** (ProjectRole 1/2/3, ReviewProcessStatus, InvitationStatus, PrismaPhase, FieldTypeEnum, etc.): typical of C# enums, now served by Node. Keep the numeric contract in mind when reading BE responses.
4. **Role names**: FE ProjectRole is numeric, BE is string (`OWNER`, `LECTURER`, `REVIEWER`, `MEMBER`, global `ADMIN`). Also `LEADER` appears once in BE. FE uses `"Admin"`, `"Lecturer"`, `"Reviewer"`, `"OWNER"`, `"LECTURER"`, and `"Project Leader"` interchangeably. Works because comparisons are case-insensitive or mapped, but fragile.
5. **Method mismatch**: notifications mark-read is FE `PUT /notifications/:id/read`, BE `PATCH /notifications/:notificationId/read`.
6. **Removed or never-built routes still called by the FE** (grep-verified MISS):
   - Identification phase (whole phase data layer): `GET /identification-processes/:id`, `ready-papers`, `snapshot`, `statistics`, `unique-papers`, `search-executions/*`, `import-batches/*`. BE only has start/complete/reopen for identification.
   - Quality assessment writes (assignments, decisions, resolutions, AI decide, strategies upsert, bulk checklists and criteria, auto-resolve).
   - Study-selection extras: bulk-resolve, bulk-dataset, live-review-import, final-resolution-progress, included-full-text-papers, reviewer assignment-table, exclusion-reason toggle and delete under `/study-selection/exclusion-reasons/:id`.
   - Study-selection checklist submissions (context, submit, reviewer-submission).
   - Selection criteria AI generation and save (`generate-ai`, `save-ai-result`). BE only has an empty stub GET.
   - Users: `progress-overview`, `change-password`.
   - Review processes: `PUT`, `DELETE`, `cancel` on `/review-processes/:id`, and `POST /review-processes/:id/study-selection`.
   - AI: `/ai/projects/:id/analyze-picoc`. BE AI is nested under `/projects/:id/ai`, and only exposes `screen-assist`.
   - Dedup: `POST /projects/:id/papers/:paperId/mark-as-duplicate`.
   - Core governance: `PUT /core-govern/question-types/:id`.
7. **Path variants that exist only in BE for compatibility**: `/quality-assessment/*`, `/synthesis-execution/*`, `/identification-processes/:id/start|complete|reopen`, `/study-selection/*` (two routers, one for decisions). These live in `modules/compatibility/phase-compatibility.routes.ts` and `routes.ts`, documented as "Legacy ... contract used by the current frontend".
8. **Dead SignalR contract** (see section 4): FE still ships `@microsoft/signalr`, the `/hubs` proxy, and event types. BE has none. Auto-fill and AI progress are therefore polled or not updated live.
9. **Supabase and Postgres remnants**: `.env.example` Supabase vars, `db/coreAndGovernance.sql`, snake_case `types/coreAndGovernance.ts`. The BE is Firestore.
10. **Inconsistent phase numbering**: `ProcessPhase` (TitleAbstract=1, FullText=2) vs `PaperPhase`/`ScreeningPhase` (0/1). Easy to misuse.
11. **Inline query keys** scattered across hooks, plus `DEPRECATED_QUERY_KEYS`. Invalidation for some mutations targets keys that no hook reads.
12. **Duplicate `ChecklistType` declarations** in `types/checklist.ts` and `types/checklistApi.ts`.

#### 11. Other things worth knowing

- `services/signalrClient.ts` and `useSignalR` still run a 2s `setInterval` in `SignalRConnectionManager`. Harmless but wasteful.
- `useQualityAssessmentProcess.ts` is 0 bytes. Dead file.
- `components/ui/toast/ToastProvider.tsx` is imported from `main.tsx`.
- Cross-cutting: logout clears query cache, persist store, and localStorage key `persist:auth`. Token expiry triggers silent refresh before each request.
- Unverified (`?`) endpoints above were not individually checked. A grep-based suffix match marked them plausible, but a full per-route check was not done. Most likely OK: all `/projects/:id/papers/*` statistics, `/data-extraction-processes/*` conducting routes, `/synthesis-execution/*` theme evidence and findings, and `/invitations/*`.
- Response shape: `ApiResponse<T>{success, data, message?}` in FE types, but many services read `isSuccess` or raw `data`. There is no single unwrapping helper.
