/**
 * =====================================================================
 * FR32SURVIVAL - LOGIC SYSTEM FOR ADMIN PANEL (JS)
 * Desenvolvedor Web Full-Stack Sênior & Instrutor Didático
 * =====================================================================
 * Explicação da lógica e do fluxo para o estudante:
 * 
 * 1. Inicialização: Conectamos com o Supabase usando as chaves públicas da API.
 * 2. Route Guard (Segurança no Acesso): Assim que a página carrega, verificamos a sessão.
 *    Se não estiver logado ou se não for um admin cadastrado na tabela `user_permissions`,
 *    bloqueamos o conteúdo (evitando flashes de tela) e redirecionamos para a Home.
 * 3. Gerenciamento de Abas: Controlamos a exibição das seções administrativas.
 * 4. Painel de Permissões:
 *    - O Super Admin pode listar todos os usuários usando a RPC (Stored Procedure)
 *      `get_all_users_for_admin` criada no banco.
 *    - Promoção: Procuramos o UUID do usuário usando o e-mail pela RPC `get_user_id_by_email`
 *      e inserimos o cargo correspondente.
 *    - Revogação: Deletamos o registro do usuário na tabela de permissões.
 *    - Proteção: A interface e o RLS impedem qualquer modificação na conta do Super Admin.
 */

// Configurações do Supabase (Mesma URL e Chave do site principal)
const SUPABASE_URL = 'https://dzfmtmlgbyxnqjdwutfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Zm10bWxnYnl4bnFqZHd1dGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODE1MjcsImV4cCI6MjA5NzU1NzUyN30.8W_0L9OzmLSDH1ZMRtFFlc3Pyf54ENgVNV535TW1T7U';

let supabaseClient = null;
let currentUser = null;
let currentUserPermission = null;
let allUsersList = []; // Cache local para busca instantânea no frontend
let allAnnouncementsList = [];
let allProductsList = [];
let currentAnnouncementType = 'news';

// Inicialização do Supabase Client
function initAdminSupabase() {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        checkSessionAndRole();
    } else {
        console.error("[Admin] Erro: SDK do Supabase não carregado.");
        showToast("Erro ao carregar o SDK do banco de dados.", "error");
    }
}

// ---------------------------------------------------------------------
// 1. SISTEMA DE SEGURANÇA E PROTEÇÃO DE ROTA (ROUTE GUARD)
// ---------------------------------------------------------------------
async function checkSessionAndRole() {
    try {
        // Obter sessão atual do usuário
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
            // Se não houver sessão ativa, expulsa para a Home
            handleAccessDenied("Sessão expirada ou não autenticado. Faça login na Home.");
            return;
        }

        currentUser = session.user;

        // Buscar permissões do usuário logado diretamente na tabela
        const { data: permissionData, error: permError } = await supabaseClient
            .from('user_permissions')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

        // Se houver erro de consulta ou o usuário não constar na tabela de permissões, ele não é admin
        if (permError || !permissionData) {
            console.warn("[Auth Guard] Falha de validação.");
            handleAccessDenied("Acesso Negado: Você não tem permissão para acessar o Painel Admin.");
            return;
        }

        currentUserPermission = permissionData;

        // Se for admin ou super_admin, libera o acesso à página
        setupAdminInterface();

    } catch (err) {
        console.error("[Auth Guard] Erro crítico:", err);
        handleAccessDenied("Ocorreu um erro interno de validação.");
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
// 2. CONFIGURAÇÃO DA INTERFACE ADMIN
// ---------------------------------------------------------------------
function setupAdminInterface() {
    // Oculta a tela de carregamento e exibe o painel administrativo
    document.getElementById('authLoadingScreen').style.display = 'none';
    document.getElementById('adminPanelContent').style.display = 'block';

    // Atualiza os dados do usuário no cabeçalho
    document.getElementById('currentUserEmail').textContent = currentUser.email;
    
    const roleBadge = document.getElementById('currentUserRole');
    if (currentUserPermission.role === 'super_admin') {
        roleBadge.textContent = 'Super Admin';
        roleBadge.classList.add('super-admin');
        
        // Exibe o botão da aba de permissões (exclusivo para Super Admin)
        const tabBtn = document.getElementById('tabBtnPermissions');
        tabBtn.style.display = 'flex';
        
        // Inicializa a listagem de usuários e as interações de promoção
        loadUsersList();
        setupPermissionsEvents();
    } else {
        roleBadge.textContent = 'Administrador';
        
        // Se for Admin comum, a aba padrão deve ser a de Veteranos
        switchTab('veterans');
    }

    // Inicializar eventos de abas, logout, veteranos, temporadas, comentários e publicações
    setupGlobalEvents();
    setupVeteransEvents();
    setupSeasonsEvents();
    setupCommentsEvents();
    setupAnnouncementsEvents();
    setupProductsEvents();
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

    // Navegação entre abas
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Eventos do Lightbox para visualização de imagens
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

    // Adiciona evento de clique no preview de moderacao também
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
    // Remove classe ativa de todos os botões e painéis
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    // Adiciona classe ativa no botão clicado e no painel correspondente
    const activeBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);
    const paneId = (tabId === 'news' || tabId === 'events')
        ? 'tabAnnouncements'
        : `tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
    const activePane = document.getElementById(paneId);
    
    if (activeBtn && activePane) {
        activeBtn.classList.add('active');
        activePane.classList.add('active');
        
        // Carrega dados dinâmicos da aba ativa
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
        }
    }
}

// ---------------------------------------------------------------------
// 3. ABA PERMISSÕES: CARREGAR USUÁRIOS E GERENCIAR CARGOS
// ---------------------------------------------------------------------

// Eventos específicos da aba de permissões
function setupPermissionsEvents() {
    const form = document.getElementById('formPromoteAdmin');
    form.addEventListener('submit', handlePromoteFormSubmit);

    const searchInput = document.getElementById('inputSearchUsers');
    searchInput.addEventListener('input', (e) => {
        filterUsersTable(e.target.value);
    });
}

// Carregar lista geral de usuários
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
                    <i class="fa-solid fa-triangle-exclamation"></i> Falha ao carregar usuários: ${err.message}
                </td>
            </tr>
        `;
        showToast("Erro ao carregar lista de usuários.", "error");
    }
}

