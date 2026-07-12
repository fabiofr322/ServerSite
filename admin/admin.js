/**
 * =====================================================================
 * FR32SURVIVAL - LOGIC SYSTEM FOR ADMIN PANEL (JS)
 * Desenvolvedor Web Full-Stack SÃªnior & Instrutor DidÃ¡tico
 * =====================================================================
 * ExplicaÃ§Ã£o da lÃ³gica e do fluxo para o estudante:
 * 
 * 1. InicializaÃ§Ã£o: Conectamos com o Supabase usando as chaves pÃºblicas da API.
 * 2. Route Guard (SeguranÃ§a no Acesso): Assim que a pÃ¡gina carrega, verificamos a sessÃ£o.
 *    Se nÃ£o estiver logado ou se nÃ£o for um admin cadastrado na tabela `user_permissions`,
 *    bloqueamos o conteÃºdo (evitando flashes de tela) e redirecionamos para a Home.
 * 3. Gerenciamento de Abas: Controlamos a exibiÃ§Ã£o das seÃ§Ãµes administrativas.
 * 4. Painel de PermissÃµes:
 *    - O Super Admin pode listar todos os usuÃ¡rios usando a RPC (Stored Procedure)
 *      `get_all_users_for_admin` criada no banco.
 *    - PromoÃ§Ã£o: Procuramos o UUID do usuÃ¡rio usando o e-mail pela RPC `get_user_id_by_email`
 *      e inserimos o cargo correspondente.
 *    - RevogaÃ§Ã£o: Deletamos o registro do usuÃ¡rio na tabela de permissÃµes.
 *    - ProteÃ§Ã£o: A interface e o RLS impedem qualquer modificaÃ§Ã£o na conta do Super Admin.
 */

// ConfiguraÃ§Ãµes do Supabase (Mesma URL e Chave do site principal)
const SUPABASE_URL = 'https://dzfmtmlgbyxnqjdwutfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Zm10bWxnYnl4bnFqZHd1dGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODE1MjcsImV4cCI6MjA5NzU1NzUyN30.8W_0L9OzmLSDH1ZMRtFFlc3Pyf54ENgVNV535TW1T7U';

let supabaseClient = null;
let currentUser = null;
let currentUserPermission = null;
let allUsersList = []; // Cache local para busca instantÃ¢nea no frontend
let allAnnouncementsList = [];
let allProductsList = [];
let allStaffFormsList = [];
let allStaffResponsesList = [];
let selectedStaffFormId = null;
let selectedStaffResponseId = null;
let currentStaffResponseFilter = 'all';
let currentAnnouncementType = 'news';

// InicializaÃ§Ã£o do Supabase Client
function initAdminSupabase() {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        checkSessionAndRole();
    } else {
        console.error("[Admin] Erro: SDK do Supabase nÃ£o carregado.");
        showToast("Erro ao carregar o SDK do banco de dados.", "error");
    }
}

// ---------------------------------------------------------------------
// 1. SISTEMA DE SEGURANÃ‡A E PROTEÃ‡ÃƒO DE ROTA (ROUTE GUARD)
// ---------------------------------------------------------------------
async function checkSessionAndRole() {
    try {
        // Obter sessÃ£o atual do usuÃ¡rio
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
            // Se nÃ£o houver sessÃ£o ativa, expulsa para a Home
            handleAccessDenied("SessÃ£o expirada ou nÃ£o autenticado. FaÃ§a login na Home.");
            return;
        }

        currentUser = session.user;

        // Buscar permissÃµes do usuÃ¡rio logado diretamente na tabela
        const { data: permissionData, error: permError } = await supabaseClient
            .from('user_permissions')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

        // Se houver erro de consulta ou o usuÃ¡rio nÃ£o constar na tabela de permissÃµes, ele nÃ£o Ã© admin
        if (permError || !permissionData) {
            console.warn("[Auth Guard] Falha de validaÃ§Ã£o.");
            handleAccessDenied("Acesso Negado: VocÃª nÃ£o tem permissÃ£o para acessar o Painel Admin.");
            return;
        }

        currentUserPermission = permissionData;

        // Se for admin ou super_admin, libera o acesso Ã  pÃ¡gina
        setupAdminInterface();

    } catch (err) {
        console.error("[Auth Guard] Erro crÃ­tico:", err);
        handleAccessDenied("Ocorreu um erro interno de validaÃ§Ã£o.");
    }
}

function handleAccessDenied(message) {
    showToast(message, "error");
    // Aguarda o toast aparecer brevemente antes do redirecionamento
    setTimeout(() => {
        window.location.href = "../index.html";
    }, 2500);
}

// ---------------------------------------------------------------------
// 2. CONFIGURAÃ‡ÃƒO DA INTERFACE ADMIN
// ---------------------------------------------------------------------
function setupAdminInterface() {
    // Oculta a tela de carregamento e exibe o painel administrativo
    document.getElementById('authLoadingScreen').style.display = 'none';
    document.getElementById('adminPanelContent').style.display = 'block';

    // Atualiza os dados do usuÃ¡rio no cabeÃ§alho
    document.getElementById('currentUserEmail').textContent = currentUser.email;
    
    const roleBadge = document.getElementById('currentUserRole');
    if (currentUserPermission.role === 'super_admin') {
        roleBadge.textContent = 'Super Admin';
        roleBadge.classList.add('super-admin');
        
        // Exibe o botÃ£o da aba de permissÃµes (exclusivo para Super Admin)
        const tabBtn = document.getElementById('tabBtnPermissions');
        tabBtn.style.display = 'flex';
        
        // Inicializa a listagem de usuÃ¡rios e as interaÃ§Ãµes de promoÃ§Ã£o
        loadUsersList();
        setupPermissionsEvents();
    } else {
        roleBadge.textContent = 'Administrador';
        
        // Se for Admin comum, a aba padrÃ£o deve ser a de Veteranos
        switchTab('veterans');
    }

    // Inicializar eventos de abas, logout, veteranos, temporadas, comentÃ¡rios e publicaÃ§Ãµes
    setupGlobalEvents();
    setupVeteransEvents();
    setupSeasonsEvents();
    setupCommentsEvents();
    setupAnnouncementsEvents();
    setupProductsEvents();
    setupStaffFormsEvents();
}

function setupGlobalEvents() {
    // Logout do painel
    document.getElementById('btnAdminLogout').addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            showToast("Erro ao fazer logout: " + error.message, "error");
        } else {
            showToast("Saindo do painel...", "success");
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1000);
        }
    });

    // NavegaÃ§Ã£o entre abas
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Eventos do Lightbox para visualizaÃ§Ã£o de imagens
    const lightbox = document.getElementById('imageLightbox');
    const lightboxClose = document.getElementById('lightboxClose');
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            const openedAt = parseInt(lightbox.dataset.openedAt || '0', 10);
            if (Date.now() - openedAt < 200) {
                return; // Ignora cliques efetuados no mesmo instante da abertura
            }
            if (e.target === lightbox || e.target.id === 'imageLightbox') {
                closeLightbox();
            }
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });

    // Adiciona evento de clique no preview de moderacao tambÃ©m
    const modPreview = document.getElementById('moderationSelectedPhotoPreview');
    if (modPreview) {
        modPreview.addEventListener('click', (e) => {
            e.stopPropagation();
            const desc = document.getElementById('moderationSelectedPhotoDesc')?.textContent || '';
            openLightbox(modPreview.src, desc);
        });
        modPreview.style.cursor = 'pointer';
    }
}

