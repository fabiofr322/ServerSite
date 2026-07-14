# Security Setup

## Netlify environment variables

Configure this variable in Netlify:

```text
RANKS_TOKEN=your_new_ranks_token
PLAYER_BRIDGE_TOKEN=use_a_different_strong_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RANKS_ENDPOINT=https://your-secure-ranks-host/ranks
CLANS_ENDPOINT=https://your-secure-ranks-host/clans
```

Use HTTPS for `RANKS_ENDPOINT` and `CLANS_ENDPOINT`. The current HTTP fallback is
kept only for compatibility and sends traffic without transport encryption.
Never expose `SUPABASE_SERVICE_ROLE_KEY` or `PLAYER_BRIDGE_TOKEN` in frontend files.

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

## Player verification protection

Verification code generation now has a 60-second cooldown per user and player.
Each generated code is invalidated after five failed confirmation attempts.

## Supabase hardening

Run `security_hardening.sql` in the Supabase SQL Editor after deploying the frontend changes. It tightens:

- `user_permissions` read access.
- Minecraft username validation.
- Comment length limits.
- Season photo path validation.
- `security definer` function search paths.