// Renderizar tabela de usuários
function renderUsersTable(users) {
    const tableBody = document.getElementById('tableUsersBody');
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty-row">
                    Nenhum usuário encontrado.
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

// Filtrar usuários com busca instantânea local
function filterUsersTable(query) {
    const filtered = allUsersList.filter(user => {
        const emailMatch = user.email.toLowerCase().includes(query.toLowerCase());
        const usernameMatch = user.minecraft_username && user.minecraft_username.toLowerCase().includes(query.toLowerCase());
        const uuidMatch = user.id.toLowerCase().includes(query.toLowerCase());
        return emailMatch || usernameMatch || uuidMatch;
    });
    renderUsersTable(filtered);
}

// Atualizar estatísticas de cargos no painel
function updateRoleStats(users) {
    const superAdmins = users.filter(u => u.role === 'super_admin').length;
    const admins = users.filter(u => u.role === 'admin').length;

    document.getElementById('statCountSuperAdmins').textContent = superAdmins;
    document.getElementById('statCountAdmins').textContent = admins;
}

// ---------------------------------------------------------------------
// 4. LÓGICA DE PROMOÇÃO E REBAIXAMENTO (API DIRECT CALLS)
// ---------------------------------------------------------------------

// Enviar Formulário de Promoção por Email
async function handlePromoteFormSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('inputPromoteEmail');
    const email = emailInput.value.trim().toLowerCase();
    const btnSubmit = document.getElementById('btnPromoteSubmit');

    if (!email) return;

    // Desativa formulário durante o loading
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="table-loading-row"><div class="spinner" style="margin: 0"></div> Concedendo...</span>`;

    try {
        // Passo A: Encontra o UUID do usuário correspondente ao e-mail informado
        const { data: userId, error: lookupError } = await supabaseClient.rpc('get_user_id_by_email', {
            search_email: email
        });

        if (lookupError || !userId) {
            throw new Error("Usuário não cadastrado ou e-mail inválido. O jogador precisa estar registrado no site.");
        }

        // Passo B: Insere o registro na tabela de permissões como 'admin'
        const { error: insertError } = await supabaseClient
            .from('user_permissions')
            .insert({
                user_id: userId,
                role: 'admin',
                email: email
            });

        if (insertError) {
            // Tratamento específico de violação de chave primária (já é admin)
            if (insertError.code === '23505') {
                throw new Error("Este usuário já possui permissão de Administrador ou superior.");
            }
            throw insertError;
        }

        showToast(`Sucesso! ${email} foi promovido a Administrador.`, "success");
        emailInput.value = '';
        loadUsersList(); // Recarrega a tabela de usuários

    } catch (err) {
        console.error("[Promote Admin] Erro:", err);
        showToast(err.message || "Erro desconhecido ao promover usuário.", "error");
    } finally {
        // Restaura o botão
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Conceder Cargo`;
    }
}

