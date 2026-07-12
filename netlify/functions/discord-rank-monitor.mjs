const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dzfmtmlgbyxnqjdwutfp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DISCORD_RANK_WEBHOOK_URL = process.env.DISCORD_RANK_WEBHOOK_URL;
const RANKS_TOKEN = process.env.RANKS_TOKEN;
const CLANS_ENDPOINT = process.env.CLANS_ENDPOINT || 'http://enx-cirion-92.enx.host:10026/clans';
const SITE_URL = process.env.SITE_URL || process.env.URL || 'https://www.fr32survival.com';
const DISCORD_RANK_MENTION_ROLE_ID = process.env.DISCORD_RANK_MENTION_ROLE_ID || '1525938148058730496';
const SNAPSHOT_KEY = 'discord_rank_monitor_v1';

const CLAN_SCORE_WEIGHTS = {
    points: 1,
    level: 120,
    members: 45,
    kills: 4,
    kdr: 25
};

export default async function handler() {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return jsonResponse(500, { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' });
    }

    if (!DISCORD_RANK_WEBHOOK_URL) {
        return jsonResponse(500, { error: 'DISCORD_RANK_WEBHOOK_URL is not configured.' });
    }

    try {
        const [players, clans] = await Promise.all([
            loadTopPlayers(),
            loadTopClans()
        ]);

        const snapshot = {
            players: players.slice(0, 5),
            clans: clans.slice(0, 5)
        };
        const signature = JSON.stringify(snapshot);
        const previous = await getSnapshot();
        const previousSnapshot = previous?.snapshot || {};
        const previousMessageId = previousSnapshot.discord_message_id || '';
        const changed = previous?.signature && previous.signature !== signature;
        let discordMessageId = previousMessageId;

        if (!previousMessageId || changed) {
            discordMessageId = await upsertDiscordEmbed(snapshot, previousSnapshot, previousMessageId);
        }

        await saveSnapshot({ ...snapshot, discord_message_id: discordMessageId }, signature);

        return jsonResponse(200, {
            ok: true,
            changed: Boolean(changed),
            updated_discord_message: Boolean(!previousMessageId || changed),
            discord_message_id: discordMessageId || null,
            players: snapshot.players.length,
            clans: snapshot.clans.length
        });
    } catch (error) {
        return jsonResponse(500, { error: error.message || 'Unable to monitor ranks.' });
    }
}

export const config = {
    schedule: '*/10 * * * *'
};

async function loadTopPlayers() {
    const rows = await fetchRows('player_stats', {
        select: 'player_id,playtime_hours,kills,homes,player_profiles(id,minecraft_username,is_verified)',
        limit: '1000'
    });

    return rows
        .filter(item => item.player_id && item.player_profiles?.minecraft_username)
        .map(item => {
            const score = calculatePlayerScore(item);
            const profile = item.player_profiles || {};
            return {
                id: item.player_id,
                nick: String(profile.minecraft_username || 'Jogador'),
                verified: Boolean(profile.is_verified),
                playtime_hours: safeNumber(item.playtime_hours),
                kills: safeInteger(item.kills),
                homes: safeInteger(item.homes),
                score
            };
        })
        .sort((a, b) => b.score - a.score || a.nick.localeCompare(b.nick, 'pt-BR'))
        .map((player, index) => ({ ...player, position: index + 1 }));
}

async function loadTopClans() {
    if (!RANKS_TOKEN) return [];

    const response = await fetch(`${CLANS_ENDPOINT}?token=${encodeURIComponent(RANKS_TOKEN)}`, {
        headers: { accept: 'application/json' },
        cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'Unable to fetch clans.');
    }

    return normalizeClans(data);
}

function normalizeClans(data) {
    const merged = new Map();
    const addClan = clan => {
        if (!clan || typeof clan !== 'object') return;
        const key = clanKey(clan);
        const current = merged.get(key) || {};
        merged.set(key, mergeClanData(current, clan));
    };

    if (Array.isArray(data?.clans)) data.clans.forEach(addClan);

    if (data?.rankings && typeof data.rankings === 'object') {
        Object.values(data.rankings).forEach(list => {
            if (Array.isArray(list)) list.forEach(addClan);
        });
    }

    return Array.from(merged.values())
        .map(clan => {
            const kills = safeInteger(clan.kills);
            const deaths = safeInteger(clan.deaths);
            const kdr = safeNumber(clan.kdr) || (deaths > 0 ? kills / deaths : kills);
            const normalized = {
                name: String(isTechnicalClanName(clan.name) ? clan.tag : (clan.name || clan.tag || 'Clan sem nome')).trim(),
                tag: String(clan.tag || clan.name || 'CLN').trim(),
                leader: String(clan.leader || 'Nao informado').trim(),
                level: safeInteger(clan.level),
                points: safeInteger(clan.points),
                members: safeInteger(clan.members),
                kills,
                deaths,
                kdr: Math.round(kdr * 100) / 100
            };
            return { ...normalized, score: getClanScore(normalized) };
        })
        .filter(clan => clan.name || clan.tag)
        .sort((a, b) =>
            b.score - a.score ||
            b.points - a.points ||
            b.level - a.level ||
            b.kills - a.kills ||
            b.members - a.members ||
            String(a.name).localeCompare(String(b.name), 'pt-BR')
        )
        .map((clan, index) => ({ ...clan, position: index + 1 }));
}

function mergeClanData(target, source) {
    const textFields = ['name', 'tag', 'leader'];
    const numericFields = ['points', 'level', 'members', 'kills', 'deaths', 'kdr'];

    textFields.forEach(field => {
        const value = String(source[field] || '').trim();
        const current = String(target[field] || '').trim();
        const shouldReplace = !current ||
            current.includes('Nao informado') ||
            (field === 'name' && isTechnicalClanName(current));
        if (value && shouldReplace) target[field] = value;
    });

    numericFields.forEach(field => {
        const value = Number(source[field]) || 0;
        const current = Number(target[field]) || 0;
        if (value > current) target[field] = value;
    });

    return target;
}

function clanKey(clan) {
    const tag = String(clan?.tag || '').trim().toLowerCase();
    const name = String(clan?.name || '').trim().toLowerCase();
    return tag || name || `clan-${Math.random().toString(36).slice(2)}`;
}

function isTechnicalClanName(value) {
    return ['point', 'points', 'kill', 'kills', 'kdr', 'member', 'members'].includes(String(value || '').trim().toLowerCase());
}

function getClanScore(clan) {
    return Math.round(
        safeInteger(clan.points) * CLAN_SCORE_WEIGHTS.points +
        safeInteger(clan.level) * CLAN_SCORE_WEIGHTS.level +
        safeInteger(clan.members) * CLAN_SCORE_WEIGHTS.members +
        safeInteger(clan.kills) * CLAN_SCORE_WEIGHTS.kills +
        safeNumber(clan.kdr) * CLAN_SCORE_WEIGHTS.kdr
    );
}

function calculatePlayerScore(stats = {}) {
    const playtime = safeNumber(stats.playtime_hours);
    const kills = safeInteger(stats.kills);
    const homes = safeInteger(stats.homes);
    return Math.round((playtime * 10) + (kills * 25) + (homes * 15));
}

async function getSnapshot() {
    return fetchSingle('site_monitor_snapshots', {
        select: '*',
        key: `eq.${SNAPSHOT_KEY}`,
        limit: '1'
    });
}

async function saveSnapshot(snapshot, signature) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_monitor_snapshots`, {
        method: 'POST',
        headers: {
            ...serviceHeaders(),
            prefer: 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
            key: SNAPSHOT_KEY,
            snapshot,
            signature,
            updated_at: new Date().toISOString()
        })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(body.message || 'Unable to save monitor snapshot.');
    }
}

async function upsertDiscordEmbed(snapshot, previousSnapshot, messageId) {
    const payload = buildDiscordPayload(snapshot, previousSnapshot);

    if (messageId) {
        const deleteResponse = await fetch(`${DISCORD_RANK_WEBHOOK_URL}/messages/${encodeURIComponent(messageId)}`, {
            method: 'DELETE'
        });

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
            const body = await deleteResponse.text();
            throw new Error(`Discord webhook delete failed: ${body || deleteResponse.status}`);
        }
    }

    const response = await fetch(`${DISCORD_RANK_WEBHOOK_URL}?wait=true`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Discord webhook failed: ${body || response.status}`);
    }

    const body = await response.json().catch(() => ({}));
    return body.id || '';
}

