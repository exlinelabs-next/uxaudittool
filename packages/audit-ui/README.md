# @webbeet/audit-ui

Drop a fully-working UX audit page into any Next.js project in one command.

## Usage

```bash
npx @webbeet/audit-ui init
```

The CLI will ask you four questions, then copy all source files directly into your project. You own the code - edit anything freely.

## What gets installed

```
your-project/
  src/
    globals.css                    ← brand tokens (CSS variables)
    audit/
      page.tsx                     ← the main audit page
      [id]/
        page.tsx                   ← shareable report page
    components/
      audit/
        AuditInput.tsx
        AuditReport.tsx
        CategoryCard.tsx
        CheckRow.tsx
        OverallScore.tsx
        ScorePill.tsx
        AuditCTA.tsx
    lib/
      hooks/
        useAudit.ts                ← SSE streaming hook
```

## Configuration

All prompts during `init`:

| Prompt | Default | Description |
|---|---|---|
| Audit API URL | `/api/audit` | URL of the audit endpoint |
| CTA link | `https://webbeet.studio/contact` | Where the "Book a call" button goes |
| CTA button label | `Book a free discovery call` | CTA button text |
| Accent colour | `#C8F135` | Primary brand colour |
| Output directory | `./src` | Where files are copied |

## Customisation

After install, edit `globals.css` to change any colour:

```css
:root {
  --wb-accent: #your-brand-colour;
  --wb-bg:     #ffffff;  /* light mode? change this */
}
```

All components use CSS variables, so one file controls the entire look.

## Requirements

- Next.js 14+ (App Router)
- React 18+
- Tailwind CSS v4

## The audit API

The UI connects to a `POST /api/audit` endpoint that returns Server-Sent Events. If you are using the hosted Webbeet API, set:

```bash
NEXT_PUBLIC_AUDIT_API_URL=https://ux-audit.exlinelabs.co.uk/api/audit
```