// Promover ou Rebaixar através dos botões de ação da tabela
async function changeUserRole(userId, action, email) {
    const confirmMessage = action === 'promote'
        ? `Tem certeza que deseja conceder cargo de Administrador para ${email}?`
        : `Atenção: Tem certeza que deseja remover o cargo de Administrador de ${email}? Ele perderá acesso ao painel instantaneamente.`;

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
            showToast(`${email} agora é um Administrador.`, "success");
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

// Inicializar eventos específicos da aba de veteranos
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

// Filtrar veteranos na busca instantânea local
function filterVeteransTable(query) {
    const filtered = allVeteransList.filter(vet => {
        const nickMatch = vet.minecraft_username.toLowerCase().includes(query.toLowerCase());
        const titleMatch = vet.title.toLowerCase().includes(query.toLowerCase());
        const descMatch = vet.description.toLowerCase().includes(query.toLowerCase());
        return nickMatch || titleMatch || descMatch;
    });
    renderVeteransTable(filtered);
}

// Enviar Formulário (Inserir ou Atualizar)
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
        showToast("Preencha todos os campos do formulário.", "error");
        return;
    }

    if (!isValidMinecraftUsername(nick)) {
        showToast("Nick inválido. Use de 3 a 16 caracteres: letras, números e underline (_).", "error");
        return;
    }

    btnSubmit.disabled = true;
    const originalBtnHtml = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<span class="table-loading-row"><div class="spinner" style="margin:0; width:14px; height:14px;"></div> Salvando...</span>`;

    try {
        if (id) {
            // Modo Edição
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
            // Modo Inserção
            const { error } = await supabaseClient
                .from('veterans')
                .insert({
                    minecraft_username: nick,
                    title: title,
                    description: description
                });

            if (error) {
                if (error.code === '23505') {
                    throw new Error("Este jogador já está cadastrado como veterano.");
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

// Entrar em Modo Edição
function editVeteran(id) {
    const vet = allVeteransList.find(v => v.id === id);
    if (!vet) return;

    document.getElementById('inputVeteranId').value = vet.id;
    document.getElementById('inputVeteranNick').value = vet.minecraft_username;
    document.getElementById('inputVeteranTitle').value = vet.title;
    document.getElementById('inputVeteranDesc').value = vet.description;

    document.getElementById('veteranFormTitle').innerHTML = `<i class="fa-solid fa-user-pen"></i> Editar Veterano`;
    document.getElementById('veteranFormDesc').textContent = "Atualize os dados do jogador selecionado.";
    document.getElementById('btnVeteranSubmit').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar Alterações`;
    document.getElementById('btnVeteranCancelEdit').classList.remove('hidden');

    document.getElementById('formVeteran').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Cancelar Edição
function cancelVeteranEdit() {
    document.getElementById('formVeteran').reset();
    document.getElementById('inputVeteranId').value = '';

    document.getElementById('veteranFormTitle').innerHTML = `<i class="fa-solid fa-user-plus"></i> Adicionar Veterano`;
    document.getElementById('veteranFormDesc').textContent = "Insira as informações do jogador para destacá-lo no mural.";
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

// Expor funções globais para escopo da janela (evita problemas em onclick inline no HTML)
// Expor funções globais para escopo da janela (evita problemas em onclick inline no HTML)
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

    // Configuração do Drag & Drop e fila de arquivos
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('inputPhotoFile');

    if (dropzone && fileInput) {
        // Clicar na dropzone abre a seleção de arquivos
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

        // Evento de alteração no input padrão
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleSelectedFiles(e.target.files);
                fileInput.value = '';
            }
        });
    }
}

