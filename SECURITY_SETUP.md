# Security Setup

## Netlify environment variables

Configure this variable in Netlify:

```text
RANKS_TOKEN=your_new_ranks_token
```

The old token that appeared in `_redirects` must be rotated. Treat it as exposed.

## Ranks proxy

The browser should keep using:

```text
/api/ranks
```

The `_redirects` file now maps that route to:

```text
/.netlify/functions/ranks
```

The Netlify Function in `netlify/functions/ranks.js` reads `RANKS_TOKEN` server-side and forwards the request to the ranks backend.

## Supabase hardening

Run `security_hardening.sql` in the Supabase SQL Editor after deploying the frontend changes. It tightens:

- `user_permissions` read access.
- Minecraft username validation.
- Comment length limits.
- Season photo path validation.
- `security definer` function search paths.
