const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dzfmtmlgbyxnqjdwutfp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DISCORD_RANK_WEBHOOK_URL = process.env.DISCORD_RANK_WEBHOOK_URL;
const RANKS_TOKEN = process.env.RANKS_TOKEN;
const CLANS_ENDPOINT = process.env.CLANS_ENDPOINT || 'http://enx-cirion-92.enx.host:10026/clans';
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
        const changed = previous?.signature && previous.signature !== signature;

        if (changed) {
            await sendDiscordEmbed(snapshot, previous.snapshot || {});
        }

        await saveSnapshot(snapshot, signature);

        return jsonResponse(200, {
            ok: true,
            changed: Boolean(changed),
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

async function sendDiscordEmbed(snapshot, previousSnapshot) {
    const playerField = formatPlayerField(snapshot.players, previousSnapshot.players || []);
    const clanField = formatClanField(snapshot.clans, previousSnapshot.clans || []);

    const response = await fetch(DISCORD_RANK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            username: 'FR32SURVIVAL',
            embeds: [
                {
                    title: 'Rankings atualizados',
                    description: 'O site detectou mudancas nos destaques da temporada.',
                    color: 16716947,
                    fields: [
                        {
                            name: 'Top Jogadores',
                            value: playerField || 'Sem jogadores sincronizados.',
                            inline: false
                        },
                        {
                            name: 'Top Clans',
                            value: clanField || 'Sem clans sincronizados.',
                            inline: false
                        }
                    ],
                    footer: { text: 'FR32SURVIVAL • Monitor automatico do site' },
                    timestamp: new Date().toISOString()
                }
            ]
        })
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Discord webhook failed: ${body || response.status}`);
    }
}

function formatPlayerField(players, previousPlayers) {
    const previousById = new Map((previousPlayers || []).map(player => [player.id, player.position]));
    return (players || []).slice(0, 5).map(player => {
        const movement = formatMovement(previousById.get(player.id), player.position);
        return `#${player.position} ${player.nick}${movement} • ${formatNumber(player.score)} pts • ${formatNumber(player.kills)} kills`;
    }).join('\n');
}

function formatClanField(clans, previousClans) {
    const previousByKey = new Map((previousClans || []).map(clan => [String(clan.tag || clan.name).toLowerCase(), clan.position]));
    return (clans || []).slice(0, 5).map(clan => {
        const key = String(clan.tag || clan.name).toLowerCase();
        const movement = formatMovement(previousByKey.get(key), clan.position);
        return `#${clan.position} [${clan.tag}] ${clan.name}${movement} • ${formatNumber(clan.score)} forca • Nv ${formatNumber(clan.level)}`;
    }).join('\n');
}

function formatMovement(previousPosition, currentPosition) {
    if (!previousPosition) return ' • novo';
    if (previousPosition === currentPosition) return '';
    if (previousPosition > currentPosition) return ` • subiu ${previousPosition - currentPosition}`;
    return ` • caiu ${currentPosition - previousPosition}`;
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