// Manipulação e visualização da fila de uploads
function handleSelectedFiles(files) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!validTypes.includes(file.type)) {
            showToast(`Arquivo "${file.name}" não é uma imagem permitida (PNG, JPG, WEBP, GIF).`, "error");
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

        // Por padrão, se houver temporadas, seleciona a primeira no gerenciador e carrega as fotos
        if (allSeasonsList.length > 0) {
            const selectManage = document.getElementById('selectManageSeason');
            const currentSelected = selectManage.value;

            // Se o que estava selecionado antes ainda existe, mantém. Senão, pega a primeira
            const stillExists = allSeasonsList.some(s => s.id == currentSelected);
            const targetId = stillExists ? currentSelected : allSeasonsList[0].id;
            
            selectManage.value = targetId;
            loadSeasonPhotos(targetId);
        } else {
            const grid = document.getElementById('adminGalleryGrid');
            if (grid) {
                grid.innerHTML = `
                    <div class="table-loading-row" style="grid-column: 1 / -1; width: 100%;">
                        Nenhuma temporada cadastrada. Crie uma temporada no formulário acima primeiro.
                    </div>
                `;
            }
        }

    } catch (err) {
        console.error("[Load Seasons] Erro:", err);
        showToast("Erro ao carregar temporadas.", "error");
    }
}

// Preencher os dropdowns do formulário de upload e gerenciador
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
        showToast("Preencha o número e nome da temporada corretamente.", "error");
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
                throw new Error(`A Temporada ${number} já está cadastrada.`);
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

// Upload de fotos e vinculação à temporada
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
        showToast("Preencha a temporada, título, autor e selecione pelo menos uma imagem.", "error");
        return;
    }

    if (!isValidMinecraftUsername(author)) {
        showToast("Autor inválido. Use um nick Minecraft válido.", "error");
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
            const albumKey = `${photo.title || 'Construção'}_${photo.author_name || 'Jogador'}`;
            if (!albums[albumKey]) {
                albums[albumKey] = {
                    title: photo.title || 'Construção',
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
                    Nenhum álbum encontrado para os critérios de busca.
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

            // Cabeçalho do álbum
            const headerHtml = `
                <div class="admin-album-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.8rem;">
                    <img src="https://mc-heads.net/avatar/${encodeURIComponent(safeAuthor)}/24" class="table-mc-avatar" onerror="this.src='../icon/Fr32_Icon.png'">
                    <div>
                        <h4 style="margin: 0; color: #fff; font-size: 1.05rem; font-weight: 700;">${escapeHTML(album.title)}</h4>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Por: <strong>${escapeHTML(safeAuthor)}</strong> • ${album.photos.length} foto(s)</span>
                    </div>
                </div>
            `;

            // Sub-grid de fotos do álbum
            const subGrid = document.createElement('div');
            subGrid.className = 'admin-gallery-grid';
            subGrid.style.display = 'grid';

            album.photos.forEach(photo => {
                const card = document.createElement('div');
                card.className = 'gallery-item-card';

                const resolvedSrc = resolveImagePath(photo.photo_path) || '../icon/Fr32_Icon.png';
                const titleText = photo.title || 'Sem título';
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
                    Nenhuma foto encontrada para os critérios de busca.
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        filteredPhotos.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'gallery-item-card';

            const resolvedSrc = resolveImagePath(photo.photo_path) || '../icon/Fr32_Icon.png';
            const titleText = photo.title || 'Sem título';
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
    if (!confirm("Atenção: Excluir esta foto também deletará permanentemente todas as suas curtidas e comentários associados. Deseja prosseguir?")) {
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
                console.warn("[Delete Photo Storage] Falha ao remover arquivo físico no Storage:", storageError);
            }
        }

        showToast("Foto excluída com sucesso!", "success");
        
        const selectManage = document.getElementById('selectManageSeason');
        loadSeasonPhotos(selectManage.value);

    } catch (err) {
        console.error("[Delete Photo] Erro:", err);
        showToast("Erro ao excluir foto: " + err.message, "error");
    }
}

// Expor funções globais de temporadas para window
window.deleteSeasonPhoto = deleteSeasonPhoto;
window.editVeteran = editVeteran;
window.deleteVeteran = deleteVeteran;
window.changeUserRole = changeUserRole;

// ---------------------------------------------------------------------
// 4.3. ABA MODERAÇÃO: LISTAR FOTOS E DELETAR COMENTÁRIOS DE QUALQUER USER
// ---------------------------------------------------------------------
let activeCommentsPhotoPath = ''; // Guarda qual imagem está ativa na moderação

// Inicializar eventos de moderação de comentários
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

// Inicializar a aba de moderação de comentários
async function loadCommentsTab() {
    if (allSeasonsList.length === 0) {
        await loadSeasons();
    }
    populateCommentsSeasonDropdown();
    
    // Reseta visualização
    document.getElementById('moderationCommentsHeader').classList.add('hidden');
    document.getElementById('moderationCommentsList').innerHTML = `
        <div class="placeholder-pane" style="padding: 4rem 1rem; border: none; background: transparent; width: 100%;">
            <i class="fa-regular fa-comment-dots" style="font-size: 2.5rem; animation: float 3s ease-in-out infinite;"></i>
            <p style="font-size: 0.9rem;">Nenhuma foto selecionada. Escolha uma foto ao lado para gerenciar os comentários.</p>
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

// Popular dropdown de temporadas na aba de comentários
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
        
        const titleText = photo.title || 'Sem título';
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

// Selecionar foto específica para listar seus comentários
function selectPhotoForModeration(photo) {
    activeCommentsPhotoPath = photo.photo_path;

    const header = document.getElementById('moderationCommentsHeader');
    const previewImg = document.getElementById('moderationSelectedPhotoPreview');
    const descText = document.getElementById('moderationSelectedPhotoDesc');

    if (header && previewImg && descText) {
        previewImg.src = resolveImagePath(photo.photo_path);
        const titleText = photo.title || 'Sem título';
        const authorText = photo.author_name || 'Desconhecido';
        const descTextVal = photo.description ? `: ${photo.description}` : '';
        descText.textContent = `${titleText} (${authorText})${descTextVal}`;
        header.classList.remove('hidden');
    }

    loadModerationComments(photo.photo_path);
}

// Buscar comentários de uma foto no Supabase e cruzar com nicks
async function loadModerationComments(photoPath) {
    const commentsList = document.getElementById('moderationCommentsList');
    if (!commentsList) return;

    commentsList.innerHTML = `
        <div class="table-loading-row" style="padding: 3rem 0;">
            <div class="spinner"></div> Carregando comentários...
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
            countText.textContent = `${comments.length} ${comments.length === 1 ? 'comentário' : 'comentários'}`;
        }

        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="placeholder-pane" style="padding: 4rem 1rem; border: none; background: transparent; width: 100%;">
                    <i class="fa-regular fa-comment-slash" style="font-size: 2.5rem; opacity: 0.5;"></i>
                    <p style="font-size: 0.9rem;">Nenhum comentário cadastrado nesta foto.</p>
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
                <button class="btn-delete-comment" onclick="deleteComment(${Number(comment.id)})" title="Deletar Comentário">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;

            commentsList.appendChild(item);
        });

    } catch (err) {
        console.error("[Load Moderation Comments] Erro:", err);
        commentsList.innerHTML = `
            <div class="table-loading-row" style="padding: 3rem 0; color: var(--error)">
                Erro ao carregar comentários: ${err.message}
            </div>
        `;
    }
}

