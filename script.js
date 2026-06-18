/* ==========================================
   FR32SURVIVAL - LOGICAS INTERATIVAS (JS)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar todas as lógicas do site
    setupNavigation();
    setupCountdown();
    setupParticles();
    setupGallery();
    setupRankings();
    setupDiscordStats();
    setupClicker();
});

/* ==========================================
   LÓGICA: NAVEGAÇÃO & MOBILE MENU & CÓPIA DE IP
   ========================================== */
function setupNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileDropdown = document.getElementById('mobileDropdown');

    // Toggle Menu Mobile
    if (mobileMenuBtn && mobileDropdown) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileDropdown.classList.toggle('show');
            const icon = mobileMenuBtn.querySelector('i');
            if (mobileDropdown.classList.contains('show')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!mobileDropdown.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileDropdown.classList.remove('show');
                mobileMenuBtn.querySelector('i').className = 'fa-solid fa-bars';
            }
        });

        // Fechar ao clicar em um link mobile
        mobileDropdown.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileDropdown.classList.remove('show');
                mobileMenuBtn.querySelector('i').className = 'fa-solid fa-bars';
            });
        });
    }

    // Rolagem suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const offsetPosition = targetElement.offsetTop - 90; // offset do cabeçalho
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mapeamento de links ativos ao rolar a página
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });
}

// Lógica Global de Cópia de IP
window.copyIP = function () {
    // Endereço oficial do servidor de Minecraft
    const ip = 'fr32survival.com';

    // Método moderno de área de transferência
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(ip).then(showToast).catch(fallbackCopyIP);
    } else {
        fallbackCopyIP(ip);
    }
};

function fallbackCopyIP(ip) {
    const tempInput = document.createElement("input");
    tempInput.value = ip;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand("copy");
        showToast();
    } catch (err) {
        console.error("Erro ao copiar IP: ", err);
    }
    document.body.removeChild(tempInput);
}

function showToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
}

/* ==========================================
   LÓGICA: CONTAGEM REGRESSIVA (MISTERIOSA)
   ========================================== */