function buildDiscordPayload(snapshot, previousSnapshot) {
    const topPlayer = snapshot.players?.[0];
    const mentionRoleId = String(DISCORD_RANK_MENTION_ROLE_ID || '').trim();
    return {
        username: 'FR32Survival',
        avatar_url: `${SITE_URL}/icon/Fr32_Icon.png`,
        content: mentionRoleId ? `<@&${mentionRoleId}>` : '',
        allowed_mentions: mentionRoleId ? { roles: [mentionRoleId] } : { parse: [] },
        embeds: [
            {
                title: '🏆 RANKINGS ATUALIZADOS!',
                url: `${SITE_URL}/#rankings-clans`,
                description: [
                    'O site detectou mudanças nos principais destaques da temporada do **FR32Survival**!',
                    '',
                    '## ⚔️ TOP JOGADORES',
                    formatPlayerField(snapshot.players, previousSnapshot.players || []),
                    '',
                    '## 🛡️ TOP CLÃS',
                    formatClanField(snapshot.clans, previousSnapshot.clans || []),
                    '',
                    '## 🔥 A DISPUTA CONTINUA!',
                    '',
                    'Suba no ranking, fortaleça seu clã e lute para conquistar o topo da temporada!',
                    '',
                    `🌐 **[Ver rankings no site](${SITE_URL}/#rankings-clans)**`,
                    '',
                    '**FR32Survival • Monitor automático do site**',
                    `**Atualizado hoje às ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}**`
                ].join('\n'),
                color: 16716947,
                thumbnail: topPlayer ? { url: getPlayerHeadUrl(topPlayer.nick, 128) } : undefined,
                footer: { text: 'Clique no titulo para abrir o site' },
                timestamp: new Date().toISOString()
            }
        ]
    };
}