// Excluir Comentário (Disponível para qualquer administrador)
async function deleteComment(commentId, isAllCommentsView = false) {
    if (!confirm("Tem certeza que deseja deletar permanentemente este comentário? Esta ação não pode ser desfeita.")) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;

        showToast("Comentário deletado com sucesso!", "success");

        if (isAllCommentsView) {
            loadAllComments();
        } else if (activeCommentsPhotoPath) {
            loadModerationComments(activeCommentsPhotoPath);
        }

    } catch (err) {
        console.error("[Delete Comment] Erro:", err);
        showToast("Erro ao deletar comentário: " + err.message, "error");
    }
}

// Buscar TODOS os comentários de qualquer foto no Supabase e cruzar com nicks
async function loadAllComments() {
    activeCommentsPhotoPath = ''; // Reseta seleção de foto específica

    // Desativa seleção ativa nos thumbnails da esquerda
    document.querySelectorAll('.moderation-photo-thumb').forEach(el => el.classList.remove('active'));

    const header = document.getElementById('moderationCommentsHeader');
    const previewImg = document.getElementById('moderationSelectedPhotoPreview');
    const descText = document.getElementById('moderationSelectedPhotoDesc');
    const countText = document.getElementById('moderationCommentsCount');
    const commentsList = document.getElementById('moderationCommentsList');

    if (!commentsList) return;

    if (header && previewImg && descText) {
        previewImg.src = '../icon/Fr32_Icon.png'; // Thumbnail genérico
        descText.textContent = 'Moderação Geral: Todos os Comentários';
        header.classList.remove('hidden');
    }

    commentsList.innerHTML = `
        <div class="table-loading-row" style="padding: 3rem 0;">
            <div class="spinner"></div> Carregando todos os comentários...
        </div>
    `;

    try {
        const { data: comments, error } = await supabaseClient
            .from('comments')
            .select('id, content, created_at, user_id, photo_path')
            .order('created_at', { ascending: false }); // Recente primeiro

        if (error) throw error;

        if (countText) {
            countText.textContent = `${comments.length} ${comments.length === 1 ? 'comentário no total' : 'comentários no total'}`;
        }

        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="placeholder-pane" style="padding: 4rem 1rem; border: none; background: transparent; width: 100%;">
                    <i class="fa-regular fa-comment-slash" style="font-size: 2.5rem; opacity: 0.5;"></i>
                    <p style="font-size: 0.9rem;">Nenhum comentário cadastrado no site.</p>
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
                <button class="btn-delete-comment" onclick="deleteComment(${Number(comment.id)}, true)" title="Deletar Comentário">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;

            commentsList.appendChild(item);
        });

    } catch (err) {
        console.error("[Load All Comments] Erro:", err);
        commentsList.innerHTML = `
            <div class="table-loading-row" style="padding: 3rem 0; color: var(--error)">
                Erro ao carregar todos os comentários: ${err.message}
            </div>
        `;
    }
}