function switchTab(tabId) {
    // Remove classe ativa de todos os botÃµes e painÃ©is
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    // Adiciona classe ativa no botÃ£o clicado e no painel correspondente
    const activeBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);
    const paneId = (tabId === 'news' || tabId === 'events')
        ? 'tabAnnouncements'
        : `tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
    const activePane = document.getElementById(paneId);
    
    if (activeBtn && activePane) {
        activeBtn.classList.add('active');
        activePane.classList.add('active');
        
        // Carrega dados dinÃ¢micos da aba ativa
        if (tabId === 'permissions') {
            loadUsersList();
        } else if (tabId === 'veterans') {
            loadVeteransList();
        } else if (tabId === 'seasons') {
            loadSeasons();
        } else if (tabId === 'comments') {
            loadCommentsTab();
        } else if (tabId === 'news' || tabId === 'events') {
            setAnnouncementsMode(tabId === 'events' ? 'event' : 'news');
            loadAnnouncementsList();
        } else if (tabId === 'products') {
            loadProductsList();
        } else if (tabId === 'forms') {
            loadStaffFormsList();
        }
    }
}

// ---------------------------------------------------------------------
// 3. ABA PERMISSÃ•ES: CARREGAR USUÃRIOS E GERENCIAR CARGOS
// ---------------------------------------------------------------------

// Eventos especÃ­ficos da aba de permissÃµes
function setupPermissionsEvents() {
    const form = document.getElementById('formPromoteAdmin');
    form.addEventListener('submit', handlePromoteFormSubmit);

    const searchInput = document.getElementById('inputSearchUsers');
    searchInput.addEventListener('input', (e) => {
        filterUsersTable(e.target.value);
    });
}

// Carregar lista geral de usuÃ¡rios
async function loadUsersList() {
    const tableBody = document.getElementById('tableUsersBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="table-loading-row">
                <div class="spinner"></div> Carregando dados do banco de dados...
            </td>
        </tr>
    `;

    try {
        // Chamamos a Stored Procedure get_all_users_for_admin no Supabase
        const { data, error } = await supabaseClient.rpc('get_all_users_for_admin');

        if (error) {
            throw error;
        }

        allUsersList = data || [];
        renderUsersTable(allUsersList);
        updateRoleStats(allUsersList);

    } catch (err) {
        console.error("[Load Users] Erro:", err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty-row" style="color: var(--error)">
                    <i class="fa-solid fa-triangle-exclamation"></i> Falha ao carregar usuÃ¡rios: ${err.message}
                </td>
            </tr>
        `;
        showToast("Erro ao carregar lista de usuÃ¡rios.", "error");
    }
}

// Renderizar tabela de usuÃ¡rios
function renderUsersTable(users) {
    const tableBody = document.getElementById('tableUsersBody');
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty-row">
                    Nenhum usuÃ¡rio encontrado.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        
        // Definir Minecraft Username (Nick)
        const username = safeMinecraftUsername(user.minecraft_username);
        // Avatar do Minecraft head do jogador usando mc-heads.net
        const avatarUrl = user.minecraft_username 
            ? `https://mc-heads.net/avatar/${encodeURIComponent(username)}/24`
            : '../icon/Fr32_Icon.png';

        // Definir Badge do Cargo
        let badgeHtml = '';
        let actionBtnHtml = '';

        if (user.role === 'super_admin') {
            badgeHtml = `<span class="role-badge badge-super-admin"><i class="fa-solid fa-crown"></i> Super Admin</span>`;
            actionBtnHtml = `<span class="uuid-text" style="font-weight:700; color:var(--primary);">Dono do Site</span>`;
        } else if (user.role === 'admin') {
            badgeHtml = `<span class="role-badge badge-admin"><i class="fa-solid fa-user-shield"></i> Administrador</span>`;
            actionBtnHtml = `
                <button class="btn-action btn-demote" onclick="changeUserRole('${escapeJSString(user.id)}', 'demote', '${escapeJSString(user.email)}')">
                    <i class="fa-solid fa-user-minus"></i> Rebaixar
                </button>
            `;
        } else {
            badgeHtml = `<span class="role-badge badge-player"><i class="fa-solid fa-gamepad"></i> Jogador</span>`;
            actionBtnHtml = `
                <button class="btn-action btn-promote" onclick="changeUserRole('${escapeJSString(user.id)}', 'promote', '${escapeJSString(user.email)}')">
                    <i class="fa-solid fa-user-plus"></i> Tornar Admin
                </button>
            `;
        }

        row.innerHTML = `
            <td><strong>${escapeHTML(user.email)}</strong></td>
            <td>
                <div class="avatar-info">
                    <img src="${avatarUrl}" alt="${escapeHTML(username)}" class="table-mc-avatar">
                    <span>${escapeHTML(username)}</span>
                </div>
            </td>
            <td><span class="uuid-text">${escapeHTML(user.id)}</span></td>
            <td>${badgeHtml}</td>
            <td class="text-right">${actionBtnHtml}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Filtrar usuÃ¡rios com busca instantÃ¢nea local
function filterUsersTable(query) {
    const filtered = allUsersList.filter(user => {
        const emailMatch = user.email.toLowerCase().includes(query.toLowerCase());
        const usernameMatch = user.minecraft_username && user.minecraft_username.toLowerCase().includes(query.toLowerCase());
        const uuidMatch = user.id.toLowerCase().includes(query.toLowerCase());
        return emailMatch || usernameMatch || uuidMatch;
    });
    renderUsersTable(filtered);
}

// Atualizar estatÃ­sticas de cargos no painel
function updateRoleStats(users) {
    const superAdmins = users.filter(u => u.role === 'super_admin').length;
    const admins = users.filter(u => u.role === 'admin').length;

    document.getElementById('statCountSuperAdmins').textContent = superAdmins;
    document.getElementById('statCountAdmins').textContent = admins;
}

// ---------------------------------------------------------------------
// 4. LÃ“GICA DE PROMOÃ‡ÃƒO E REBAIXAMENTO (API DIRECT CALLS)
// ---------------------------------------------------------------------

// Enviar FormulÃ¡rio de PromoÃ§Ã£o por Email
async function handlePromoteFormSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('inputPromoteEmail');
    const email = emailInput.value.trim().toLowerCase();
    const btnSubmit = document.getElementById('btnPromoteSubmit');

    if (!email) return;

    // Desativa formulÃ¡rio durante o loading
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="table-loading-row"><div class="spinner" style="margin: 0"></div> Concedendo...</span>`;

    try {
        // Passo A: Encontra o UUID do usuÃ¡rio correspondente ao e-mail informado
        const { data: userId, error: lookupError } = await supabaseClient.rpc('get_user_id_by_email', {
            search_email: email
        });

        if (lookupError || !userId) {
            throw new Error("UsuÃ¡rio nÃ£o cadastrado ou e-mail invÃ¡lido. O jogador precisa estar registrado no site.");
        }

        // Passo B: Insere o registro na tabela de permissÃµes como 'admin'
        const { error: insertError } = await supabaseClient
            .from('user_permissions')
            .insert({
                user_id: userId,
                role: 'admin',
                email: email
            });

        if (insertError) {
            // Tratamento especÃ­fico de violaÃ§Ã£o de chave primÃ¡ria (jÃ¡ Ã© admin)
            if (insertError.code === '23505') {
                throw new Error("Este usuÃ¡rio jÃ¡ possui permissÃ£o de Administrador ou superior.");
            }
            throw insertError;
        }

        showToast(`Sucesso! ${email} foi promovido a Administrador.`, "success");
        emailInput.value = '';
        loadUsersList(); // Recarrega a tabela de usuÃ¡rios

    } catch (err) {
        console.error("[Promote Admin] Erro:", err);
        showToast(err.message || "Erro desconhecido ao promover usuÃ¡rio.", "error");
    } finally {
        // Restaura o botÃ£o
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Conceder Cargo`;
    }
}

// Promover ou Rebaixar atravÃ©s dos botÃµes de aÃ§Ã£o da tabela
async function changeUserRole(userId, action, email) {
    const confirmMessage = action === 'promote'
        ? `Tem certeza que deseja conceder cargo de Administrador para ${email}?`
        : `AtenÃ§Ã£o: Tem certeza que deseja remover o cargo de Administrador de ${email}? Ele perderÃ¡ acesso ao painel instantaneamente.`;

    if (!confirm(confirmMessage)) return;

    try {
        if (action === 'promote') {
            // Insere na tabela
            const { error } = await supabaseClient
                .from('user_permissions')
                .insert({
                    user_id: userId,
                    role: 'admin',
                    email: email
                });

            if (error) throw error;
            showToast(`${email} agora Ã© um Administrador.`, "success");
        } else {
            // Remove da tabela
            const { error } = await supabaseClient
                .from('user_permissions')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;
            showToast(`Cargo removido com sucesso de ${email}.`, "success");
        }

        loadUsersList(); // Recarrega a lista

    } catch (err) {
        console.error("[Change Role] Erro:", err);
        showToast("Erro ao alterar cargo: " + (err.message || err.details), "error");
    }
}

// ---------------------------------------------------------------------
// 4.1. ABA VETERANOS: CARREGAR, INSERIR, EDITAR E EXCLUIR VETERANOS
// ---------------------------------------------------------------------
let allVeteransList = [];

// Inicializar eventos especÃ­ficos da aba de veteranos
function setupVeteransEvents() {
    const form = document.getElementById('formVeteran');
    if (form) form.addEventListener('submit', handleVeteranFormSubmit);

    const cancelBtn = document.getElementById('btnVeteranCancelEdit');
    if (cancelBtn) cancelBtn.addEventListener('click', cancelVeteranEdit);

    const searchInput = document.getElementById('inputSearchVeterans');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterVeteransTable(e.target.value);
        });
    }
}

// Carregar lista geral de veteranos do banco de dados
async function loadVeteransList() {
    const tableBody = document.getElementById('tableVeteransBody');
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="table-loading-row">
                <div class="spinner"></div> Carregando veteranos...
            </td>
        </tr>
    `;

    try {
        const { data, error } = await supabaseClient
            .from('veterans')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allVeteransList = data || [];
        renderVeteransTable(allVeteransList);

    } catch (err) {
        console.error("[Load Veterans] Erro:", err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty-row" style="color: var(--error)">
                    <i class="fa-solid fa-triangle-exclamation"></i> Falha ao carregar veteranos: ${err.message}
                </td>
            </tr>
        `;
        showToast("Erro ao carregar lista de veteranos.", "error");
    }
}

// Renderizar tabela de veteranos
function renderVeteransTable(veterans) {
    const tableBody = document.getElementById('tableVeteransBody');
    if (!tableBody) return;

    if (veterans.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty-row">
                    Nenhum jogador veterano cadastrado no mural.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';

    veterans.forEach(vet => {
        const row = document.createElement('tr');
        const username = safeMinecraftUsername(vet.minecraft_username);
        const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/24`;

        row.innerHTML = `
            <td>
                <div class="avatar-info">
                    <img src="${avatarUrl}" alt="${escapeHTML(username)}" class="table-mc-avatar" onerror="this.src='../icon/Fr32_Icon.png'">
                    <a href="https://mc-heads.net/body/${encodeURIComponent(username)}" target="_blank" rel="noopener noreferrer" title="Ver Skin Completa" style="color: var(--primary); font-size: 0.8rem;">
                        <i class="fa-solid fa-up-right-from-square"></i>
                    </a>
                </div>
            </td>
            <td><strong>${escapeHTML(username)}</strong></td>
            <td><span class="role-badge badge-admin"><i class="fa-solid fa-tag"></i> ${escapeHTML(vet.title)}</span></td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(vet.description)}">
                ${escapeHTML(vet.description)}
            </td>
            <td class="text-right">
                <button class="btn-action btn-promote" onclick="editVeteran(${Number(vet.id)})" style="margin-right: 6px; border-color: rgba(255, 170, 0, 0.4); color: #ffa500; background: rgba(255, 170, 0, 0.05);">
                    <i class="fa-solid fa-user-pen"></i> Editar
                </button>
                <button class="btn-action btn-demote" onclick="deleteVeteran(${Number(vet.id)}, '${escapeJSString(username)}')">
                    <i class="fa-solid fa-trash-can"></i> Excluir
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Filtrar veteranos na busca instantÃ¢nea local
function filterVeteransTable(query) {
    const filtered = allVeteransList.filter(vet => {
        const nickMatch = vet.minecraft_username.toLowerCase().includes(query.toLowerCase());
        const titleMatch = vet.title.toLowerCase().includes(query.toLowerCase());
        const descMatch = vet.description.toLowerCase().includes(query.toLowerCase());
        return nickMatch || titleMatch || descMatch;
    });
    renderVeteransTable(filtered);
}

// Enviar FormulÃ¡rio (Inserir ou Atualizar)
async function handleVeteranFormSubmit(e) {
    e.preventDefault();

    const idInput = document.getElementById('inputVeteranId');
    const nickInput = document.getElementById('inputVeteranNick');
    const titleInput = document.getElementById('inputVeteranTitle');
    const descInput = document.getElementById('inputVeteranDesc');
    const btnSubmit = document.getElementById('btnVeteranSubmit');

    const id = idInput.value;
    const nick = nickInput.value.trim();
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (!nick || !title || !description) {
        showToast("Preencha todos os campos do formulÃ¡rio.", "error");
        return;
    }

    if (!isValidMinecraftUsername(nick)) {
        showToast("Nick invÃ¡lido. Use de 3 a 16 caracteres: letras, nÃºmeros e underline (_).", "error");
        return;
    }

    btnSubmit.disabled = true;
    const originalBtnHtml = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<span class="table-loading-row"><div class="spinner" style="margin:0; width:14px; height:14px;"></div> Salvando...</span>`;

    try {
        if (id) {
            // Modo EdiÃ§Ã£o
            const { error } = await supabaseClient
                .from('veterans')
                .update({
                    minecraft_username: nick,
                    title: title,
                    description: description
                })
                .eq('id', id);

            if (error) throw error;
            showToast(`Veterano ${nick} atualizado com sucesso!`, "success");
        } else {
            // Modo InserÃ§Ã£o
            const { error } = await supabaseClient
                .from('veterans')
                .insert({
                    minecraft_username: nick,
                    title: title,
                    description: description
                });

            if (error) {
                if (error.code === '23505') {
                    throw new Error("Este jogador jÃ¡ estÃ¡ cadastrado como veterano.");
                }
                throw error;
            }
            showToast(`Veterano ${nick} adicionado ao mural!`, "success");
        }

        cancelVeteranEdit();
        loadVeteransList();

    } catch (err) {
        console.error("[Submit Veteran] Erro:", err);
        showToast(err.message || "Erro ao salvar veterano.", "error");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnHtml;
    }
}

// Entrar em Modo EdiÃ§Ã£o
function editVeteran(id) {
    const vet = allVeteransList.find(v => v.id === id);
    if (!vet) return;

    document.getElementById('inputVeteranId').value = vet.id;
    document.getElementById('inputVeteranNick').value = vet.minecraft_username;
    document.getElementById('inputVeteranTitle').value = vet.title;
    document.getElementById('inputVeteranDesc').value = vet.description;

    document.getElementById('veteranFormTitle').innerHTML = `<i class="fa-solid fa-user-pen"></i> Editar Veterano`;
    document.getElementById('veteranFormDesc').textContent = "Atualize os dados do jogador selecionado.";
    document.getElementById('btnVeteranSubmit').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar AlteraÃ§Ãµes`;
    document.getElementById('btnVeteranCancelEdit').classList.remove('hidden');

    document.getElementById('formVeteran').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Cancelar EdiÃ§Ã£o
function cancelVeteranEdit() {
    document.getElementById('formVeteran').reset();
    document.getElementById('inputVeteranId').value = '';

    document.getElementById('veteranFormTitle').innerHTML = `<i class="fa-solid fa-user-plus"></i> Adicionar Veterano`;
    document.getElementById('veteranFormDesc').textContent = "Insira as informaÃ§Ãµes do jogador para destacÃ¡-lo no mural.";
    document.getElementById('btnVeteranSubmit').innerHTML = `<i class="fa-solid fa-plus"></i> Adicionar ao Mural`;
    document.getElementById('btnVeteranCancelEdit').classList.add('hidden');
}

// Deletar Veterano
async function deleteVeteran(id, nick) {
    if (!confirm(`Tem certeza que deseja remover ${nick} do mural de veteranos?`)) return;

    try {
        const { error } = await supabaseClient
            .from('veterans')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast(`Jogador ${nick} removido com sucesso.`, "success");

        const currentEditId = document.getElementById('inputVeteranId').value;
        if (currentEditId == id) {
            cancelVeteranEdit();
        }

        loadVeteransList();

    } catch (err) {
        console.error("[Delete Veteran] Erro:", err);
        showToast("Erro ao remover veterano: " + err.message, "error");
    }
}

// Expor funÃ§Ãµes globais para escopo da janela (evita problemas em onclick inline no HTML)
// Expor funÃ§Ãµes globais para escopo da janela (evita problemas em onclick inline no HTML)
window.editVeteran = editVeteran;
window.deleteVeteran = deleteVeteran;
window.changeUserRole = changeUserRole;

// ---------------------------------------------------------------------
// 4.2. ABA TEMPORADAS E GALERIA: CRIAR TEMPORADAS E UPLOAD DE IMAGENS
// ---------------------------------------------------------------------
let allSeasonsList = [];
let currentSeasonPhotosList = [];
let selectedUploadFiles = []; // Fila local de arquivos para upload

// Inicializar eventos de temporadas e galeria
function setupSeasonsEvents() {
    const formSeason = document.getElementById('formCreateSeason');
    if (formSeason) formSeason.addEventListener('submit', handleCreateSeasonSubmit);

    const formUpload = document.getElementById('formUploadPhoto');
    if (formUpload) formUpload.addEventListener('submit', handleUploadPhotoSubmit);

    const selectManage = document.getElementById('selectManageSeason');
    if (selectManage) {
        selectManage.addEventListener('change', (e) => {
            loadSeasonPhotos(e.target.value);
        });
    }

    const selectViewMode = document.getElementById('selectGalleryViewMode');
    if (selectViewMode) {
        selectViewMode.addEventListener('change', () => {
            renderSeasonPhotos(currentSeasonPhotosList);
        });
    }

    const inputSearch = document.getElementById('inputSearchGallery');
    if (inputSearch) {
        inputSearch.addEventListener('input', () => {
            renderSeasonPhotos(currentSeasonPhotosList);
        });
    }

    // ConfiguraÃ§Ã£o do Drag & Drop e fila de arquivos
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('inputPhotoFile');

    if (dropzone && fileInput) {
        // Clicar na dropzone abre a seleÃ§Ã£o de arquivos
        dropzone.addEventListener('click', () => fileInput.click());

        // Eventos de arrastar
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleSelectedFiles(e.dataTransfer.files);
            }
        });

        // Evento de alteraÃ§Ã£o no input padrÃ£o
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleSelectedFiles(e.target.files);
                fileInput.value = '';
            }
        });
    }
}

// ManipulaÃ§Ã£o e visualizaÃ§Ã£o da fila de uploads
function handleSelectedFiles(files) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!validTypes.includes(file.type)) {
            showToast(`Arquivo "${file.name}" nÃ£o Ã© uma imagem permitida (PNG, JPG, WEBP, GIF).`, "error");
            continue;
        }

        if (file.size > maxSizeBytes) {
            showToast(`Arquivo "${file.name}" excede o limite de 5MB por foto.`, "error");
            continue;
        }

        // Evitar duplicados
        const isDuplicate = selectedUploadFiles.some(f => f.name === file.name && f.size === file.size);
        if (!isDuplicate) {
            selectedUploadFiles.push(file);
        }
    }

    renderUploadPreviews();
}

function renderUploadPreviews() {
    const previewGrid = document.getElementById('uploadPreviewsGrid');
    if (!previewGrid) return;

    previewGrid.innerHTML = '';

    selectedUploadFiles.forEach((file, index) => {
        const card = document.createElement('div');
        card.className = 'preview-thumb-card';

        const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
        const objectUrl = URL.createObjectURL(file);

        card.innerHTML = `
            <div class="preview-thumb-wrapper">
                <img src="${objectUrl}" alt="${escapeHTML(file.name)}">
            </div>
            <div class="preview-thumb-info">
                <span class="preview-thumb-name" title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</span>
                <span class="preview-thumb-size">${sizeInMb} MB</span>
            </div>
            <button type="button" class="btn-remove-preview" onclick="removeUploadFile(${index})" title="Remover da lista">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        previewGrid.appendChild(card);
    });

    const btnSubmit = document.getElementById('btnUploadPhotoSubmit');
    if (btnSubmit) {
        if (selectedUploadFiles.length > 0) {
            btnSubmit.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Fazer Upload (${selectedUploadFiles.length} foto${selectedUploadFiles.length > 1 ? 's' : ''})`;
        } else {
            btnSubmit.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Fazer Upload`;
        }
    }
}

function removeUploadFile(index) {
    selectedUploadFiles.splice(index, 1);
    renderUploadPreviews();
}

window.removeUploadFile = removeUploadFile;

// Carregar lista de temporadas e popular os selectores (dropdowns)
async function loadSeasons() {
    try {
        const { data, error } = await supabaseClient
            .from('seasons')
            .select('*')
            .order('number', { ascending: false });

        if (error) throw error;

        allSeasonsList = data || [];
        populateSeasonsDropdowns(allSeasonsList);

        // Por padrÃ£o, se houver temporadas, seleciona a primeira no gerenciador e carrega as fotos
        if (allSeasonsList.length > 0) {
            const selectManage = document.getElementById('selectManageSeason');
            const currentSelected = selectManage.value;

            // Se o que estava selecionado antes ainda existe, mantÃ©m. SenÃ£o, pega a primeira
            const stillExists = allSeasonsList.some(s => s.id == currentSelected);
            const targetId = stillExists ? currentSelected : allSeasonsList[0].id;
            
            selectManage.value = targetId;
            loadSeasonPhotos(targetId);
        } else {
            const grid = document.getElementById('adminGalleryGrid');
            if (grid) {
                grid.innerHTML = `
                    <div class="table-loading-row" style="grid-column: 1 / -1; width: 100%;">
                        Nenhuma temporada cadastrada. Crie uma temporada no formulÃ¡rio acima primeiro.
                    </div>
                `;
            }
        }

    } catch (err) {
        console.error("[Load Seasons] Erro:", err);
        showToast("Erro ao carregar temporadas.", "error");
    }
}

// Preencher os dropdowns do formulÃ¡rio de upload e gerenciador
function populateSeasonsDropdowns(seasons) {
    const selectUpload = document.getElementById('selectUploadSeason');
    const selectManage = document.getElementById('selectManageSeason');

    if (!selectUpload || !selectManage) return;

    const prevUploadVal = selectUpload.value;
    const prevManageVal = selectManage.value;

    selectUpload.innerHTML = '<option value="" disabled selected style="background: var(--bg-dark); color: var(--text-muted);">Selecione a Temporada...</option>';
    selectManage.innerHTML = '<option value="" disabled style="background: var(--bg-dark); color: var(--text-muted);">Filtrar por Temporada...</option>';

    seasons.forEach(season => {
        const optionHtml = `<option value="${season.id}" style="background: var(--bg-dark); color: #fff;">Temporada ${season.number} - ${escapeHTML(season.name)}</option>`;
        selectUpload.innerHTML += optionHtml;
        selectManage.innerHTML += optionHtml;
    });

    if (seasons.some(s => s.id == prevUploadVal)) selectUpload.value = prevUploadVal;
    if (seasons.some(s => s.id == prevManageVal)) selectManage.value = prevManageVal;
}

// Criar Nova Temporada
async function handleCreateSeasonSubmit(e) {
    e.preventDefault();

    const numberInput = document.getElementById('inputSeasonNumber');
    const nameInput = document.getElementById('inputSeasonName');
    const descInput = document.getElementById('inputSeasonDesc');
    const btnSubmit = document.getElementById('btnCreateSeasonSubmit');

    const number = parseInt(numberInput.value);
    const name = nameInput.value.trim();
    const description = descInput.value.trim();

    if (isNaN(number) || !name) {
        showToast("Preencha o nÃºmero e nome da temporada corretamente.", "error");
        return;
    }

    btnSubmit.disabled = true;
    const originalBtnHtml = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<span class="table-loading-row"><div class="spinner" style="margin:0; width:14px; height:14px;"></div> Criando...</span>`;

    try {
        const { error } = await supabaseClient
            .from('seasons')
            .insert({
                number: number,
                name: name,
                description: description
            });

        if (error) {
            if (error.code === '23505') {
                throw new Error(`A Temporada ${number} jÃ¡ estÃ¡ cadastrada.`);
            }
            throw error;
        }

        showToast(`Temporada ${number} criada com sucesso!`, "success");
        document.getElementById('formCreateSeason').reset();
        await loadSeasons();

    } catch (err) {
        console.error("[Create Season] Erro:", err);
        showToast(err.message || "Erro ao criar temporada.", "error");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnHtml;
    }
}

// Upload de fotos e vinculaÃ§Ã£o Ã  temporada
async function handleUploadPhotoSubmit(e) {
    e.preventDefault();

    const selectUpload = document.getElementById('selectUploadSeason');
    const titleInput = document.getElementById('inputPhotoTitle');
    const authorInput = document.getElementById('inputPhotoAuthor');
    const descInput = document.getElementById('inputPhotoDesc');
    const btnSubmit = document.getElementById('btnUploadPhotoSubmit');

    const seasonId = selectUpload.value;
    const title = titleInput?.value?.trim();
    const author = authorInput?.value?.trim();
    const description = descInput?.value?.trim() || '';

    if (!seasonId || selectedUploadFiles.length === 0 || !title || !author) {
        showToast("Preencha a temporada, tÃ­tulo, autor e selecione pelo menos uma imagem.", "error");
        return;
    }

    if (!isValidMinecraftUsername(author)) {
        showToast("Autor invÃ¡lido. Use um nick Minecraft vÃ¡lido.", "error");
        return;
    }

    const selectedSeason = allSeasonsList.find(s => s.id == seasonId);
    if (!selectedSeason) return;

    btnSubmit.disabled = true;
    const originalBtnHtml = btnSubmit.innerHTML;

    let uploadedPaths = [];
    let dbRowsToInsert = [];
    const totalFiles = selectedUploadFiles.length;

    try {
        for (let i = 0; i < totalFiles; i++) {
            const file = selectedUploadFiles[i];
            
            btnSubmit.innerHTML = `<span class="table-loading-row"><div class="spinner" style="margin:0; width:14px; height:14px;"></div> Enviando ${i + 1} de ${totalFiles}...</span>`;

            const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
            const randomStr = Math.random().toString(36).substring(2, 8);
            const filePath = `season_${selectedSeason.number}/${Date.now()}_${i}_${randomStr}_${sanitizedFileName}`;

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('seasons')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                if (uploadedPaths.length > 0) {
                    await supabaseClient.storage.from('seasons').remove(uploadedPaths);
                }
                throw uploadError;
            }

            uploadedPaths.push(filePath);

            const { data: { publicUrl } } = supabaseClient.storage
                .from('seasons')
                .getPublicUrl(filePath);

            dbRowsToInsert.push({
                season_id: seasonId,
                photo_path: publicUrl,
                description: description,
                title: title,
                author_name: author
            });
        }

        btnSubmit.innerHTML = `<span class="table-loading-row"><div class="spinner" style="margin:0; width:14px; height:14px;"></div> Gravando no banco...</span>`;
        const { error: dbError } = await supabaseClient
            .from('season_photos')
            .insert(dbRowsToInsert);

        if (dbError) {
            if (uploadedPaths.length > 0) {
                await supabaseClient.storage.from('seasons').remove(uploadedPaths);
            }
            throw dbError;
        }

        showToast(`${totalFiles} foto(s) enviada(s) com sucesso!`, "success");
        
        selectedUploadFiles = [];
        renderUploadPreviews();
        
        if (titleInput) titleInput.value = '';
        if (authorInput) authorInput.value = '';
        if (descInput) descInput.value = '';

        const selectManage = document.getElementById('selectManageSeason');
        if (selectManage.value == seasonId) {
            loadSeasonPhotos(seasonId);
        } else {
            selectManage.value = seasonId;
            loadSeasonPhotos(seasonId);
        }

    } catch (err) {
        console.error("[Upload Photo] Erro:", err);
        showToast("Falha no upload: " + err.message, "error");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnHtml;
    }
}

// Carregar as fotos vinculadas a uma temporada
async function loadSeasonPhotos(seasonId) {
    const grid = document.getElementById('adminGalleryGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="table-loading-row" style="grid-column: 1 / -1; width: 100%;">
            <div class="spinner"></div> Carregando fotos da temporada...
        </div>
    `;

    try {
        const { data, error } = await supabaseClient
            .from('season_photos')
            .select('*')
            .eq('season_id', seasonId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        currentSeasonPhotosList = data || [];
        renderSeasonPhotos(currentSeasonPhotosList);

    } catch (err) {
        console.error("[Load Photos] Erro:", err);
        grid.innerHTML = `
            <div class="table-loading-row" style="grid-column: 1 / -1; width: 100%; color: var(--error)">
                <i class="fa-solid fa-triangle-exclamation"></i> Erro ao buscar fotos: ${err.message}
            </div>
        `;
    }
}

// Renderizar o grid de fotos da temporada
function renderSeasonPhotos(photos) {
    const grid = document.getElementById('adminGalleryGrid');
    if (!grid) return;

    // Filtro por query de busca se houver
    const searchQuery = document.getElementById('inputSearchGallery')?.value?.trim().toLowerCase() || '';
    let filteredPhotos = photos;
    if (searchQuery) {
        filteredPhotos = photos.filter(p => 
            (p.title && p.title.toLowerCase().includes(searchQuery)) ||
            (p.author_name && p.author_name.toLowerCase().includes(searchQuery)) ||
            (p.description && p.description.toLowerCase().includes(searchQuery))
        );
    }

    const viewMode = document.getElementById('selectGalleryViewMode')?.value || 'individual';

    if (viewMode === 'albums') {
        const albums = {};
        filteredPhotos.forEach(photo => {
            const albumKey = `${photo.title || 'ConstruÃ§Ã£o'}_${photo.author_name || 'Jogador'}`;
            if (!albums[albumKey]) {
                albums[albumKey] = {
                    title: photo.title || 'ConstruÃ§Ã£o',
                    author: photo.author_name || 'Jogador',
                    photos: []
                };
            }
            albums[albumKey].photos.push(photo);
        });

        const albumList = Object.values(albums);
        if (albumList.length === 0) {
            grid.innerHTML = `
                <div class="table-loading-row" style="grid-column: 1 / -1; width: 100%;">
                    Nenhum Ã¡lbum encontrado para os critÃ©rios de busca.
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        grid.style.display = 'flex';
        grid.style.flexDirection = 'column';
        grid.style.gap = '2rem';
        grid.style.width = '100%';

        albumList.forEach(album => {
            const albumSection = document.createElement('div');
            const safeAuthor = safeMinecraftUsername(album.author);
            albumSection.className = 'admin-album-section';
            albumSection.style.background = 'rgba(255, 255, 255, 0.01)';
            albumSection.style.border = '1px solid rgba(255, 255, 255, 0.04)';
            albumSection.style.borderRadius = '16px';
            albumSection.style.padding = '1.5rem';
            albumSection.style.width = '100%';

            // CabeÃ§alho do Ã¡lbum
            const headerHtml = `
                <div class="admin-album-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.8rem;">
                    <img src="https://mc-heads.net/avatar/${encodeURIComponent(safeAuthor)}/24" class="table-mc-avatar" onerror="this.src='../icon/Fr32_Icon.png'">
                    <div>
                        <h4 style="margin: 0; color: #fff; font-size: 1.05rem; font-weight: 700;">${escapeHTML(album.title)}</h4>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Por: <strong>${escapeHTML(safeAuthor)}</strong> â€¢ ${album.photos.length} foto(s)</span>
                    </div>
                </div>
            `;

            // Sub-grid de fotos do Ã¡lbum
            const subGrid = document.createElement('div');
            subGrid.className = 'admin-gallery-grid';
            subGrid.style.display = 'grid';

            album.photos.forEach(photo => {
                const card = document.createElement('div');
                card.className = 'gallery-item-card';

                const resolvedSrc = resolveImagePath(photo.photo_path) || '../icon/Fr32_Icon.png';
                const titleText = photo.title || 'Sem tÃ­tulo';
                const authorText = photo.author_name || 'Desconhecido';
                const descText = photo.description ? `: ${photo.description}` : '';
                const legendText = `${titleText} (${authorText})${descText}`;

                card.innerHTML = `
                    <div class="gallery-img-wrapper">
                        <img class="gallery-preview-img" alt="${escapeHTML(legendText)}" loading="lazy">
                        <button class="btn-delete-photo" onclick="deleteSeasonPhoto(${Number(photo.id)}, '${escapeJSString(photo.photo_path)}')" title="Excluir Foto da Galeria">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <div class="gallery-item-info">
                        <p class="gallery-item-desc" title="${escapeHTML(legendText)}">${escapeHTML(legendText)}</p>
                        <span class="gallery-item-date">${new Date(photo.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                `;

                const img = card.querySelector('.gallery-preview-img');
                if (img) {
                    img.src = resolvedSrc;
                    img.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openLightbox(resolvedSrc, legendText);
                    });
                }

                subGrid.appendChild(card);
            });

            albumSection.innerHTML = headerHtml;
            albumSection.appendChild(subGrid);
            grid.appendChild(albumSection);
        });
    } else {
        // Modo individual: restauramos o display do grid original
        grid.style.display = 'grid';
        grid.style.flexDirection = '';
        grid.style.gap = '';
        grid.style.width = '';

        if (filteredPhotos.length === 0) {
            grid.innerHTML = `
                <div class="table-loading-row" style="grid-column: 1 / -1; width: 100%;">
                    Nenhuma foto encontrada para os critÃ©rios de busca.
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        filteredPhotos.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'gallery-item-card';

            const resolvedSrc = resolveImagePath(photo.photo_path) || '../icon/Fr32_Icon.png';
            const titleText = photo.title || 'Sem tÃ­tulo';
            const authorText = photo.author_name || 'Desconhecido';
            const descText = photo.description ? `: ${photo.description}` : '';
            const legendText = `${titleText} (${authorText})${descText}`;

            card.innerHTML = `
                <div class="gallery-img-wrapper">
                    <img class="gallery-preview-img" alt="${escapeHTML(legendText)}" loading="lazy">
                    <button class="btn-delete-photo" onclick="deleteSeasonPhoto(${Number(photo.id)}, '${escapeJSString(photo.photo_path)}')" title="Excluir Foto da Galeria">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div class="gallery-item-info">
                    <p class="gallery-item-desc" title="${escapeHTML(legendText)}">${escapeHTML(legendText)}</p>
                    <span class="gallery-item-date">${new Date(photo.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
            `;

            const img = card.querySelector('.gallery-preview-img');
            if (img) {
                img.src = resolvedSrc;
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openLightbox(resolvedSrc, legendText);
                });
            }

            grid.appendChild(card);
        });
    }
}

// Excluir Foto (Do banco de dados e do Supabase Storage)
async function deleteSeasonPhoto(id, photoPath) {
    if (!confirm("AtenÃ§Ã£o: Excluir esta foto tambÃ©m deletarÃ¡ permanentemente todas as suas curtidas e comentÃ¡rios associados. Deseja prosseguir?")) {
        return;
    }

    try {
        const pathMarker = '/public/seasons/';
        const index = photoPath.indexOf(pathMarker);
        let storagePath = '';
        if (index !== -1) {
            storagePath = decodeURIComponent(photoPath.substring(index + pathMarker.length));
        }

        const { error: dbError } = await supabaseClient
            .from('season_photos')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        if (storagePath) {
            const { error: storageError } = await supabaseClient.storage
                .from('seasons')
                .remove([storagePath]);
            
            if (storageError) {
                console.warn("[Delete Photo Storage] Falha ao remover arquivo fÃ­sico no Storage:", storageError);
            }
        }

        showToast("Foto excluÃ­da com sucesso!", "success");
        
        const selectManage = document.getElementById('selectManageSeason');
        loadSeasonPhotos(selectManage.value);

    } catch (err) {
        console.error("[Delete Photo] Erro:", err);
        showToast("Erro ao excluir foto: " + err.message, "error");
    }
}

// Expor funÃ§Ãµes globais de temporadas para window
window.deleteSeasonPhoto = deleteSeasonPhoto;
window.editVeteran = editVeteran;
window.deleteVeteran = deleteVeteran;
window.changeUserRole = changeUserRole;

// ---------------------------------------------------------------------
// 4.3. ABA MODERAÃ‡ÃƒO: LISTAR FOTOS E DELETAR COMENTÃRIOS DE QUALQUER USER
// ---------------------------------------------------------------------
let activeCommentsPhotoPath = ''; // Guarda qual imagem estÃ¡ ativa na moderaÃ§Ã£o

// Inicializar eventos de moderaÃ§Ã£o de comentÃ¡rios
function setupCommentsEvents() {
    const select = document.getElementById('selectCommentsSeason');
    if (select) {
        select.addEventListener('change', (e) => {
            loadModerationPhotos(e.target.value);
        });
    }

    const btnViewAll = document.getElementById('btnViewAllComments');
    if (btnViewAll) {
        btnViewAll.addEventListener('click', () => {
            loadAllComments();
        });
    }
}

// Inicializar a aba de moderaÃ§Ã£o de comentÃ¡rios
async function loadCommentsTab() {
    if (allSeasonsList.length === 0) {
        await loadSeasons();
    }
    populateCommentsSeasonDropdown();
    
    // Reseta visualizaÃ§Ã£o
    document.getElementById('moderationCommentsHeader').classList.add('hidden');
    document.getElementById('moderationCommentsList').innerHTML = `
        <div class="placeholder-pane" style="padding: 4rem 1rem; border: none; background: transparent; width: 100%;">
            <i class="fa-regular fa-comment-dots" style="font-size: 2.5rem; animation: float 3s ease-in-out infinite;"></i>
            <p style="font-size: 0.9rem;">Nenhuma foto selecionada. Escolha uma foto ao lado para gerenciar os comentÃ¡rios.</p>
        </div>
    `;
    const photoList = document.getElementById('moderationPhotosList');
    if (photoList) {
        photoList.innerHTML = `
            <div class="table-loading-row" style="grid-column: 1 / -1; font-size: 0.85rem; padding: 2rem 0;">
                Selecione uma temporada acima.
            </div>
        `;
    }
}

// Popular dropdown de temporadas na aba de comentÃ¡rios
function populateCommentsSeasonDropdown() {
    const select = document.getElementById('selectCommentsSeason');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="" disabled selected style="background: var(--bg-dark); color: var(--text-muted);">Selecione a Temporada...</option>';

    allSeasonsList.forEach(season => {
        select.innerHTML += `<option value="${season.id}" style="background: var(--bg-dark); color: #fff;">Temporada ${season.number} - ${escapeHTML(season.name)}</option>`;
    });

    if (allSeasonsList.some(s => s.id == currentVal)) {
        select.value = currentVal;
    }
}

// Carregar fotos da temporada para moderar
async function loadModerationPhotos(seasonId) {
    const listContainer = document.getElementById('moderationPhotosList');
    if (!listContainer) return;

    listContainer.innerHTML = `
        <div class="table-loading-row" style="grid-column: 1 / -1; font-size: 0.85rem; padding: 2rem 0;">
            <div class="spinner"></div> Buscando fotos...
        </div>
    `;

    try {
        const { data, error } = await supabaseClient
            .from('season_photos')
            .select('*')
            .eq('season_id', seasonId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderModerationPhotos(data || []);

    } catch (err) {
        console.error("[Load Moderation Photos] Erro:", err);
        listContainer.innerHTML = `
            <div class="table-loading-row" style="grid-column: 1 / -1; font-size: 0.85rem; color: var(--error)">
                Erro ao carregar.
            </div>
        `;
    }
}

// Renderizar thumbnails das fotos
function renderModerationPhotos(photos) {
    const listContainer = document.getElementById('moderationPhotosList');
    if (!listContainer) return;

    if (photos.length === 0) {
        listContainer.innerHTML = `
            <div class="table-loading-row" style="grid-column: 1 / -1; font-size: 0.85rem; padding: 2rem 0;">
                Nenhuma foto enviada nesta temporada.
            </div>
        `;
        return;
    }

    listContainer.innerHTML = '';

    photos.forEach(photo => {
        const img = document.createElement('img');
        img.src = resolveImagePath(photo.photo_path);
        
        const titleText = photo.title || 'Sem tÃ­tulo';
        const authorText = photo.author_name || 'Desconhecido';
        const descText = photo.description ? `: ${photo.description}` : '';
        const legendText = `${titleText} (${authorText})${descText}`;

        img.alt = legendText;
        img.className = 'moderation-photo-thumb';
        img.title = legendText;
        
        if (activeCommentsPhotoPath === photo.photo_path) {
            img.classList.add('active');
        }

        img.addEventListener('click', () => {
            document.querySelectorAll('.moderation-photo-thumb').forEach(el => el.classList.remove('active'));
            img.classList.add('active');
            selectPhotoForModeration(photo);
        });

        listContainer.appendChild(img);
    });
}

// Selecionar foto especÃ­fica para listar seus comentÃ¡rios
function selectPhotoForModeration(photo) {
    activeCommentsPhotoPath = photo.photo_path;

    const header = document.getElementById('moderationCommentsHeader');
    const previewImg = document.getElementById('moderationSelectedPhotoPreview');
    const descText = document.getElementById('moderationSelectedPhotoDesc');

    if (header && previewImg && descText) {
        previewImg.src = resolveImagePath(photo.photo_path);
        const titleText = photo.title || 'Sem tÃ­tulo';
        const authorText = photo.author_name || 'Desconhecido';
        const descTextVal = photo.description ? `: ${photo.description}` : '';
        descText.textContent = `${titleText} (${authorText})${descTextVal}`;
        header.classList.remove('hidden');
    }

    loadModerationComments(photo.photo_path);
}

// Buscar comentÃ¡rios de uma foto no Supabase e cruzar com nicks
async function loadModerationComments(photoPath) {
    const commentsList = document.getElementById('moderationCommentsList');
    if (!commentsList) return;

    commentsList.innerHTML = `
        <div class="table-loading-row" style="padding: 3rem 0;">
            <div class="spinner"></div> Carregando comentÃ¡rios...
        </div>
    `;

    try {
        const { data: comments, error } = await supabaseClient
            .from('comments')
            .select('id, content, created_at, user_id')
            .eq('photo_path', photoPath)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const countText = document.getElementById('moderationCommentsCount');
        if (countText) {
            countText.textContent = `${comments.length} ${comments.length === 1 ? 'comentÃ¡rio' : 'comentÃ¡rios'}`;
        }

        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="placeholder-pane" style="padding: 4rem 1rem; border: none; background: transparent; width: 100%;">
                    <i class="fa-regular fa-comment-slash" style="font-size: 2.5rem; opacity: 0.5;"></i>
                    <p style="font-size: 0.9rem;">Nenhum comentÃ¡rio cadastrado nesta foto.</p>
                </div>
            `;
            return;
        }

        const userIds = [...new Set(comments.map(c => c.user_id))];
        let profilesMap = {};

        if (userIds.length > 0) {
            const { data: profiles, error: profError } = await supabaseClient
                .from('profiles')
                .select('id, minecraft_username')
                .in('id', userIds);

            if (!profError && profiles) {
                profiles.forEach(p => {
                    profilesMap[p.id] = p.minecraft_username;
                });
            }
        }

        commentsList.innerHTML = '';
        comments.forEach(comment => {
            const username = safeMinecraftUsername(profilesMap[comment.user_id]);
            const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/26`;
            const dateText = new Date(comment.created_at).toLocaleString('pt-BR');

            const item = document.createElement('div');
            item.className = 'moderation-comment-item';

            item.innerHTML = `
                <img src="${avatarUrl}" alt="${escapeHTML(username)}" class="comment-avatar" onerror="this.src='../icon/Fr32_Icon.png'">
                <div class="comment-body">
                    <div class="comment-meta">
                        <span class="comment-user">${escapeHTML(username)}</span>
                        <span class="comment-time">${dateText}</span>
                    </div>
                    <div class="comment-text">${escapeHTML(comment.content)}</div>
                </div>
                <button class="btn-delete-comment" onclick="deleteComment(${Number(comment.id)})" title="Deletar ComentÃ¡rio">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;

            commentsList.appendChild(item);
        });

    } catch (err) {
        console.error("[Load Moderation Comments] Erro:", err);
        commentsList.innerHTML = `
            <div class="table-loading-row" style="padding: 3rem 0; color: var(--error)">
                Erro ao carregar comentÃ¡rios: ${err.message}
            </div>
        `;
    }
}

// Excluir ComentÃ¡rio (DisponÃ­vel para qualquer administrador)
async function deleteComment(commentId, isAllCommentsView = false) {
    if (!confirm("Tem certeza que deseja deletar permanentemente este comentÃ¡rio? Esta aÃ§Ã£o nÃ£o pode ser desfeita.")) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;

        showToast("ComentÃ¡rio deletado com sucesso!", "success");

        if (isAllCommentsView) {
            loadAllComments();
        } else if (activeCommentsPhotoPath) {
            loadModerationComments(activeCommentsPhotoPath);
        }

    } catch (err) {
        console.error("[Delete Comment] Erro:", err);
        showToast("Erro ao deletar comentÃ¡rio: " + err.message, "error");
    }
}

// Buscar TODOS os comentÃ¡rios de qualquer foto no Supabase e cruzar com nicks
async function loadAllComments() {
    activeCommentsPhotoPath = ''; // Reseta seleÃ§Ã£o de foto especÃ­fica

    // Desativa seleÃ§Ã£o ativa nos thumbnails da esquerda
    document.querySelectorAll('.moderation-photo-thumb').forEach(el => el.classList.remove('active'));

    const header = document.getElementById('moderationCommentsHeader');
    const previewImg = document.getElementById('moderationSelectedPhotoPreview');
    const descText = document.getElementById('moderationSelectedPhotoDesc');
    const countText = document.getElementById('moderationCommentsCount');
    const commentsList = document.getElementById('moderationCommentsList');

    if (!commentsList) return;

    if (header && previewImg && descText) {
        previewImg.src = '../icon/Fr32_Icon.png'; // Thumbnail genÃ©rico
        descText.textContent = 'ModeraÃ§Ã£o Geral: Todos os ComentÃ¡rios';
        header.classList.remove('hidden');
    }

    commentsList.innerHTML = `
        <div class="table-loading-row" style="padding: 3rem 0;">
            <div class="spinner"></div> Carregando todos os comentÃ¡rios...
        </div>
    `;

    try {
        const { data: comments, error } = await supabaseClient
            .from('comments')
            .select('id, content, created_at, user_id, photo_path')
            .order('created_at', { ascending: false }); // Recente primeiro

        if (error) throw error;

        if (countText) {
            countText.textContent = `${comments.length} ${comments.length === 1 ? 'comentÃ¡rio no total' : 'comentÃ¡rios no total'}`;
        }

        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="placeholder-pane" style="padding: 4rem 1rem; border: none; background: transparent; width: 100%;">
                    <i class="fa-regular fa-comment-slash" style="font-size: 2.5rem; opacity: 0.5;"></i>
                    <p style="font-size: 0.9rem;">Nenhum comentÃ¡rio cadastrado no site.</p>
                </div>
            `;
            return;
        }

        const userIds = [...new Set(comments.map(c => c.user_id))];
        let profilesMap = {};

        if (userIds.length > 0) {
            const { data: profiles, error: profError } = await supabaseClient
                .from('profiles')
                .select('id, minecraft_username')
                .in('id', userIds);

            if (!profError && profiles) {
                profiles.forEach(p => {
                    profilesMap[p.id] = p.minecraft_username;
                });
            }
        }

        commentsList.innerHTML = '';
        comments.forEach(comment => {
            const username = safeMinecraftUsername(profilesMap[comment.user_id]);
            const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/26`;
            const dateText = new Date(comment.created_at).toLocaleString('pt-BR');
            const commentPhotoSrc = resolveImagePath(comment.photo_path) || '../icon/Fr32_Icon.png';

            const item = document.createElement('div');
            item.className = 'moderation-comment-item';

            item.innerHTML = `
                <img src="${avatarUrl}" alt="${escapeHTML(username)}" class="comment-avatar" onerror="this.src='../icon/Fr32_Icon.png'">
                <div class="comment-body">
                    <div class="comment-meta">
                        <span class="comment-user">${escapeHTML(username)}</span>
                        <span class="comment-time">${dateText}</span>
                    </div>
                    <div class="comment-text">${escapeHTML(comment.content)}</div>
                </div>
                <img src="${escapeHTML(commentPhotoSrc)}" alt="Preview" class="comment-preview-thumb" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); margin: 0 10px; cursor: pointer; transition: transform 0.2s;" title="Clique para ver a foto original" onclick="highlightPhotoInModeration('${escapeJSString(comment.photo_path)}')">
                <button class="btn-delete-comment" onclick="deleteComment(${Number(comment.id)}, true)" title="Deletar ComentÃ¡rio">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;

            commentsList.appendChild(item);
        });

    } catch (err) {
        console.error("[Load All Comments] Erro:", err);
        commentsList.innerHTML = `
            <div class="table-loading-row" style="padding: 3rem 0; color: var(--error)">
                Erro ao carregar todos os comentÃ¡rios: ${err.message}
            </div>
        `;
    }
}

// Atalho para ir para o contexto da foto ao clicar no thumbnail do comentÃ¡rio
async function highlightPhotoInModeration(photoPath) {
    try {
        const { data: photoData, error } = await supabaseClient
            .from('season_photos')
            .select('*')
            .eq('photo_path', photoPath)
            .single();

        if (error || !photoData) throw new Error("Foto nÃ£o encontrada.");

        const select = document.getElementById('selectCommentsSeason');
        if (select) {
            select.value = photoData.season_id;
        }

        await loadModerationPhotos(photoData.season_id);
        selectPhotoForModeration(photoData);

        const thumbs = document.querySelectorAll('.moderation-photo-thumb');
        thumbs.forEach(thumb => {
            const decodedThumbSrc = decodeURIComponent(thumb.src);
            const decodedPath = decodeURIComponent(resolveImagePath(photoPath));
            if (decodedThumbSrc.endsWith(decodedPath)) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });

        showToast("Visualizando contexto do comentÃ¡rio.", "info");

    } catch (err) {
        console.error("[Highlight Photo] Erro:", err);
        showToast("NÃ£o foi possÃ­vel carregar o contexto da imagem original.", "error");
    }
}

// Expor funÃ§Ãµes globais para window
window.deleteComment = deleteComment;
window.deleteSeasonPhoto = deleteSeasonPhoto;
window.editVeteran = editVeteran;
window.deleteVeteran = deleteVeteran;
window.changeUserRole = changeUserRole;
window.loadAllComments = loadAllComments;
window.highlightPhotoInModeration = highlightPhotoInModeration;

// ---------------------------------------------------------------------
// 5. ABA NOTÃCIAS/EVENTOS: GERENCIAMENTO DE PUBLICAÃ‡Ã•ES DO SITE
// ---------------------------------------------------------------------
function setupAnnouncementsEvents() {
    const form = document.getElementById('formAnnouncement');
    if (form) form.addEventListener('submit', handleAnnouncementSubmit);

    const cancelBtn = document.getElementById('btnAnnouncementCancelEdit');
    if (cancelBtn) cancelBtn.addEventListener('click', resetAnnouncementForm);

    const searchInput = document.getElementById('inputSearchAnnouncements');
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            filterAnnouncementsTable(event.target.value);
        });
    }
}