function setupCountdown() {
    // Alvo: 10 de Julho de 2026 às 13:00
    const targetDate = new Date('2026-07-10T13:00:00').getTime();

    function update() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (distance < 0) {
            if (daysEl) daysEl.textContent = '00';
            if (hoursEl) hoursEl.textContent = '00';
            if (minutesEl) minutesEl.textContent = '00';
            if (secondsEl) secondsEl.textContent = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    setInterval(update, 1000);
    update();
}

/* ==========================================
   LÓGICA: CANVAS DE PARTÍCULAS
   ========================================== */
function setupParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.4 + 0.1;
            this.color = Math.random() > 0.5 ? '255, 20, 147' : '139, 0, 255';
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Gerar partículas
    const particleCount = Math.min(80, Math.floor(window.innerWidth / 15));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

/* ==========================================
   LÓGICA: GALERIA E MODAL SLIDESHOW
   ========================================== */
function setupGallery() {
    const modal = document.getElementById('albumModal');
    if (!modal) return;

    const modalImg = document.getElementById('modalImage');
    const closeModalBtn = modal.querySelector('.close-modal');
    const prevBtn = modal.querySelector('.prev-slide');
    const nextBtn = modal.querySelector('.next-slide');
    const counter = modal.querySelector('.slide-counter');

    const albumCards = document.querySelectorAll('.album-card');
    const seasonTabs = document.querySelectorAll('.season-tab');
    const emptyState = document.getElementById('emptyState');
    const emptyStateTitle = document.getElementById('emptyStateTitle');
    const galleryGrid = document.getElementById('galleryGrid');

    let currentAlbumImages = [];
    let currentImageIndex = 0;

    // 1. Capa dinâmica para álbuns de múltiplas fotos
    albumCards.forEach(card => {
        const imagesAttr = card.getAttribute('data-images');
        if (!imagesAttr) return;

        const images = imagesAttr.split(',').map(img => img.trim());
        if (images.length > 1) {
            card.setAttribute('data-multiple-images', 'true');
            let coverIndex = 0;
            const coverImgElement = card.querySelector('.album-cover img');

            setInterval(() => {
                if (card.classList.contains('hidden')) return;
                coverIndex = (coverIndex + 1) % images.length;
                if (coverImgElement) {
                    coverImgElement.style.opacity = '0.3';
                    setTimeout(() => {
                        coverImgElement.src = images[coverIndex];
                        coverImgElement.style.opacity = '1';
                    }, 400);
                }
            }, 5000);
        }
    });

    // 2. Filtragem de Temporadas
    function filterSeason(season) {
        let hasContent = false;

        albumCards.forEach(card => {
            const cardSeason = card.getAttribute('data-season');
            if (cardSeason === season) {
                card.classList.remove('hidden');
                hasContent = true;
            } else {
                card.classList.add('hidden');
            }
        });

        if (hasContent) {
            if (emptyState) emptyState.classList.add('hidden');
            if (galleryGrid) galleryGrid.classList.remove('hidden');
        } else {
            if (galleryGrid) galleryGrid.classList.add('hidden');
            if (emptyState) {
                if (emptyStateTitle) {
                    emptyStateTitle.textContent = `Temporada ${season} Sem Registros`;
                }
                emptyState.classList.remove('hidden');
            }
        }
    }

    // Eventos de clique nas Abas
    seasonTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            seasonTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetSeason = tab.getAttribute('data-target-season');
            if (targetSeason) {
                filterSeason(targetSeason);
            }
        });
    });

    // Iniciar na Temporada 9 padrão
    filterSeason("9");

    // 3. Lógica do Modal
    function showImage(index) {
        if (!currentAlbumImages[index]) return;
        modalImg.src = currentAlbumImages[index];
        if (counter) {
            counter.textContent = `${index + 1} / ${currentAlbumImages.length}`;
        }
    }

    function openModal(card) {
        const imagesAttr = card.getAttribute('data-images');
        if (!imagesAttr) return;

        currentAlbumImages = imagesAttr.split(',').map(img => img.trim());
        currentImageIndex = 0;

        if (currentAlbumImages.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (counter) counter.style.display = 'none';
        } else {
            if (prevBtn) prevBtn.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'flex';
            if (counter) counter.style.display = 'block';
        }

        showImage(currentImageIndex);
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // trava scroll de fundo
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto'; // restaura scroll
    }

    albumCards.forEach(card => {
        card.addEventListener('click', () => openModal(card));
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target === modalImg) {
            closeModal();
        }
    });

    // Navegação Direita/Esquerda
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentAlbumImages.length === 0) return;
            currentImageIndex = (currentImageIndex + 1) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentAlbumImages.length === 0) return;
            currentImageIndex = (currentImageIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });
    }

    // Teclado Acessibilidade
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('show')) return;
        if (e.key === 'ArrowRight' && currentAlbumImages.length > 1) {
            currentImageIndex = (currentImageIndex + 1) % currentAlbumImages.length;
            showImage(currentImageIndex);
        } else if (e.key === 'ArrowLeft' && currentAlbumImages.length > 1) {
            currentImageIndex = (currentImageIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length;
            showImage(currentImageIndex);
        } else if (e.key === 'Escape') {
            closeModal();
        }
    });
}

/* ==========================================
   LÓGICA: RANKINGS DO SERVIDOR (DASHBOARD)
   ========================================== */