function formatPlayerField(players, previousPlayers) {
    const previousById = new Map((previousPlayers || []).map(player => [player.id, player.position]));
    return (players || []).slice(0, 5).map(player => {
        const movement = formatMovement(previousById.get(player.id), player.position);
        return [
            `**${getPositionMedal(player.position)} #${player.position} — [${escapeDiscordMarkdown(player.nick)}](${getPlayerProfileUrl(player.nick)})**`,
            movement,
            `**${formatNumber(player.score)} pontos** • **${formatNumber(player.kills)} abates**`
        ].filter(Boolean).join('\n');
    }).join('\n\n') || 'Sem jogadores sincronizados.';
}

function formatClanField(clans, previousClans) {
    const previousByKey = new Map((previousClans || []).map(clan => [String(clan.tag || clan.name).toLowerCase(), clan.position]));
    return (clans || []).slice(0, 5).map(clan => {
        const key = String(clan.tag || clan.name).toLowerCase();
        const movement = formatMovement(previousByKey.get(key), clan.position);
        return [
            `**${getPositionMedal(clan.position)} #${clan.position} — [${escapeDiscordMarkdown(clan.tag)}] ${escapeDiscordMarkdown(clan.name)}**`,
            movement,
            `**${formatNumber(clan.score)} de força** • **Nível ${formatNumber(clan.level)}**`
        ].filter(Boolean).join('\n');
    }).join('\n\n') || 'Sem clãs sincronizados.';
}

function formatMovement(previousPosition, currentPosition) {
    if (!previousPosition) return '🆕 **Novo no ranking!**';
    if (previousPosition === currentPosition) return '';
    if (previousPosition > currentPosition) {
        const amount = previousPosition - currentPosition;
        return `📈 **Subiu ${amount} ${amount === 1 ? 'posição' : 'posições'}**`;
    }
    const amount = currentPosition - previousPosition;
    return `📉 **Caiu ${amount} ${amount === 1 ? 'posição' : 'posições'}**`;
}

function getPositionMedal(position) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    if (position === 4) return '🏅';
    return '✨';
}

function getPlayerHeadUrl(nick, size = 128) {
    return `https://mc-heads.net/avatar/${encodeURIComponent(String(nick || 'Steve'))}/${size}`;
}

function getPlayerProfileUrl(nick) {
    return `${SITE_URL}/#perfil-jogador?player=${encodeURIComponent(String(nick || ''))}`;
}

function escapeDiscordMarkdown(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/_/g, '\\_')
        .replace(/\*/g, '\\*')
        .replace(/~/g, '\\~')
        .replace(/`/g, '\\`')
        .replace(/\|/g, '\\|');
}

async function fetchSingle(table, params) {
    const rows = await fetchRows(table, params);
    return rows[0] || null;
}

async function fetchRows(table, params) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${new URLSearchParams(params)}`, {
        headers: serviceHeaders()
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || `Unable to fetch ${table}.`);
    return Array.isArray(body) ? body : [];
}

function serviceHeaders(extra = {}) {
    return {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        accept: 'application/json',
        'content-type': 'application/json',
        ...extra
    };
}

function safeInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString('pt-BR');
}

function jsonResponse(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store'
        }
    });
}
