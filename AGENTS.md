<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

<!-- AGENT-MEMORY:BEGIN -->
- Keep the initial privacy text shared between the public page and admin editor so visible default content is editable without an empty field.
- Read persisted settings before merging an editor's submitted fields; stale local state must not erase unrelated settings such as the uploaded logo.
- Public pages use a shared suspense query backed by a publishable server client; this keeps published-only RLS effective during SSR.
- Administrative writes use the authenticated client with separate role-table policies; never grant privileges from signup metadata.
- Portfolio buckets remain private; sign only paths obtained from published public reads to respect the workspace storage restriction.
- Examples are literal migration seeds and bundled generated media resolved by stable example identifiers; never seed on page load.
- Store validated contact submissions through a server function with private attachments and a database-backed rate limit; never simulate delivery.
<!-- AGENT-MEMORY:END -->