function setAnnouncementsMode(type) {
    currentAnnouncementType = type === 'event' ? 'event' : 'news';
    const isEvent = currentAnnouncementType === 'event';

    const typeInput = document.getElementById('selectAnnouncementType');
    const badge = document.getElementById('announcementModeBadge');
    const paneTitle = document.getElementById('announcementPaneTitle');
    const paneDesc = document.getElementById('announcementPaneDesc');
    const tableTitle = document.getElementById('announcementsTableTitle');
    const guide = document.getElementById('announcementGuideContent');
    const timeLabel = document.querySelector('label[for="inputAnnouncementTime"]');
    const tagLabel = document.querySelector('label[for="inputAnnouncementTag"]');
    const tagInput = document.getElementById('inputAnnouncementTag');
    const timeInput = document.getElementById('inputAnnouncementTime');
    const timeGroup = document.getElementById('announcementTimeGroup');

    if (typeInput) typeInput.value = currentAnnouncementType;
    if (badge) badge.textContent = isEvent ? 'Eventos' : 'NotÃ­cias';
    if (paneTitle) paneTitle.textContent = isEvent ? 'Eventos do Site' : 'NotÃ­cias do Site';
    if (paneDesc) paneDesc.textContent = isEvent
        ? 'Adicione, edite ou remova os eventos exibidos na agenda da pÃ¡gina inicial.'
        : 'Adicione, edite ou remova as notÃ­cias exibidas na pÃ¡gina inicial.';
    if (tableTitle) {
        tableTitle.innerHTML = isEvent
            ? '<i class="fa-solid fa-list"></i> Eventos cadastrados'
            : '<i class="fa-solid fa-list"></i> NotÃ­cias cadastradas';
    }
    if (guide) {
        guide.innerHTML = isEvent
            ? `
                <p><i class="fa-solid fa-check"></i> Eventos aparecem na <strong>Agenda da comunidade</strong>.</p>
                <p><i class="fa-solid fa-check"></i> Use a tag como dia ou categoria, por exemplo: SÃ¡bado.</p>
                <p><i class="fa-solid fa-check"></i> Desmarque <strong>Publicado</strong> para guardar um rascunho.</p>
            `
            : `
                <p><i class="fa-solid fa-check"></i> NotÃ­cias aparecem na coluna <strong>Ãšltimas notÃ­cias</strong>.</p>
                <p><i class="fa-solid fa-check"></i> Use a tag como categoria, por exemplo: Temporada.</p>
                <p><i class="fa-solid fa-check"></i> Desmarque <strong>Publicado</strong> para guardar um rascunho.</p>
            `;
    }
    if (timeGroup) timeGroup.classList.toggle('hidden', !isEvent);
    if (timeLabel) timeLabel.textContent = 'HorÃ¡rio';
    if (tagLabel) tagLabel.textContent = isEvent ? 'Dia / Tag' : 'Tag';
    if (tagInput) tagInput.placeholder = isEvent ? 'Ex: SÃ¡bado, Domingo, Evento' : 'Ex: Temporada, Rankings, Aviso';
    if (timeInput) {
        timeInput.placeholder = isEvent ? 'Ex: 20:00' : 'Opcional';
        timeInput.disabled = !isEvent;
        if (!isEvent) timeInput.value = '';
    }

    resetAnnouncementForm(false);
}