function setupRankings() {
    const trackerTabsContainer = document.getElementById('trackerTabs');
    const periodBtns = document.querySelectorAll('.period-btn');
    const podiumContainer = document.getElementById('rankPodium');
    const listContainer = document.getElementById('rankList');
    const loadingState = document.getElementById('rankLoading');
    const emptyState = document.getElementById('rankEmpty');

    if (!trackerTabsContainer) return;

    // Metadados dos Trackers
    const TRACKER_META = {
        minerador: { name: 'Minerador', icon: '⛏️' },
        assassino: { name: 'Assassino', icon: '⚔️' },
        sobrevivente: { name: 'Playtime', icon: '⏱️' },
        pescador: { name: 'Pescador', icon: '🎣' },
        construtor: { name: 'Construtor', icon: '🏗️' },
        domador: { name: 'Domador', icon: '🐾' },
        explorador: { name: 'Explorador', icon: '🗺️' },
        cacador: { name: 'Caçador', icon: '🏹' }
    };

    const API_URL = '/api/ranks';
    let ranksData = null;
    let activeTracker = 'minerador';
    let activePeriod = 'weekly';

    // Gerar botões de trackers dinamicamente
    let trackerTabsHtml = '';
    Object.keys(TRACKER_META).forEach(key => {
        const meta = TRACKER_META[key];
        trackerTabsHtml += `<button class="tracker-tab" data-tracker="${key}">${meta.icon} ${meta.name}</button>`;
    });
    trackerTabsContainer.innerHTML = trackerTabsHtml;

    const trackerTabs = document.querySelectorAll('.tracker-tab');
    if (trackerTabs.length > 0) trackerTabs[0].classList.add('active');

    // Renderizar dados na tela
    function renderActiveRank() {
        podiumContainer.innerHTML = '';
        listContainer.innerHTML = '';

        let entries = [];

        if (ranksData && ranksData[activeTracker]?.[activePeriod]) {
            entries = ranksData[activeTracker][activePeriod];
        }

        // Se não houver dados, oculta os contêineres e exibe o estado vazio
        if (entries.length === 0) {
            podiumContainer.classList.add('hidden');
            listContainer.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        // Se houver dados, garante que os contêineres estejam visíveis e oculta o estado vazio
        podiumContainer.classList.remove('hidden');
        listContainer.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        entries = entries.map(e => ({
            ...e,
            playerDisplayName: e.playerName
        }));

        // 1. Separar o TOP 3 (Pódio)
        const first = entries.find(e => e.position === 1);
        const second = entries.find(e => e.position === 2);
        const third = entries.find(e => e.position === 3);

        let podiumHtml = '';

        // Renderizar 2º Lugar
        if (second) {
            podiumHtml += `
                <div class="podium-item second ${isPlaceholder ? 'placeholder-opacity' : ''}">
                    <div class="avatar-wrapper">
                        <img src="https://mc-heads.net/avatar/${second.playerName}/80" alt="${second.playerDisplayName}" width="80" height="80">
                    </div>
                    <div class="podium-step">
                        <span class="podium-step-number">2</span>
                        <span class="podium-player-name">${second.playerDisplayName}</span>
                        <span class="podium-player-score">${second.formattedScore || second.score}</span>
                    </div>
                </div>
            `;
        }

        // Renderizar 1º Lugar
        if (first) {
            podiumHtml += `
                <div class="podium-item first ${isPlaceholder ? 'placeholder-opacity' : ''}">
                    <div class="avatar-wrapper">
                        <span class="avatar-crown">👑</span>
                        <img src="https://mc-heads.net/avatar/${first.playerName}/96" alt="${first.playerDisplayName}" width="96" height="96">
                    </div>
                    <div class="podium-step">
                        <span class="podium-step-number">1</span>
                        <span class="podium-player-name">${first.playerDisplayName}</span>
                        <span class="podium-player-score">${first.formattedScore || first.score}</span>
                    </div>
                </div>
            `;
        }

        // Renderizar 3º Lugar
        if (third) {
            podiumHtml += `
                <div class="podium-item third ${isPlaceholder ? 'placeholder-opacity' : ''}">
                    <div class="avatar-wrapper">
                        <img src="https://mc-heads.net/avatar/${third.playerName}/80" alt="${third.playerDisplayName}" width="80" height="80">
                    </div>
                    <div class="podium-step">
                        <span class="podium-step-number">3</span>
                        <span class="podium-player-name">${third.playerDisplayName}</span>
                        <span class="podium-player-score">${third.formattedScore || third.score}</span>
                    </div>
                </div>
            `;
        }

        podiumContainer.innerHTML = podiumHtml;

        // 2. Renderizar Posições 4-10 (Lista)
        const listEntries = entries.filter(e => e.position > 3);
        let listHtml = '';
        listEntries.forEach(entry => {
            listHtml += `
                <div class="rank-list-item ${isPlaceholder ? 'placeholder-opacity' : ''}">
                    <span class="item-position">${entry.position}º</span>
                    <img class="item-avatar" src="https://mc-heads.net/avatar/${entry.playerName}/32" alt="${entry.playerDisplayName}" width="38" height="38">
                    <span class="item-name">${entry.playerDisplayName}</span>
                    <span class="item-score">${entry.formattedScore || entry.score}</span>
                </div>
            `;
        });
        listContainer.innerHTML = listHtml;
    }

    async function fetchRanks() {
        if (loadingState) loadingState.classList.remove('hidden');
        podiumContainer.classList.add('hidden');
        listContainer.classList.add('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        try {
            // Tenta obter da API em tempo real
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(API_URL, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('API offline');
            const data = await response.json();
            ranksData = data.ranks;
            console.log("Estatísticas carregadas em tempo real!");

            if (loadingState) loadingState.classList.add('hidden');
            renderActiveRank();
        } catch (error) {
            console.warn("API de Ranks indisponível. Deixando os rankings vazios conforme solicitado.", error);
            ranksData = null;
            if (loadingState) loadingState.classList.add('hidden');
            podiumContainer.classList.add('hidden');
            listContainer.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
        }
    }

    // Ouvintes de Evento nos Trackers
    trackerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            trackerTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeTracker = tab.dataset.tracker;
            renderActiveRank();
        });
    });

    // Ouvintes de Evento nos Períodos
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activePeriod = btn.dataset.targetPeriod;
            renderActiveRank();
        });
    });

    // Carregamento Inicial
    fetchRanks();
}

