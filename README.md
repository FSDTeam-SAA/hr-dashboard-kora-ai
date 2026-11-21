# NOVYA HR dashboard

Next.js 16 / React 19 HR workspace, following `HR Dashboard.pdf` and the HR contract in `business-logic/NOVYA_06...pdf`, with the shared architecture and interaction rules in PDFs 00, 08 and 10.

## Run locally

```powershell
cd backendKoraAi
npm run dev
```

In another terminal:

```powershell
cd hr-dashboard
npm install
npm run dev
```

Open `http://localhost:3006`. A local ignored `.env.local` has been initialized with the local API URL and a generated session secret. `.env.example` documents the required variables. Set `NEXT_PUBLIC_BASE_URL` to the deployed API's `/api/v1` URL when using a remote backend. Configure `AUTH_URL` and a unique `AUTH_SECRET` per deployment. The backend accepts the local HR origin; set `HR_DASHBOARD_URL` for the deployed HR origin.

Authentication uses the existing backend's login, logout, activation and password-recovery APIs through NextAuth Credentials and Axios. An **active** `NvTeamMember` with role slug `hr` or `head_of_people` is required. Having `User.role = admin` alone does not grant HR access. No real employee or login account was provisioned by this implementation.

## Included routes

| PDF pages | Implemented route family |
| --- | --- |
| 1 | `/dashboard`: assigned priorities, current work, upcoming calendar and journey projections |
| 2-9 | `/assistant`, `/assistant/folders`, `/assistant/c/:id`: private chats, folders, rename/delete/move and governed handoff links |
| 10-24 | `/learn`: knowledge, courses, lesson progression, assessments, certificates, personal progress, scoped team compliance and published help |
| 25-27 | `/tasks`: personal work, creation, checklist, status, deferral, comments and history |
| 28-33 | `/inbox`, `/calendar`: internal communication, connected work email and personal calendar |
| 34-37 | `/workflows`: people-process drafts, exact-context preview and independent approval submission |
| 38-64 | `/workspace`, `/workspace/hub`, People, Departments, Recruiting, Onboarding, Requests, Absences, Performance and Roles & Access |
| 65-75 | `/workspace/office`: shared Office document, sheet, presentation and import/export surfaces |
| 76-99 | `/workspace/media`: assets, upload, collections, brand assets, usage and storage surfaces |
| 100-118 | `/team`: direct HR reports, weekly team tasks/day detail, delegation, operational reviews, coverage, coaching and delegated proposal reviews |
| 119-125 | `/settings`: profile, account/security, notifications, preferences, privacy/sessions and accessibility |
| Added authentication | `/login`, `/activate`, `/forgot-password`, `/verify-otp`, `/reset-password` |

The PDF describes multiple states of the same route, including overlays and detail states. The route families above do not assert independent pixel-level sign-off of every frame. HR-specific business rules take precedence over cloned Support/Admin/Developer labels in the design PDF.

## Authorization and data ownership

All HR requests use `/api/v1/hr-experience`; the shared Axios client attaches the NextAuth access token, sets a timeout and handles expired/revoked sessions. HR cookies have their own namespace.

People access requires an explicit current purpose and an unexpired field assignment. Existing `employment.hrOwner` relationships retain limited directory and employment access for assigned operational purposes. Compensation, performance, recruiting, absence, learning compliance and activity remain separately scoped. See [backend API contract](../backendKoraAi/HR_DASHBOARD_API.md).

Normal HR has personal tasks only. Head of People extends this with active direct HR reports; unrelated staff and private personal work are excluded. Leadership alone grants neither workforce access nor decision authority.

People records remain separate from login identities. Workforce creation, when separately delegated, creates an invited workforce record without creating credentials or permissions. Consequential people/workflow proposals create canonical `NvApproval` records. Approval status is shown separately from execution; these endpoints do not silently apply employment, compensation or IAM changes. Kora provides guidance/drafts and has no HR Brain, Investigation or Actions endpoints.

## Verification

- Production build and TypeScript checks pass.
- HR, Developer and Support integration regression suite: 53 tests passed.
- Real local NextAuth HTTP flow verified: login, HR session, authenticated backend request, logout and backend session revocation.
- All five authentication routes returned HTTP 200.
- Browser automation was unavailable: the browser host was unavailable and native app access timed out. Consequently, desktop/mobile visual comparison and a claim of 100% pixel parity remain unverified.
- Live SMTP, work email, Kora provider, signatures, IAM provisioning and Finance execution depend on their existing configured services and were not exercised against production.

## Disposable preview

For an isolated preview with invented data only:

```powershell
cd backendKoraAi
node scripts/previewHr.js
```

This starts a temporary MongoDB replica set and an API on port 5015, independently of the configured application database. Point `NEXT_PUBLIC_BASE_URL` to `http://localhost:5015/api/v1` and restart Next. Test accounts are `hr@preview.example.invalid` and `head@preview.example.invalid`, using password `Preview-Only-12345`. Stop the preview process when done; its database is disposable. These are fixture credentials, not provisioned application accounts.