// Atalho para ir para o contexto da foto ao clicar no thumbnail do comentário
async function highlightPhotoInModeration(photoPath) {
    try {
        const { data: photoData, error } = await supabaseClient
            .from('season_photos')
            .select('*')
            .eq('photo_path', photoPath)
            .single();

        if (error || !photoData) throw new Error("Foto não encontrada.");

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

        showToast("Visualizando contexto do comentário.", "info");

    } catch (err) {
        console.error("[Highlight Photo] Erro:", err);
        showToast("Não foi possível carregar o contexto da imagem original.", "error");
    }
}

// Expor funções globais para window
window.deleteComment = deleteComment;
window.deleteSeasonPhoto = deleteSeasonPhoto;
window.editVeteran = editVeteran;
window.deleteVeteran = deleteVeteran;
window.changeUserRole = changeUserRole;
window.loadAllComments = loadAllComments;
window.highlightPhotoInModeration = highlightPhotoInModeration;

// ---------------------------------------------------------------------
// 5. ABA NOTÍCIAS/EVENTOS: GERENCIAMENTO DE PUBLICAÇÕES DO SITE
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
    if (badge) badge.textContent = isEvent ? 'Eventos' : 'Notícias';
    if (paneTitle) paneTitle.textContent = isEvent ? 'Eventos do Site' : 'Notícias do Site';
    if (paneDesc) paneDesc.textContent = isEvent
        ? 'Adicione, edite ou remova os eventos exibidos na agenda da página inicial.'
        : 'Adicione, edite ou remova as notícias exibidas na página inicial.';
    if (tableTitle) {
        tableTitle.innerHTML = isEvent
            ? '<i class="fa-solid fa-list"></i> Eventos cadastrados'
            : '<i class="fa-solid fa-list"></i> Notícias cadastradas';
    }
    if (guide) {
        guide.innerHTML = isEvent
            ? `
                <p><i class="fa-solid fa-check"></i> Eventos aparecem na <strong>Agenda da comunidade</strong>.</p>
                <p><i class="fa-solid fa-check"></i> Use a tag como dia ou categoria, por exemplo: Sábado.</p>
                <p><i class="fa-solid fa-check"></i> Desmarque <strong>Publicado</strong> para guardar um rascunho.</p>
            `
            : `
                <p><i class="fa-solid fa-check"></i> Notícias aparecem na coluna <strong>Últimas notícias</strong>.</p>
                <p><i class="fa-solid fa-check"></i> Use a tag como categoria, por exemplo: Temporada.</p>
                <p><i class="fa-solid fa-check"></i> Desmarque <strong>Publicado</strong> para guardar um rascunho.</p>
            `;
    }
    if (timeGroup) timeGroup.classList.toggle('hidden', !isEvent);
    if (timeLabel) timeLabel.textContent = 'Horário';
    if (tagLabel) tagLabel.textContent = isEvent ? 'Dia / Tag' : 'Tag';
    if (tagInput) tagInput.placeholder = isEvent ? 'Ex: Sábado, Domingo, Evento' : 'Ex: Temporada, Rankings, Aviso';
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
                <div class="spinner"></div> Carregando publicações...
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
                    <strong>Configuração pendente no Supabase</strong>
                    <span>Execute o arquivo <code>site_announcements.sql</code> no SQL Editor. Depois disso você poderá editar e remover os itens cadastrados.</span>
                </td>
            </tr>
        `;
        showToast("Execute o SQL de notícias/eventos no Supabase.", "error");
    }
}

function renderAnnouncementsTable(items) {
    const tableBody = document.getElementById('tableAnnouncementsBody');
    if (!tableBody) return;

    if (!items || items.length === 0) {
        const emptyLabel = currentAnnouncementType === 'event' ? 'evento' : 'notícia';
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
        const typeLabel = item.type === 'event' ? 'Evento' : 'Notícia';
        const typeIcon = item.type === 'event' ? 'fa-calendar-days' : 'fa-newspaper';
        const statusLabel = item.is_published ? 'Publicado' : 'Rascunho';
        const statusClass = item.is_published ? 'badge-published' : 'badge-draft';
        const tagLine = item.type === 'event'
            ? `${item.tag || 'Evento'}${item.event_time ? ' • ' + item.event_time : ''}`
            : (item.tag || 'Notícia');

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
        showToast("Tipo de publicação inválido.", "error");
        return;
    }

    if (!title || !tag || !content) {
        showToast("Preencha título, tag e descrição.", "error");
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
            showToast("Publicação atualizada com sucesso.", "success");
        } else {
            const { error } = await supabaseClient
                .from('site_announcements')
                .insert({
                    ...payload,
                    created_by: currentUser?.id || null
                });
            if (error) throw error;
            showToast("Publicação adicionada com sucesso.", "success");
        }

    resetAnnouncementForm();
        loadAnnouncementsList();
    } catch (err) {
        console.error("[Announcements] Erro ao salvar:", err);
        showToast("Erro ao salvar publicação.", "error");
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
        : '<i class="fa-solid fa-pen"></i> Editar Notícia';
    document.getElementById('announcementFormDesc').textContent = 'Altere as informações e salve para atualizar o site.';
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
        : '<i class="fa-solid fa-plus"></i> Adicionar Notícia';
    document.getElementById('announcementFormDesc').textContent = isEvent
        ? 'Cadastre um evento para aparecer na agenda da home.'
        : 'Cadastre uma notícia para aparecer na home do site.';
    document.getElementById('btnAnnouncementSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
    document.getElementById('btnAnnouncementCancelEdit').classList.add('hidden');
}

async function deleteAnnouncement(id) {
    if (!confirm("Tem certeza que deseja excluir esta publicação?")) return;

    try {
        const { error } = await supabaseClient
            .from('site_announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast("Publicação removida.", "success");
        loadAnnouncementsList();
    } catch (err) {
        console.error("[Announcements] Erro ao excluir:", err);
        showToast("Erro ao excluir publicação.", "error");
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
                    <strong>Configuração pendente no Supabase</strong>
                    <span>Execute o arquivo <code>site_products.sql</code> no SQL Editor. Depois disso você poderá editar e remover os VIPs pelo painel.</span>
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
        const featured = item.is_featured ? ' • Destaque' : '';
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
        showToast("Preencha nome, slug, preço e benefícios.", "error");
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
        showToast("Erro ao salvar produto. Confira se o slug já existe.", "error");
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
    document.getElementById('productFormDesc').textContent = 'Altere as informações do VIP e salve para atualizar a loja.';
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
// 7. SISTEMA DE TOAST NOTIFICATION PREMIUM
// ---------------------------------------------------------------------
function showToast(message, type = "info") {
    const toast = document.getElementById('adminToast');
    const toastIcon = document.getElementById('adminToastIcon');
    const toastText = document.getElementById('adminToastText');

    // Configura o ícone e cor com base no tipo
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

    // Oculta após 4 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
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

// Helper: Escape HTML contra injeção de script (XSS)
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

// Funções de controle do Lightbox
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