/* ==========================================
   LÓGICA: CONTADOR DO DISCORD
   ========================================== */
async function setupDiscordStats() {
    const inviteCode = 'MNWtkEzM3B';
    const statsText = document.getElementById('discordStatsText');
    if (!statsText) return;

    try {
        const response = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
        if (!response.ok) throw new Error('API do Discord offline');
        const data = await response.json();

        const members = data.approximate_member_count;
        const online = data.approximate_presence_count;

        const fmt = new Intl.NumberFormat('pt-BR');
        statsText.textContent = `${fmt.format(members)} membros (${fmt.format(online)} online)`;
    } catch (err) {
        console.warn("Erro ao carregar status do Discord:", err);
        statsText.textContent = "Comunidade no Discord";
    }
}

/* ==========================================
   LÓGICA: CLICKER DE DESBLOQUEIO DE CADEADOS
   ========================================== */
const CLICKER_TARGETS = [1000000000, 1000000, 100000];
const CLICKER_LABELS = ['1B', '1M', '100K'];
let globalClicks = [0, 0, 0];
let pendingClicks = [0, 0, 0];

function formatClicks(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2).replace(/\.00$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
}

async function setupClicker() {
    // Inicializar os cliques locais imediatamente na UI
    for (let i = 0; i < 3; i++) {
        globalClicks[i] = getLocalClicks(i);
        updateLockUI(i, globalClicks[i]);
    }

    // Busca inicial do servidor
    await fetchClicks();
    
    // Polling a cada 10 segundos para manter atualizado com outros usuários
    setInterval(fetchClicks, 10000);
}

async function fetchClicks() {
    const promises = [];
    for (let i = 0; i < 3; i++) {
        promises.push((async (index) => {
            try {
                const response = await fetch(`https://api.counterapi.dev/v1/fr32survival_countdown_locks/clicks_${index}/?cb=${Date.now()}`, { cache: 'no-store' });
                if (response.status === 400) {
                    saveLocalClicks(index, 0);
                    if (pendingClicks[index] === 0) {
                        globalClicks[index] = 0;
                        updateLockUI(index, 0);
                    }
                    return;
                }
                if (!response.ok) throw new Error('API offline');
                const data = await response.json();
                if (data && data.count !== undefined) {
                    const serverVal = parseInt(data.count, 10) || 0;
                    saveLocalClicks(index, serverVal);
                    if (pendingClicks[index] === 0) {
                        globalClicks[index] = serverVal;
                        updateLockUI(index, globalClicks[index]);
                    }
                }
            } catch (err) {
                console.warn(`Erro ao carregar cliques do índice ${index} do servidor, usando offline:`, err);
                if (pendingClicks[index] === 0) {
                    globalClicks[index] = getLocalClicks(index);
                    updateLockUI(index, globalClicks[index]);
                }
            }
        })(i));
    }
    await Promise.all(promises);
}

function getLocalClicks(index) {
    try {
        const val = localStorage.getItem(`fr32_clicks_${index}`);
        if (val === null) return 0;
        const num = parseInt(val, 10);
        return isNaN(num) || num < 0 ? 0 : num;
    } catch (e) {
        return 0;
    }
}

function saveLocalClicks(index, val) {
    try {
        localStorage.setItem(`fr32_clicks_${index}`, val);
    } catch (e) {}
}