async function loadAnnouncementsList() {
    const tableBody = document.getElementById('tableAnnouncementsBody');
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="table-loading-row">
                <div class="spinner"></div> Carregando publicaÃ§Ãµes...
            </td>
        </tr>
    `;

    try {
        const { data, error } = await supabaseClient
            .from('site_announcements')
            .select('*')
            .eq('type', currentAnnouncementType)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        allAnnouncementsList = data || [];
        renderAnnouncementsTable(allAnnouncementsList);
    } catch (err) {
        console.error("[Announcements] Erro ao carregar:", err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty-row announcements-setup-warning">
                    <i class="fa-solid fa-database"></i>
                    <strong>ConfiguraÃ§Ã£o pendente no Supabase</strong>
                    <span>Execute o arquivo <code>site_announcements.sql</code> no SQL Editor. Depois disso vocÃª poderÃ¡ editar e remover os itens cadastrados.</span>
                </td>
            </tr>
        `;
        showToast("Execute o SQL de notÃ­cias/eventos no Supabase.", "error");
    }
}

function renderAnnouncementsTable(items) {
    const tableBody = document.getElementById('tableAnnouncementsBody');
    if (!tableBody) return;

    if (!items || items.length === 0) {
        const emptyLabel = currentAnnouncementType === 'event' ? 'evento' : 'notÃ­cia';
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty-row">
                    Nenhum ${emptyLabel} cadastrado.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';
    items.forEach(item => {
        const typeLabel = item.type === 'event' ? 'Evento' : 'NotÃ­cia';
        const typeIcon = item.type === 'event' ? 'fa-calendar-days' : 'fa-newspaper';
        const statusLabel = item.is_published ? 'Publicado' : 'Rascunho';
        const statusClass = item.is_published ? 'badge-published' : 'badge-draft';
        const tagLine = item.type === 'event'
            ? `${item.tag || 'Evento'}${item.event_time ? ' â€¢ ' + item.event_time : ''}`
            : (item.tag || 'NotÃ­cia');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="type-badge">
                    <i class="fa-solid ${typeIcon}"></i> ${typeLabel}
                </span>
            </td>
            <td>
                <strong>${escapeHTML(item.title)}</strong>
                <small class="table-subtext">${escapeHTML(item.content)}</small>
            </td>
            <td>${escapeHTML(tagLine)}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td class="text-right">
                <button class="btn-action btn-edit" onclick="editAnnouncement(${Number(item.id)})" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-action btn-demote" onclick="deleteAnnouncement(${Number(item.id)})" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function filterAnnouncementsTable(query) {
    const search = String(query || '').trim().toLowerCase();
    if (!search) {
        renderAnnouncementsTable(allAnnouncementsList);
        return;
    }

    const filtered = allAnnouncementsList.filter(item => {
        return [
            item.type,
            item.title,
            item.tag,
            item.event_time,
            item.content,
            item.is_published ? 'publicado' : 'rascunho'
        ].some(value => String(value || '').toLowerCase().includes(search));
    });

    renderAnnouncementsTable(filtered);
}

async function handleAnnouncementSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('inputAnnouncementId').value;
    const type = document.getElementById('selectAnnouncementType').value;
    const title = document.getElementById('inputAnnouncementTitle').value.trim();
    const tag = document.getElementById('inputAnnouncementTag').value.trim();
    const eventTime = document.getElementById('inputAnnouncementTime').value.trim();
    const content = document.getElementById('inputAnnouncementContent').value.trim();
    const sortOrder = Number(document.getElementById('inputAnnouncementOrder').value || 0);
    const isPublished = document.getElementById('inputAnnouncementPublished').checked;
    const btnSubmit = document.getElementById('btnAnnouncementSubmit');

    if (!['news', 'event'].includes(type)) {
        showToast("Tipo de publicaÃ§Ã£o invÃ¡lido.", "error");
        return;
    }

    if (!title || !tag || !content) {
        showToast("Preencha tÃ­tulo, tag e descriÃ§Ã£o.", "error");
        return;
    }

    const originalHtml = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="table-loading-row"><div class="spinner" style="margin:0; width:14px; height:14px;"></div> Salvando...</span>`;

    const payload = {
        type,
        title,
        tag,
        event_time: type === 'event' ? eventTime : null,
        content,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        is_published: isPublished,
        updated_at: new Date().toISOString()
    };

    try {
        if (id) {
            const { error } = await supabaseClient
                .from('site_announcements')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            showToast("PublicaÃ§Ã£o atualizada com sucesso.", "success");
        } else {
            const { error } = await supabaseClient
                .from('site_announcements')
                .insert({
                    ...payload,
                    created_by: currentUser?.id || null
                });
            if (error) throw error;
            showToast("PublicaÃ§Ã£o adicionada com sucesso.", "success");
        }

    resetAnnouncementForm();
        loadAnnouncementsList();
    } catch (err) {
        console.error("[Announcements] Erro ao salvar:", err);
        showToast("Erro ao salvar publicaÃ§Ã£o.", "error");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalHtml;
    }
}

function editAnnouncement(id) {
    const item = allAnnouncementsList.find(entry => Number(entry.id) === Number(id));
    if (!item) return;

    document.getElementById('inputAnnouncementId').value = item.id;
    document.getElementById('selectAnnouncementType').value = item.type || 'news';
    document.getElementById('inputAnnouncementTitle').value = item.title || '';
    document.getElementById('inputAnnouncementTag').value = item.tag || '';
    document.getElementById('inputAnnouncementTime').value = item.event_time || '';
    document.getElementById('inputAnnouncementContent').value = item.content || '';
    document.getElementById('inputAnnouncementOrder').value = Number(item.sort_order) || 0;
    document.getElementById('inputAnnouncementPublished').checked = item.is_published !== false;

    document.getElementById('announcementFormTitle').innerHTML = item.type === 'event'
        ? '<i class="fa-solid fa-pen"></i> Editar Evento'
        : '<i class="fa-solid fa-pen"></i> Editar NotÃ­cia';
    document.getElementById('announcementFormDesc').textContent = 'Altere as informaÃ§Ãµes e salve para atualizar o site.';
    document.getElementById('btnAnnouncementSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar';
    document.getElementById('btnAnnouncementCancelEdit').classList.remove('hidden');

    document.getElementById('formAnnouncement').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetAnnouncementForm(keepMode = true) {
    const form = document.getElementById('formAnnouncement');
    if (form) form.reset();
    document.getElementById('inputAnnouncementId').value = '';
    if (!keepMode) {
        document.getElementById('selectAnnouncementType').value = currentAnnouncementType;
    } else {
        document.getElementById('selectAnnouncementType').value = currentAnnouncementType;
    }
    document.getElementById('inputAnnouncementOrder').value = '0';
    document.getElementById('inputAnnouncementPublished').checked = true;
    const isEvent = currentAnnouncementType === 'event';
    document.getElementById('announcementFormTitle').innerHTML = isEvent
        ? '<i class="fa-solid fa-plus"></i> Adicionar Evento'
        : '<i class="fa-solid fa-plus"></i> Adicionar NotÃ­cia';
    document.getElementById('announcementFormDesc').textContent = isEvent
        ? 'Cadastre um evento para aparecer na agenda da home.'
        : 'Cadastre uma notÃ­cia para aparecer na home do site.';
    document.getElementById('btnAnnouncementSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
    document.getElementById('btnAnnouncementCancelEdit').classList.add('hidden');
}

async function deleteAnnouncement(id) {
    if (!confirm("Tem certeza que deseja excluir esta publicaÃ§Ã£o?")) return;

    try {
        const { error } = await supabaseClient
            .from('site_announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast("PublicaÃ§Ã£o removida.", "success");
        loadAnnouncementsList();
    } catch (err) {
        console.error("[Announcements] Erro ao excluir:", err);
        showToast("Erro ao excluir publicaÃ§Ã£o.", "error");
    }
}

window.editAnnouncement = editAnnouncement;
window.deleteAnnouncement = deleteAnnouncement;

// ---------------------------------------------------------------------
// 6. ABA PRODUTOS/VIPS: GERENCIAMENTO DA LOJA
// ---------------------------------------------------------------------
function setupProductsEvents() {
    const form = document.getElementById('formProduct');
    if (form) form.addEventListener('submit', handleProductSubmit);

    const cancelBtn = document.getElementById('btnProductCancelEdit');
    if (cancelBtn) cancelBtn.addEventListener('click', resetProductForm);

    const searchInput = document.getElementById('inputSearchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            filterProductsTable(event.target.value);
        });
    }

    const nameInput = document.getElementById('inputProductName');
    const slugInput = document.getElementById('inputProductSlug');
    if (nameInput && slugInput) {
        nameInput.addEventListener('input', () => {
            if (!slugInput.dataset.touched && !document.getElementById('inputProductId').value) {
                slugInput.value = safeProductSlug(nameInput.value);
            }
        });
        slugInput.addEventListener('input', () => {
            slugInput.dataset.touched = 'true';
            slugInput.value = safeProductSlug(slugInput.value);
        });
    }
}

function safeProductSlug(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
}

function linesToArray(value) {
    return String(value || '')
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean);
}

function arrayToLines(value) {
    return Array.isArray(value) ? value.join('\n') : '';
}

function classifyProductKitItem(item) {
    const text = String(item || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/espada|picareta|machado|\bpa\b|enxada|ferramenta|afiacao|eficiencia|saque/.test(text)) return 'tools';
    if (/set|capacete|peitoral|calca|bota|armadura/.test(text)) return 'armor';
    return 'items';
}

function getProductInitialKitFromForm() {
    return [
        ...linesToArray(document.getElementById('inputProductArmorKit').value),
        ...linesToArray(document.getElementById('inputProductToolsKit').value),
        ...linesToArray(document.getElementById('inputProductItemsKit').value)
    ];
}

function fillProductKitFields(initialKit = []) {
    const groups = { armor: [], tools: [], items: [] };
    (Array.isArray(initialKit) ? initialKit : []).forEach(item => {
        groups[classifyProductKitItem(item)].push(item);
    });

    document.getElementById('inputProductArmorKit').value = arrayToLines(groups.armor);
    document.getElementById('inputProductToolsKit').value = arrayToLines(groups.tools);
    document.getElementById('inputProductItemsKit').value = arrayToLines(groups.items);
}

function parsePriceText(value) {
    const normalized = String(value || '').replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function buildProductShowcase(features) {
    const list = Array.isArray(features) ? features : [];
    return [
        { icon: 'fa-solid fa-tag', title: 'Visual VIP', text: list[0] || 'Tag exclusiva no servidor.' },
        { icon: 'fa-solid fa-box-open', title: 'Kit principal', text: list[1] || 'Kit mensal para evoluir.' },
        { icon: 'fa-solid fa-calendar-week', title: 'Kit semanal', text: list[2] || 'Recompensas a cada 7 dias.' }
    ];
}

async function loadProductsList() {
    const tableBody = document.getElementById('tableProductsBody');
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="table-loading-row">
                <div class="spinner"></div> Carregando produtos...
            </td>
        </tr>
    `;

    try {
        const { data, error } = await supabaseClient
            .from('site_products')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('price', { ascending: true });

        if (error) throw error;

        allProductsList = data || [];
        renderProductsTable(allProductsList);
    } catch (err) {
        console.error("[Products] Erro ao carregar:", err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty-row announcements-setup-warning">
                    <i class="fa-solid fa-database"></i>
                    <strong>ConfiguraÃ§Ã£o pendente no Supabase</strong>
                    <span>Execute o arquivo <code>site_products.sql</code> no SQL Editor. Depois disso vocÃª poderÃ¡ editar e remover os VIPs pelo painel.</span>
                </td>
            </tr>
        `;
        showToast("Execute o SQL de produtos/VIPs no Supabase.", "error");
    }
}

function renderProductsTable(items) {
    const tableBody = document.getElementById('tableProductsBody');
    if (!tableBody) return;

    if (!items || items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty-row">
                    Nenhum produto cadastrado.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';
    items.forEach(item => {
        const statusLabel = item.is_published ? 'Publicado' : 'Rascunho';
        const statusClass = item.is_published ? 'badge-published' : 'badge-draft';
        const featured = item.is_featured ? ' â€¢ Destaque' : '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${escapeHTML(item.name)}</strong>
                <small class="table-subtext">${escapeHTML(item.subtitle || item.slug || '')}</small>
            </td>
            <td>${escapeHTML(item.price_text || '')}</td>
            <td><span class="type-badge">${escapeHTML(item.tier || 'VIP')}${featured}</span></td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td class="text-right">
                <button class="btn-action btn-edit" onclick="editProduct(${Number(item.id)})" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-action btn-demote" onclick="deleteProduct(${Number(item.id)})" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function filterProductsTable(query) {
    const search = String(query || '').trim().toLowerCase();
    if (!search) {
        renderProductsTable(allProductsList);
        return;
    }

    const filtered = allProductsList.filter(item => {
        return [
            item.name,
            item.slug,
            item.price_text,
            item.tier,
            item.subtitle,
            item.is_published ? 'publicado' : 'rascunho'
        ].some(value => String(value || '').toLowerCase().includes(search));
    });

    renderProductsTable(filtered);
}

async function handleProductSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('inputProductId').value;
    const name = document.getElementById('inputProductName').value.trim();
    const slug = safeProductSlug(document.getElementById('inputProductSlug').value || name);
    const priceText = document.getElementById('inputProductPriceText').value.trim();
    const features = linesToArray(document.getElementById('inputProductFeatures').value);
    const btnSubmit = document.getElementById('btnProductSubmit');

    if (!name || !slug || !priceText || features.length === 0) {
        showToast("Preencha nome, slug, preÃ§o e benefÃ­cios.", "error");
        return;
    }

    const payload = {
        type: 'vip',
        name,
        slug,
        price_text: priceText,
        price: parsePriceText(priceText),
        duration_text: document.getElementById('inputProductDuration').value.trim() || '30 dias',
        tier: document.getElementById('inputProductTier').value.trim() || 'VIP',
        theme: document.getElementById('inputProductTheme').value || slug,
        image_url: document.getElementById('inputProductImage').value.trim() || null,
        kit_image_url: document.getElementById('inputProductKitImage').value.trim() || null,
        kit_images: linesToArray(document.getElementById('inputProductKitImages').value),
        subtitle: document.getElementById('inputProductSubtitle').value.trim(),
        features,
        description: linesToArray(document.getElementById('inputProductDescription').value),
        initial_kit: getProductInitialKitFromForm(),
        weekly_kit: linesToArray(document.getElementById('inputProductWeeklyKit').value),
        showcase: buildProductShowcase(features),
        sort_order: Number(document.getElementById('inputProductOrder').value || 0),
        ribbon: document.getElementById('inputProductRibbon').value.trim(),
        is_featured: document.getElementById('inputProductFeatured').checked,
        is_published: document.getElementById('inputProductPublished').checked,
        updated_at: new Date().toISOString()
    };

    const originalHtml = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="table-loading-row"><div class="spinner" style="margin:0; width:14px; height:14px;"></div> Salvando...</span>`;

    try {
        if (id) {
            const { error } = await supabaseClient
                .from('site_products')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            showToast("Produto atualizado com sucesso.", "success");
        } else {
            const { error } = await supabaseClient
                .from('site_products')
                .insert({
                    ...payload,
                    created_by: currentUser?.id || null
                });
            if (error) throw error;
            showToast("Produto adicionado com sucesso.", "success");
        }

        resetProductForm();
        loadProductsList();
    } catch (err) {
        console.error("[Products] Erro ao salvar:", err);
        showToast("Erro ao salvar produto. Confira se o slug jÃ¡ existe.", "error");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalHtml;
    }
}

function editProduct(id) {
    const item = allProductsList.find(entry => Number(entry.id) === Number(id));
    if (!item) return;

    document.getElementById('inputProductId').value = item.id;
    document.getElementById('inputProductName').value = item.name || '';
    document.getElementById('inputProductSlug').value = item.slug || '';
    document.getElementById('inputProductSlug').dataset.touched = 'true';
    document.getElementById('inputProductPriceText').value = item.price_text || '';
    document.getElementById('inputProductDuration').value = item.duration_text || '30 dias';
    document.getElementById('inputProductTier').value = item.tier || '';
    document.getElementById('inputProductTheme').value = item.theme || 'ametista';
    document.getElementById('inputProductImage').value = item.image_url || '';
    document.getElementById('inputProductKitImage').value = item.kit_image_url || '';
    document.getElementById('inputProductKitImages').value = arrayToLines(item.kit_images);
    document.getElementById('inputProductSubtitle').value = item.subtitle || '';
    document.getElementById('inputProductFeatures').value = arrayToLines(item.features);
    document.getElementById('inputProductDescription').value = arrayToLines(item.description);
    fillProductKitFields(item.initial_kit);
    document.getElementById('inputProductWeeklyKit').value = arrayToLines(item.weekly_kit);
    document.getElementById('inputProductOrder').value = Number(item.sort_order) || 0;
    document.getElementById('inputProductRibbon').value = item.ribbon || '';
    document.getElementById('inputProductFeatured').checked = Boolean(item.is_featured);
    document.getElementById('inputProductPublished').checked = item.is_published !== false;

    document.getElementById('productFormTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Editar Produto';
    document.getElementById('productFormDesc').textContent = 'Altere as informaÃ§Ãµes do VIP e salve para atualizar a loja.';
    document.getElementById('btnProductSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar';
    document.getElementById('btnProductCancelEdit').classList.remove('hidden');
    document.getElementById('formProduct').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetProductForm() {
    const form = document.getElementById('formProduct');
    if (form) form.reset();

    document.getElementById('inputProductId').value = '';
    document.getElementById('inputProductSlug').dataset.touched = '';
    document.getElementById('inputProductDuration').value = '30 dias';
    document.getElementById('inputProductOrder').value = '0';
    document.getElementById('inputProductTheme').value = 'topazio';
    document.getElementById('inputProductPublished').checked = true;
    document.getElementById('inputProductFeatured').checked = false;
    document.getElementById('productFormTitle').innerHTML = '<i class="fa-solid fa-plus"></i> Adicionar Produto';
    document.getElementById('productFormDesc').textContent = 'Use um produto por plano VIP. Cada linha nos campos longos vira um item da lista no site.';
    document.getElementById('btnProductSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
    document.getElementById('btnProductCancelEdit').classList.add('hidden');
}

async function deleteProduct(id) {
    const item = allProductsList.find(entry => Number(entry.id) === Number(id));
    const label = item?.name || 'este produto';
    if (!confirm(`Tem certeza que deseja excluir ${label}?`)) return;

    try {
        const { error } = await supabaseClient
            .from('site_products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast("Produto removido.", "success");
        loadProductsList();
    } catch (err) {
        console.error("[Products] Erro ao excluir:", err);
        showToast("Erro ao excluir produto.", "error");
    }
}

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

// ---------------------------------------------------------------------
// 7. ABA FORMULARIOS: VAGAS DE STAFF E LINKS PRIVADOS
// ---------------------------------------------------------------------
const STAFF_FORM_TEMPLATE = [
    { id: 'discord', label: 'Seu Discord', type: 'text', required: true, placeholder: 'Ex: fabiofr32' },
    { id: 'idade', label: 'Idade', type: 'number', required: true, placeholder: 'Ex: 18' },
    { id: 'tempo_servidor', label: 'Ha quanto tempo joga no FR32Survival?', type: 'textarea', required: true },
    { id: 'disponibilidade', label: 'Qual sua disponibilidade semanal?', type: 'textarea', required: true },
    { id: 'experiencia', label: 'Ja foi staff em outro servidor? Conte sua experiencia.', type: 'textarea', required: true },
    { id: 'motivacao', label: 'Por que voce quer entrar para a equipe?', type: 'textarea', required: true },
    { id: 'situacao_hack', label: 'Como voce lidaria com um jogador usando hack?', type: 'textarea', required: true },
    { id: 'situacao_chat', label: 'Como voce lidaria com uma briga no chat?', type: 'textarea', required: true },
    { id: 'microfone', label: 'Tem microfone para entrevista?', type: 'select', required: true, options: ['Sim', 'Nao', 'Posso usar quando necessario'] },
    { id: 'regras', label: 'Confirmo que li as regras e aceito passar por periodo de teste.', type: 'checkbox', required: true }
];

function setupStaffFormsEvents() {
    const form = document.getElementById('formStaffForm');
    if (form) form.addEventListener('submit', handleStaffFormSubmit);

    const cancelBtn = document.getElementById('btnStaffFormCancelEdit');
    if (cancelBtn) cancelBtn.addEventListener('click', resetStaffFormAdmin);

    const templateBtn = document.getElementById('btnStaffFormTemplate');
    if (templateBtn) templateBtn.addEventListener('click', () => {
        document.getElementById('inputStaffFormTitle').value = 'Candidatura para Staff';
        document.getElementById('inputStaffFormSlug').value = 'vagas-staff';
        document.getElementById('inputStaffFormDescription').value = 'Preencha com sinceridade. A equipe vai avaliar sua disponibilidade, postura e conhecimento sobre o servidor.';
        document.getElementById('inputStaffFormSuccess').value = 'Candidatura enviada com sucesso. A equipe FR32Survival vai analisar suas respostas pelo painel administrativo.';
        document.getElementById('inputStaffFormFields').value = JSON.stringify(STAFF_FORM_TEMPLATE, null, 2);
        document.getElementById('inputStaffFormActive').checked = true;
    });

    const searchForms = document.getElementById('inputSearchStaffForms');
    if (searchForms) searchForms.addEventListener('input', () => renderStaffFormsTable(searchForms.value));

    const searchResponses = document.getElementById('inputSearchStaffResponses');
    if (searchResponses) searchResponses.addEventListener('input', () => renderStaffResponses(searchResponses.value));

    const responsesList = document.getElementById('staffResponsesList');
    if (responsesList) {
        responsesList.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-response-action]');
            if (actionButton) {
                event.preventDefault();
                updateStaffResponseStatus(actionButton.dataset.responseId, actionButton.dataset.responseAction);
                return;
            }

            const filterButton = event.target.closest('[data-response-filter]');
            if (filterButton) {
                event.preventDefault();
                setStaffResponseFilter(filterButton.dataset.responseFilter);
                return;
            }

            const refreshButton = event.target.closest('[data-response-refresh]');
            if (refreshButton) {
                event.preventDefault();
                selectStaffFormResponses(refreshButton.dataset.responseRefresh);
                return;
            }

            const responseRow = event.target.closest('[data-response-id]');
            if (responseRow) {
                event.preventDefault();
                selectStaffResponseDetail(responseRow.dataset.responseId);
            }
        });

        responsesList.addEventListener('change', (event) => {
            const statusSelect = event.target.closest('[data-response-status]');
            if (statusSelect) {
                updateStaffResponseStatus(statusSelect.dataset.responseId, statusSelect.value);
            }
        });
    }

    resetStaffFormAdmin();
}

async function loadStaffFormsList() {
    const tableBody = document.getElementById('tableStaffFormsBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" class="table-loading-row"><div class="spinner"></div> Carregando formulÃ¡rios...</td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('staff_forms')
            .select('*, staff_form_responses(count)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allStaffFormsList = data || [];
        renderStaffFormsTable();

        if (!selectedStaffFormId && allStaffFormsList.length) {
            await selectStaffFormResponses(allStaffFormsList[0].id, { silent: true });
        }
    } catch (err) {
        console.error('[Staff Forms] Erro ao carregar:', err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Execute o SQL staff_forms_schema.sql no Supabase.
                </td>
            </tr>
        `;
    }
}

function getStaffFormPublicLink(slug) {
    const base = new URL('../index.html', window.location.href).href;
    return `${base}#formulario?slug=${encodeURIComponent(slug)}`;
}

function renderStaffFormsTable(filter = '') {
    const tableBody = document.getElementById('tableStaffFormsBody');
    if (!tableBody) return;

    const term = String(filter || '').toLowerCase();
    const filtered = allStaffFormsList.filter(item =>
        String(item.title || '').toLowerCase().includes(term) ||
        String(item.slug || '').toLowerCase().includes(term)
    );

    if (!filtered.length) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum formulÃ¡rio encontrado.</td></tr>';
        return;
    }

    tableBody.innerHTML = filtered.map(item => {
        const count = Array.isArray(item.staff_form_responses) ? (item.staff_form_responses[0]?.count || 0) : 0;
        return `
            <tr class="${Number(item.id) === Number(selectedStaffFormId) ? 'selected-row' : ''}" onclick="selectStaffFormResponses(${item.id})">
                <td>
                    <strong>${escapeHTML(item.title)}</strong>
                    <br><small>${escapeHTML(item.description || '')}</small>
                </td>
                <td><code>${escapeHTML(item.slug)}</code></td>
                <td>${item.is_active ? '<span class="badge-published">Ativo</span>' : '<span class="badge-draft">Inativo</span>'}</td>
                <td>${count}</td>
                <td class="text-right" onclick="event.stopPropagation()">
                    <button class="btn-action btn-promote" onclick="copyStaffFormLink('${escapeJSString(item.slug)}')" title="Copiar link"><i class="fa-solid fa-link"></i></button>
                    <button class="btn-action btn-promote" onclick="selectStaffFormResponses(${item.id})" title="Ver respostas"><i class="fa-solid fa-inbox"></i></button>
                    <button class="btn-action btn-promote" onclick="editStaffForm(${item.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action btn-demote" onclick="deleteStaffForm(${item.id})" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleStaffFormSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('inputStaffFormId').value;
    const slug = slugify(document.getElementById('inputStaffFormSlug').value);
    let fields;

    try {
        fields = JSON.parse(document.getElementById('inputStaffFormFields').value || '[]');
        if (!Array.isArray(fields)) throw new Error('Campos precisam ser uma lista.');
    } catch (err) {
        showToast('JSON dos campos invalido.', 'error');
        return;
    }

    const payload = {
        title: document.getElementById('inputStaffFormTitle').value.trim(),
        slug,
        description: document.getElementById('inputStaffFormDescription').value.trim(),
        success_message: document.getElementById('inputStaffFormSuccess').value.trim(),
        fields,
        is_active: document.getElementById('inputStaffFormActive').checked,
        updated_at: new Date().toISOString()
    };

    if (!payload.title || !payload.slug) {
        showToast('Preencha titulo e slug.', 'error');
        return;
    }

    try {
        if (id) {
            const { error } = await supabaseClient.from('staff_forms').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Formulário atualizado.', 'success');
        } else {
            const { error } = await supabaseClient.from('staff_forms').insert({
                ...payload,
                created_by: currentUser.id
            });
            if (error) throw error;
            showToast('Formulário criado.', 'success');
        }

        resetStaffFormAdmin();
        loadStaffFormsList();
    } catch (err) {
        console.error('[Staff Forms] Erro ao salvar:', err);
        showToast('Erro ao salvar formulario. Confira o SQL e permissoes.', 'error');
    }
}

function editStaffForm(id) {
    const item = allStaffFormsList.find(entry => Number(entry.id) === Number(id));
    if (!item) return;

    document.getElementById('inputStaffFormId').value = item.id;
    document.getElementById('inputStaffFormTitle').value = item.title || '';
    document.getElementById('inputStaffFormSlug').value = item.slug || '';
    document.getElementById('inputStaffFormDescription').value = item.description || '';
    document.getElementById('inputStaffFormSuccess').value = item.success_message || '';
    document.getElementById('inputStaffFormFields').value = JSON.stringify(item.fields || [], null, 2);
    document.getElementById('inputStaffFormActive').checked = Boolean(item.is_active);
    document.getElementById('staffFormAdminTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Editar Formulário';
    document.getElementById('btnStaffFormSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar';
    document.getElementById('btnStaffFormCancelEdit').classList.remove('hidden');
    document.getElementById('formStaffForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetStaffFormAdmin() {
    const form = document.getElementById('formStaffForm');
    if (form) form.reset();
    document.getElementById('inputStaffFormId').value = '';
    document.getElementById('inputStaffFormTitle').value = 'Candidatura para Staff';
    document.getElementById('inputStaffFormSlug').value = 'vagas-staff';
    document.getElementById('inputStaffFormDescription').value = 'Preencha com sinceridade. A equipe vai avaliar sua disponibilidade, postura e conhecimento sobre o servidor.';
    document.getElementById('inputStaffFormSuccess').value = 'Candidatura enviada com sucesso. A equipe FR32Survival vai analisar suas respostas pelo painel administrativo.';
    document.getElementById('inputStaffFormFields').value = JSON.stringify(STAFF_FORM_TEMPLATE, null, 2);
    document.getElementById('inputStaffFormActive').checked = true;
    document.getElementById('staffFormAdminTitle').innerHTML = '<i class="fa-solid fa-plus"></i> Criar Formulário';
    document.getElementById('btnStaffFormSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
    document.getElementById('btnStaffFormCancelEdit').classList.add('hidden');
}

async function deleteStaffForm(id) {
    if (!confirm('Tem certeza que deseja excluir este formulario e suas respostas?')) return;
    const { error } = await supabaseClient.from('staff_forms').delete().eq('id', id);
    if (error) {
        showToast('Erro ao excluir formulario.', 'error');
        return;
    }
    showToast('Formulário excluído.', 'success');
    loadStaffFormsList();
}

async function copyStaffFormLink(slug) {
    const link = getStaffFormPublicLink(slug);
    await navigator.clipboard.writeText(link);
    showToast('Link do formulario copiado.', 'success');
}

async function selectStaffFormResponses(formId, options = {}) {
    selectedStaffFormId = formId;
    selectedStaffResponseId = null;
    const list = document.getElementById('staffResponsesList');
    if (list) list.innerHTML = '<div class="table-loading-row"><div class="spinner"></div> Carregando respostas...</div>';
    renderStaffFormsTable(document.getElementById('inputSearchStaffForms')?.value || '');

    try {
        const { data, error } = await supabaseClient
            .from('staff_form_responses')
            .select('*')
            .eq('form_id', formId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        allStaffResponsesList = data || [];
        renderStaffResponses();
        if (!options.silent) {
            document.getElementById('staffResponsesList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (err) {
        console.error('[Staff Forms] Erro ao carregar respostas:', err);
        if (list) {
            list.innerHTML = `
                <div class="forms-empty-response">
                    <strong>Erro ao carregar respostas.</strong>
                    <span>${escapeHTML(err.message || 'Confira as politicas RLS e a tabela staff_form_responses no Supabase.')}</span>
                </div>
            `;
        }
    }
}

function renderStaffResponses(filter = '') {
    const list = document.getElementById('staffResponsesList');
    if (!list) return;

    const term = String(filter || '').toLowerCase();
    const filtered = allStaffResponsesList.filter(item => {
        const blob = JSON.stringify(item.answers || {}).toLowerCase();
        const matchesSearch = blob.includes(term) ||
            String(item.minecraft_username || '').toLowerCase().includes(term) ||
            String(item.user_email || '').toLowerCase().includes(term);
        const matchesStatus = currentStaffResponseFilter === 'all' || item.status === currentStaffResponseFilter;
        return matchesSearch && matchesStatus;
    });

    const selected = filtered.find(item => Number(item.id) === Number(selectedStaffResponseId)) || filtered[0] || null;
    selectedStaffResponseId = selected?.id || null;
    list.innerHTML = renderStaffResponsesShell(filtered, selected);
}

function renderStaffResponsesShell(items, selected) {
    const statusCounts = allStaffResponsesList.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {});
    const total = allStaffResponsesList.length;
    const selectedForm = allStaffFormsList.find(form => Number(form.id) === Number(selectedStaffFormId));

    return `
        <div class="forms-response-dashboard">
            <div class="forms-response-board-head">
                <div>
                    <span>Central de respostas</span>
                    <h3>${escapeHTML(selectedForm?.title || 'Formulário')}</h3>
                    <p>${escapeHTML(selectedForm?.description || 'Analise as candidaturas recebidas e atualize o andamento.')}</p>
                </div>
                <button type="button" class="forms-refresh-btn" data-response-refresh="${Number(selectedStaffFormId) || 0}">
                    <i class="fa-solid fa-rotate"></i> Atualizar
                </button>
            </div>

            <div class="forms-response-summary">
                <div><i class="fa-solid fa-inbox"></i><strong>${total}</strong><span>respostas</span></div>
                <div><i class="fa-solid fa-sparkles"></i><strong>${statusCounts.nova || 0}</strong><span>novas</span></div>
                <div><i class="fa-solid fa-circle-check"></i><strong>${statusCounts.aprovada || 0}</strong><span>aprovadas</span></div>
                <div><i class="fa-solid fa-circle-xmark"></i><strong>${statusCounts.reprovada || 0}</strong><span>reprovadas</span></div>
            </div>

            <div class="forms-response-filters">
                ${['all','nova','em_analise','entrevista','aprovada','reprovada','arquivada'].map(status => `
                    <button type="button" class="${currentStaffResponseFilter === status ? 'active' : ''}" data-response-filter="${status}">
                        ${escapeHTML(status === 'all' ? 'Todas' : formatStaffStatus(status))}
                    </button>
                `).join('')}
            </div>

            <div class="forms-response-workspace">
                <aside class="forms-response-list">
                    ${items.length ? items.map(item => {
                        const row = renderStaffResponseListItem(item);
                        return Number(item.id) === Number(selectedStaffResponseId)
                            ? `${row}<div class="forms-response-inline-detail">${renderStaffResponseDetail(item)}</div>`
                            : row;
                    }).join('') : '<div class="forms-empty-response">Nenhuma resposta encontrada.</div>'}
                </aside>
                <section class="forms-response-detail" id="staffResponseDetailPanel">
                    ${selected ? renderStaffResponseDetail(selected) : '<div class="forms-empty-response">Selecione uma resposta para ver detalhes.</div>'}
                </section>
            </div>
        </div>
    `;
}

function renderStaffResponseListItem(item) {
    const selected = Number(item.id) === Number(selectedStaffResponseId);
    const answerPreview = getStaffResponsePreview(item);
    return `
        <button type="button" class="forms-response-row ${selected ? 'active' : ''}" data-response-id="${Number(item.id)}" onclick="selectStaffResponseDetailFromClick(event, ${Number(item.id)})">
            <span class="forms-response-avatar">${escapeHTML((item.minecraft_username || '?').slice(0, 1).toUpperCase())}</span>
            <span class="forms-response-row-main">
                <strong>${escapeHTML(item.minecraft_username || 'Sem nick')}</strong>
                <small>${escapeHTML(item.user_email || '')}</small>
                <em>${escapeHTML(answerPreview)}</em>
            </span>
            <span class="forms-response-row-side">
                <span class="forms-status-pill ${escapeHTML(item.status)}">${escapeHTML(formatStaffStatus(item.status))}</span>
                <small>Ver resposta</small>
            </span>
        </button>
    `;
}

function renderStaffResponseDetail(item) {
    const submittedAt = item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '--';
    const reviewedAt = item.reviewed_at ? new Date(item.reviewed_at).toLocaleString('pt-BR') : 'Ainda não revisado';
    return `
        <article class="staff-response-card is-detail">
            <div class="staff-response-hero">
                <div class="staff-response-avatar-large">${escapeHTML((item.minecraft_username || '?').slice(0, 1).toUpperCase())}</div>
                <div>
                    <span class="forms-status-pill ${escapeHTML(item.status)}">${escapeHTML(formatStaffStatus(item.status))}</span>
                    <h3>${escapeHTML(item.minecraft_username || 'Sem nick')}</h3>
                    <p>${escapeHTML(item.user_email || '')}</p>
                </div>
            </div>

            <div class="staff-response-head">
                <div>
                    <strong>Resumo da candidatura</strong>
                    <span>Enviada em ${escapeHTML(submittedAt)} • ${escapeHTML(reviewedAt)}</span>
                </div>
                <select data-response-status data-response-id="${Number(item.id)}">
                    ${['nova','em_analise','entrevista','aprovada','reprovada','arquivada'].map(status => `
                        <option value="${status}" ${item.status === status ? 'selected' : ''}>${escapeHTML(formatStaffStatus(status))}</option>
                    `).join('')}
                </select>
            </div>
            <div class="staff-response-actions">
                <button type="button" data-response-id="${Number(item.id)}" data-response-action="em_analise"><i class="fa-solid fa-clock"></i> Em análise</button>
                <button type="button" data-response-id="${Number(item.id)}" data-response-action="entrevista"><i class="fa-solid fa-comments"></i> Entrevista</button>
                <button type="button" class="approve" data-response-id="${Number(item.id)}" data-response-action="aprovada"><i class="fa-solid fa-check"></i> Aprovar</button>
                <button type="button" class="reject" data-response-id="${Number(item.id)}" data-response-action="reprovada"><i class="fa-solid fa-xmark"></i> Reprovar</button>
                <button type="button" data-response-id="${Number(item.id)}" data-response-action="arquivada"><i class="fa-solid fa-box-archive"></i> Arquivar</button>
            </div>
            <div class="staff-response-answers">
                ${Object.entries(item.answers || {}).map(([key, value]) => `
                    <div>
                        <span>${escapeHTML(formatAnswerLabel(key))}</span>
                        <p>${escapeHTML(typeof value === 'boolean' ? (value ? 'Sim' : 'Nao') : String(value || ''))}</p>
                    </div>
                `).join('')}
            </div>
        </article>
    `;
}

function getStaffResponsePreview(item) {
    const answers = item.answers || {};
    return answers.motivacao || answers.discord || Object.values(answers).find(Boolean) || 'Sem previa';
}

function formatAnswerLabel(key) {
    return String(key || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

function selectStaffResponseDetail(id) {
    selectedStaffResponseId = id;
    renderStaffResponses(document.getElementById('inputSearchStaffResponses')?.value || '');
    document.querySelector(`[data-response-id="${Number(id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function selectStaffResponseDetailFromClick(event, id) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    selectStaffResponseDetail(id);
}

function setStaffResponseFilter(status) {
    currentStaffResponseFilter = status;
    selectedStaffResponseId = null;
    renderStaffResponses(document.getElementById('inputSearchStaffResponses')?.value || '');
}
async function updateStaffResponseStatus(id, status) {
    const { error } = await supabaseClient
        .from('staff_form_responses')
        .update({
            status,
            reviewed_by: currentUser.id,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        showToast('Erro ao atualizar status.', 'error');
        return;
    }

    allStaffResponsesList = allStaffResponsesList.map(item =>
        Number(item.id) === Number(id)
            ? {
                ...item,
                status,
                reviewed_by: currentUser.id,
                reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
            : item
    );
    selectedStaffResponseId = id;
    renderStaffResponses(document.getElementById('inputSearchStaffResponses')?.value || '');
    showToast('Status atualizado.', 'success');
}

function formatStaffStatus(status) {
    const map = {
        nova: 'Nova',
        em_analise: 'Em analise',
        entrevista: 'Entrevista',
        aprovada: 'Aprovada',
        reprovada: 'Reprovada',
        arquivada: 'Arquivada'
    };
    return map[status] || status;
}

window.editStaffForm = editStaffForm;
window.deleteStaffForm = deleteStaffForm;
window.copyStaffFormLink = copyStaffFormLink;
window.selectStaffFormResponses = selectStaffFormResponses;
window.selectStaffResponseDetail = selectStaffResponseDetail;
window.selectStaffResponseDetailFromClick = selectStaffResponseDetailFromClick;
window.setStaffResponseFilter = setStaffResponseFilter;
window.updateStaffResponseStatus = updateStaffResponseStatus;

// ---------------------------------------------------------------------
// 8. SISTEMA DE TOAST NOTIFICATION PREMIUM
// ---------------------------------------------------------------------
function showToast(message, type = "info") {
    const toast = document.getElementById('adminToast');
    const toastIcon = document.getElementById('adminToastIcon');
    const toastText = document.getElementById('adminToastText');

    // Configura o Ã­cone e cor com base no tipo
    toast.className = 'toast'; // Reset
    toast.classList.add(type);

    if (type === 'success') {
        toastIcon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
    } else if (type === 'error') {
        toastIcon.innerHTML = `<i class="fa-solid fa-circle-xmark"></i>`;
    } else {
        toastIcon.innerHTML = `<i class="fa-solid fa-circle-info"></i>`;
    }

    toastText.textContent = message;

    // Mostra o Toast
    toast.classList.add('show');

    // Oculta apÃ³s alguns segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2400);
}

// Helper: Resolve o caminho de imagens locais ou externas
function resolveImagePath(path) {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/[\u0000-\u001f<>"'`]/.test(value)) return '';
    if (value.startsWith('https://dzfmtmlgbyxnqjdwutfp.supabase.co/storage/v1/object/public/seasons/')) {
        return value;
    }
    if (/^(Images|icon|eventos)\/[A-Za-z0-9_ .&%()\/-]+\.(png|jpg|jpeg|webp|gif)$/i.test(value)) {
        return '../' + value;
    }
    return '';
}

// Helper: Escape HTML contra injeÃ§Ã£o de script (XSS)
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function escapeJSString(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
}

function isValidMinecraftUsername(username) {
    return /^[A-Za-z0-9_]{3,16}$/.test(String(username || ''));
}

function safeMinecraftUsername(username) {
    const value = String(username || '').trim();
    return isValidMinecraftUsername(value) ? value : 'Jogador';
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

// FunÃ§Ãµes de controle do Lightbox
function openLightbox(src, caption) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxCap = document.getElementById('lightboxCaption');

    if (lightbox && lightboxImg) {
        lightbox.dataset.openedAt = Date.now().toString(); // Salva o timestamp exato de abertura
        lightboxImg.src = src;
        if (lightboxCap) lightboxCap.textContent = caption || '';
        lightbox.style.display = 'flex';
        lightbox.offsetHeight; // Force reflow
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            lightbox.style.display = 'none';
        }, 300);
    }
}

window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

// Inicializa o script quando o documento HTML terminar de carregar
document.addEventListener('DOMContentLoaded', () => {
    initAdminSupabase();
});

