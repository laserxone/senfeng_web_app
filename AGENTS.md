# UI conventions

## Dialogs

Follow the dialog pattern in `components/features/customer-relations/add-feedback.tsx`.

- Use `DialogContent` with `max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground`, and choose a compact `sm:max-w-*` width appropriate to the form.
- Use a `DialogHeader` with `border-b border-border bg-muted/40 px-4 py-3`.
- In the header, show a 36px rounded icon tile followed by a `text-sm font-semibold` title and `text-xs text-muted-foreground` description.
- Put long dialog content inside `ScrollArea` using `max-h-[calc(100dvh-132px)]`; use a compact `p-3.5` content wrapper.
- Use uppercase, 11px, semibold muted labels and compact `h-9 rounded-lg` controls and actions.
- Keep request buttons disabled while pending. Show `Spinner` inside the active action button with clear action text.