function updateLockUI(index, clicks) {
    const card = document.getElementById(`card-${index}`);
    const overlay = document.getElementById(`overlay-${index}`);
    const progress = document.getElementById(`progress-${index}`);
    const bar = document.getElementById(`bar-${index}`);
    const target = CLICKER_TARGETS[index];

    if (!card) return;

    if (clicks >= target) {
        card.classList.remove('blurred');
        if (overlay) overlay.style.display = 'none';
    } else {
        card.classList.add('blurred');
        if (overlay) overlay.style.display = 'flex';

        if (progress) {
            progress.textContent = `${formatClicks(clicks)} / ${CLICKER_LABELS[index]}`;
        }
        if (bar) {
            const pct = Math.min(100, (clicks / target) * 100);
            bar.style.width = `${pct}%`;
        }
    }
}

window.clickLock = async function (index, event) {
    const target = CLICKER_TARGETS[index];
    let clicks = globalClicks[index];

    // Regra Sequencial (Direita para Esquerda: Minutos [2] -> Horas [1] -> Dias [0])
    for (let prev = 2; prev > index; prev--) {
        if (globalClicks[prev] < CLICKER_TARGETS[prev]) {
            const prevCard = document.getElementById(`card-${prev}`);
            if (prevCard) {
                prevCard.classList.add('shake');
                setTimeout(() => prevCard.classList.remove('shake'), 250);
            }

            const card = document.getElementById(`card-${index}`);
            if (card) {
                card.classList.add('shake');
                setTimeout(() => card.classList.remove('shake'), 250);
            }

            const toast = document.getElementById('toast');
            if (toast) {
                const textSpan = toast.querySelector('span');
                const oldText = textSpan.textContent;
                const oldIcon = toast.querySelector('.toast-success-icon i').className;

                toast.querySelector('.toast-success-icon i').className = 'fa-solid fa-lock';
                textSpan.textContent = `Desbloqueie o bloco de ${prev === 0 ? 'Dias' : prev === 1 ? 'Horas' : 'Minutos'} primeiro!`;
                toast.classList.add('show');

                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        textSpan.textContent = oldText;
                        toast.querySelector('.toast-success-icon i').className = oldIcon;
                    }, 400);
                }, 2000);
            }
            return;
        }
    }

    if (clicks < target) {
        // Atualização otimista local imediata
        clicks += 1;
        globalClicks[index] = clicks;
        pendingClicks[index] += 1;
        updateLockUI(index, clicks);

        createFloatingPlusOne(event);

        if (clicks >= target) {
            triggerUnlockAnimation(index);
        }

        // Registrar clique no servidor
        try {
            const response = await fetch(`https://api.counterapi.dev/v1/fr32survival_countdown_locks/clicks_${index}/up?cb=${Date.now()}`, { cache: 'no-store' });
            pendingClicks[index] = Math.max(0, pendingClicks[index] - 1);
            if (response.ok) {
                const data = await response.json();
                if (data && data.count !== undefined) {
                    const serverVal = parseInt(data.count, 10) || 0;
                    saveLocalClicks(index, serverVal);
                    globalClicks[index] = serverVal + pendingClicks[index];
                    updateLockUI(index, globalClicks[index]);
                }
            } else {
                const newLocal = getLocalClicks(index) + 1;
                saveLocalClicks(index, newLocal);
                globalClicks[index] = newLocal + pendingClicks[index];
                updateLockUI(index, globalClicks[index]);
            }
        } catch (err) {
            console.warn("Erro ao registrar clique no servidor, salvando localmente:", err);
            pendingClicks[index] = Math.max(0, pendingClicks[index] - 1);
            const newLocal = getLocalClicks(index) + 1;
            saveLocalClicks(index, newLocal);
            globalClicks[index] = newLocal + pendingClicks[index];
            updateLockUI(index, globalClicks[index]);
        }
    }
};

function createFloatingPlusOne(event) {
    const targetCard = event.currentTarget;
    if (!targetCard) return;

    const rect = targetCard.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const floatNum = document.createElement('span');
    floatNum.className = 'click-float-number';
    floatNum.textContent = '+1';
    floatNum.style.left = `${x}px`;
    floatNum.style.top = `${y}px`;

    targetCard.appendChild(floatNum);

    setTimeout(() => {
        floatNum.remove();
    }, 800);
}

function triggerUnlockAnimation(index) {
    const card = document.getElementById(`card-${index}`);
    if (!card) return;

    card.style.boxShadow = '0 0 50px rgba(255, 20, 147, 0.8)';
    setTimeout(() => {
        card.style.boxShadow = '';
    }, 800);

    const overlay = document.getElementById(`overlay-${index}`);
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            updateLockUI(index, CLICKER_TARGETS[index]);
        }, 300);
    }
}
