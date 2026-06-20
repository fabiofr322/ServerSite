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
                    if (pendingClicks[index] === 0) {
                        const localVal = getLocalClicks(index);
                        globalClicks[index] = localVal;
                        updateLockUI(index, localVal);
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

/* ==========================================
   LÓGICA: SUPABASE AUTH & INTERAÇÕES (DINÂMICO)
   ========================================== */

const SUPABASE_URL = 'https://dzfmtmlgbyxnqjdwutfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Zm10bWxnYnl4bnFqZHd1dGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODE1MjcsImV4cCI6MjA5NzU1NzUyN30.8W_0L9OzmLSDH1ZMRtFFlc3Pyf54ENgVNV535TW1T7U';
let supabaseClient = null;
let currentUser = null;
let currentProfile = null;

// Curtidas & Comentários da foto ativa
let currentPhotoLikesCount = 0;
let userHasLikedCurrentPhoto = false;
let activePhotoPath = '';
let likeLock = false;

// Injetar dinamicamente elementos de HTML no DOM
function injectHtmlElements() {
    // 1. Inserir navUserArea na navbar (.nav-actions)
    const navActions = document.querySelector('.nav-actions');
    if (navActions && !document.getElementById('navUserArea')) {
        const userArea = document.createElement('div');
        userArea.id = 'navUserArea';
        userArea.className = 'nav-user-area';
        userArea.innerHTML = `
            <button class="btn-login-nav" onclick="openAuthModal()">
                <i class="fa-regular fa-user"></i>
                <span>Entrar</span>
            </button>
        `;
        navActions.insertBefore(userArea, navActions.firstChild);
    }

    // 2. Inserir mobileUserLi no mobileDropdown
    const mobileDropdown = document.getElementById('mobileDropdown');
    if (mobileDropdown && !document.getElementById('mobileUserLi')) {
        const mobileUserLi = document.createElement('li');
        mobileUserLi.id = 'mobileUserLi';
        mobileUserLi.className = 'mobile-user-li';
        mobileUserLi.innerHTML = `
            <button class="btn-login-nav" onclick="openAuthModal()">
                <i class="fa-regular fa-user"></i> Entrar
            </button>
        `;
        mobileDropdown.appendChild(mobileUserLi);
    }

    // 3. Inserir authModal no body
    if (!document.getElementById('authModal')) {
        const authModal = document.createElement('div');
        authModal.id = 'authModal';
        authModal.className = 'modal auth-modal';
        authModal.innerHTML = `
            <div class="auth-container">
                <span class="close-modal" onclick="closeAuthModal()">&times;</span>
                <div class="auth-header">
                    <button class="auth-tab active" id="tabLogin" onclick="switchAuthTab('login')">Login</button>
                    <button class="auth-tab" id="tabRegister" onclick="switchAuthTab('register')">Registrar</button>
                </div>
                <form id="loginForm" class="auth-form" onsubmit="handleLogin(event)" autocomplete="off">
                    <div class="input-group">
                        <label for="loginEmail">E-mail</label>
                        <input type="email" id="loginEmail" required placeholder="seuemail@exemplo.com" autocomplete="username">
                    </div>
                    <div class="input-group">
                        <label for="loginPassword">Senha</label>
                        <input type="password" id="loginPassword" required placeholder="Digite sua senha" autocomplete="current-password">
                    </div>
                    <button type="submit" class="btn btn-primary btn-auth-submit" id="btnLoginSubmit">
                        Entrar <i class="fa-solid fa-right-to-bracket"></i>
                    </button>
                </form>
                <form id="registerForm" class="auth-form hidden" onsubmit="handleRegister(event)" autocomplete="off">
                    <div class="input-group">
                        <label for="regMinecraft">Nick do Minecraft</label>
                        <input type="text" id="regMinecraft" required minlength="3" placeholder="Seu Nick de jogo" autocomplete="off">
                        <small class="input-hint">Necessário para carregar a skin da sua cabeça.</small>
                    </div>
                    <div class="input-group">
                        <label for="regEmail">E-mail</label>
                        <input type="email" id="regEmail" required placeholder="seuemail@exemplo.com" autocomplete="off">
                    </div>
                    <div class="input-group">
                        <label for="regPassword">Senha</label>
                        <input type="password" id="regPassword" required minlength="6" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
                    </div>
                    <button type="submit" class="btn btn-primary btn-auth-submit" id="btnRegisterSubmit">
                        Criar Conta <i class="fa-solid fa-user-plus"></i>
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(authModal);
    }

    // 4. Reestruturar #albumModal para split view
    const albumModal = document.getElementById('albumModal');
    if (albumModal && !albumModal.querySelector('.modal-wrapper')) {
        const modalImg = document.getElementById('modalImage');
        const prevBtn = albumModal.querySelector('.prev-slide');
        const nextBtn = albumModal.querySelector('.next-slide');
        const counter = albumModal.querySelector('.slide-counter');
        const closeBtn = albumModal.querySelector('.close-modal');

        if (closeBtn) closeBtn.remove();

        const wrapper = document.createElement('div');
        wrapper.className = 'modal-wrapper';

        const imgPanel = document.createElement('div');
        imgPanel.className = 'modal-image-panel';

        const intPanel = document.createElement('div');
        intPanel.className = 'modal-interaction-panel';

        if (modalImg) imgPanel.appendChild(modalImg);
        if (prevBtn) imgPanel.appendChild(prevBtn);
        if (nextBtn) imgPanel.appendChild(nextBtn);
        if (counter) imgPanel.appendChild(counter);

        intPanel.innerHTML = `
            <div class="interaction-header">
                <h3 class="interaction-album-title" id="modalAlbumTitle">Título do Álbum</h3>
                <div class="interaction-album-author" id="modalAlbumAuthor">
                    <img src="https://mc-heads.net/avatar/steve/16" class="album-author-avatar" id="modalAuthorAvatar" alt="Avatar">
                    <span class="album-author-name" id="modalAuthorName">Autor</span>
                </div>
            </div>
            
            <div class="likes-section">
                <button class="btn-like" id="btnLike">
                    <i class="fa-regular fa-heart"></i>
                </button>
                <span class="likes-count" id="likesCount">0 curtidas</span>
            </div>

            <div class="comments-section">
                <h4 class="comments-title"><i class="fa-regular fa-comments"></i> Comentários</h4>
                <div class="comments-list" id="commentsList"></div>
            </div>

            <div class="comment-input-area">
                <div id="commentAuthWarning" class="comment-auth-warning">
                    Faça <span class="auth-link" onclick="openAuthModal()">login</span> para curtir e comentar nesta foto.
                </div>
                <form id="commentForm" class="comment-form hidden" onsubmit="handleCommentSubmit(event)" autocomplete="off">
                    <input type="text" id="commentInput" placeholder="Escreva um comentário..." required autocomplete="off">
                    <button type="submit" class="btn-send-comment">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        `;

        wrapper.appendChild(imgPanel);
        wrapper.appendChild(intPanel);

        albumModal.innerHTML = '';
        albumModal.innerHTML = '<span class="close-modal" id="closeAlbumModalBtn">&times;</span>';
        albumModal.appendChild(wrapper);

        // Re-associar botão fechar original
        const newCloseBtn = document.getElementById('closeAlbumModalBtn');
        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', () => {
                albumModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            });
        }
    }
}

function setupSupabaseAuthAndInteractions() {
    if (!supabaseClient) return;

    // Monitoramento do estado de login
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        currentUser = session?.user || null;
        if (currentUser) {
            try {
                const { data, error } = await supabaseClient
                    .from('profiles')
                    .select('minecraft_username')
                    .eq('id', currentUser.id)
                    .single();
                
                if (!error && data) {
                    currentProfile = data;
                } else {
                    currentProfile = { 
                        minecraft_username: currentUser.user_metadata?.minecraft_username || 'Jogador' 
                    };
                }
            } catch (err) {
                currentProfile = { 
                    minecraft_username: currentUser.user_metadata?.minecraft_username || 'Jogador' 
                };
            }
        } else {
            currentProfile = null;
        }

        updateUserInterface();

        const modal = document.getElementById('albumModal');
        const modalImg = document.getElementById('modalImage');
        if (modal && modal.classList.contains('show') && modalImg && modalImg.src) {
            const photoPath = getRelativePhotoPath(modalImg.src);
            window.loadPhotoInteractions(photoPath);
        }
    });

    // Registrar o click do botão de Like
    const btnLike = document.getElementById('btnLike');
    if (btnLike) {
        btnLike.addEventListener('click', handleLikeToggle);
    }

    // Configurar observador para atualizações na troca de imagens (MutationObserver)
    const modalImg = document.getElementById('modalImage');
    if (modalImg) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    const newSrc = modalImg.src;
                    if (newSrc) {
                        // Descobrir qual é o card ativo para preencher os dados do cabeçalho
                        const relativePath = getRelativePhotoPath(newSrc);
                        const card = Array.from(document.querySelectorAll('.album-card')).find(c => {
                            const imagesAttr = c.getAttribute('data-images') || '';
                            const images = imagesAttr.split(',').map(img => img.trim());
                            return images.some(img => {
                                let p = img;
                                if (p.startsWith('/')) p = p.substring(1);
                                return p === relativePath;
                            });
                        });

                        if (card) {
                            const title = card.querySelector('.album-title')?.textContent || 'Álbum de Construções';
                            const authorName = card.querySelector('.album-author-name')?.textContent || 'Jogador';
                            const authorAvatar = card.querySelector('.album-author-avatar')?.src || 'https://mc-heads.net/avatar/steve/16';

                            const modalTitle = document.getElementById('modalAlbumTitle');
                            const modalAuthorName = document.getElementById('modalAuthorName');
                            const modalAuthorAvatar = document.getElementById('modalAuthorAvatar');

                            if (modalTitle) modalTitle.textContent = title;
                            if (modalAuthorName) modalAuthorName.textContent = authorName;
                            if (modalAuthorAvatar) modalAuthorAvatar.src = authorAvatar;
                        }

                        window.loadPhotoInteractions(newSrc);
                    }
                }
            });
        });
        observer.observe(modalImg, { attributes: true });
    }
}

// Extrai o caminho relativo da imagem (ex: "Images/9_Temporada/Junin_Boss1.png")
function getRelativePhotoPath(absoluteUrl) {
    if (!absoluteUrl) return '';
    try {
        const urlObj = new URL(absoluteUrl);
        let path = urlObj.pathname;
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        return decodeURIComponent(path);
    } catch (e) {
        let path = absoluteUrl;
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        return path;
    }
}

// Atualizar cabeçalho e menu de usuário baseado no estado da sessão
function updateUserInterface() {
    const navUserArea = document.getElementById('navUserArea');
    const mobileUserLi = document.getElementById('mobileUserLi');

    if (!navUserArea) return;

    if (currentUser && currentProfile) {
        const nick = currentProfile.minecraft_username;
        const userHtml = `
            <div class="user-profile-menu">
                <img src="https://mc-heads.net/avatar/${nick}/22" class="nav-user-avatar" alt="Avatar de ${nick}">
                <span class="nav-user-name">${nick}</span>
                <button class="btn-logout-nav" onclick="handleLogout()" title="Sair do painel">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
        navUserArea.innerHTML = userHtml;

        if (mobileUserLi) {
            mobileUserLi.innerHTML = `
                <div class="user-profile-menu">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="https://mc-heads.net/avatar/${nick}/22" class="nav-user-avatar" alt="Avatar">
                        <span class="nav-user-name">${nick}</span>
                    </div>
                    <button class="btn-logout-nav" onclick="handleLogout()">
                        <i class="fa-solid fa-right-from-bracket"></i> Sair
                    </button>
                </div>
            `;
        }
    } else {
        const guestHtml = `
            <button class="btn-login-nav" onclick="openAuthModal()">
                <i class="fa-regular fa-user"></i>
                <span>Entrar</span>
            </button>
        `;
        navUserArea.innerHTML = guestHtml;

        if (mobileUserLi) {
            mobileUserLi.innerHTML = `
                <button class="btn-login-nav" onclick="openAuthModal()">
                    <i class="fa-regular fa-user"></i> Entrar
                </button>
            `;
        }
    }
}

// Modais - Controle de Abertura / Fechamento
function openAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('show');
        document.body.style.overflow = 'hidden'; 
        switchAuthTab('login');
    }
}

function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('show');
        const albumModal = document.getElementById('albumModal');
        if (!albumModal || !albumModal.classList.contains('show')) {
            document.body.style.overflow = 'auto';
        }
        document.getElementById('loginForm')?.reset();
        document.getElementById('registerForm')?.reset();
    }
}

function switchAuthTab(mode) {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (mode === 'login') {
        tabLogin?.classList.add('active');
        tabRegister?.classList.remove('active');
        loginForm?.classList.remove('hidden');
        registerForm?.classList.add('hidden');
    } else {
        tabRegister?.classList.add('active');
        tabLogin?.classList.remove('active');
        registerForm?.classList.remove('hidden');
        loginForm?.classList.add('hidden');
    }
}

// Lógica de Envio de Login
async function handleLogin(event) {
    event.preventDefault();
    if (!supabaseClient) return;

    const emailEl = document.getElementById('loginEmail');
    const passwordEl = document.getElementById('loginPassword');
    const email = emailEl?.value?.trim();
    const password = passwordEl?.value;

    // Limpar campos de login imediatamente por segurança contra inspeção via Console/Inspector
    if (emailEl) emailEl.value = '';
    if (passwordEl) passwordEl.value = '';

    const btnSubmit = document.getElementById('btnLoginSubmit');

    if (!email || !password) return;

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Carregando... <i class="fa-solid fa-spinner fa-spin"></i>';
    }

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        window.showNotification("Bem-vindo de volta!", "fa-solid fa-circle-check");
        closeAuthModal();
    } catch (err) {
        window.showNotification(translateAuthError(err.message), "fa-solid fa-circle-xmark");
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Entrar <i class="fa-solid fa-right-to-bracket"></i>';
        }
    }
}

// Lógica de Envio de Registro
async function handleRegister(event) {
    event.preventDefault();
    if (!supabaseClient) return;

    const minecraftEl = document.getElementById('regMinecraft');
    const emailEl = document.getElementById('regEmail');
    const passwordEl = document.getElementById('regPassword');

    const minecraft = minecraftEl?.value?.trim();
    const email = emailEl?.value?.trim();
    const password = passwordEl?.value;

    // Limpar campos de registro imediatamente por segurança contra inspeção via Console/Inspector
    if (minecraftEl) minecraftEl.value = '';
    if (emailEl) emailEl.value = '';
    if (passwordEl) passwordEl.value = '';

    const btnSubmit = document.getElementById('btnRegisterSubmit');

    if (!minecraft || !email || !password) return;
    if (minecraft.length < 3) {
        window.showNotification("O Nick do Minecraft deve ter pelo menos 3 caracteres.", "fa-solid fa-triangle-exclamation");
        return;
    }

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Registrando... <i class="fa-solid fa-spinner fa-spin"></i>';
    }

    try {
        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    minecraft_username: minecraft
                }
            }
        });
        if (error) throw error;

        window.showNotification("Conta criada com sucesso!", "fa-solid fa-circle-check");
        closeAuthModal();
    } catch (err) {
        window.showNotification(translateAuthError(err.message), "fa-solid fa-circle-xmark");
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Criar Conta <i class="fa-solid fa-user-plus"></i>';
        }
    }
}

// Lógica de Logout
async function handleLogout() {
    if (!supabaseClient) return;
    try {
        await supabaseClient.auth.signOut();
        window.showNotification("Sessão encerrada com sucesso.", "fa-solid fa-circle-info");
    } catch (err) {
        console.error("Erro no logout:", err);
    }
}

window.loadPhotoInteractions = async function (photoPath) {
    if (!supabaseClient) return;

    activePhotoPath = getRelativePhotoPath(photoPath);

    // 1. Carregar contagem de curtidas
    try {
        const { count, error } = await supabaseClient
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('photo_path', activePhotoPath);

        if (!error) {
            currentPhotoLikesCount = count || 0;
            const likesCountEl = document.getElementById('likesCount');
            if (likesCountEl) {
                likesCountEl.textContent = `${currentPhotoLikesCount} ${currentPhotoLikesCount === 1 ? 'curtida' : 'curtidas'}`;
            }
        }

        // 2. Verificar se o usuário logado já curtiu
        userHasLikedCurrentPhoto = false;
        if (currentUser) {
            const { data, error } = await supabaseClient
                .from('likes')
                .select('id')
                .eq('photo_path', activePhotoPath)
                .eq('user_id', currentUser.id)
                .maybeSingle();

            if (!error && data) {
                userHasLikedCurrentPhoto = true;
            }
        }

        // Atualiza ícone do botão
        const btnLike = document.getElementById('btnLike');
        if (btnLike) {
            if (userHasLikedCurrentPhoto) {
                btnLike.classList.add('liked');
                btnLike.innerHTML = '<i class="fa-solid fa-heart"></i>';
            } else {
                btnLike.classList.remove('liked');
                btnLike.innerHTML = '<i class="fa-regular fa-heart"></i>';
            }
        }
    } catch (e) {
        console.error("Erro ao carregar curtidas:", e);
    }

    // 3. Carregar lista de comentários com profiles associados
    try {
        const { data: commentsData, error } = await supabaseClient
            .from('comments')
            .select(`
                id,
                content,
                created_at,
                user_id,
                profiles (
                    minecraft_username
                )
            `)
            .eq('photo_path', activePhotoPath)
            .order('created_at', { ascending: true });

        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.innerHTML = '';
            if (!error && commentsData && commentsData.length > 0) {
                commentsData.forEach(comment => {
                    const username = comment.profiles?.minecraft_username || 'Jogador';
                    const dateText = formatRelativeTime(new Date(comment.created_at));

                    commentsList.innerHTML += `
                        <div class="comment-item">
                            <img src="https://mc-heads.net/avatar/${username}/26" class="comment-avatar" alt="Avatar">
                            <div class="comment-content-block">
                                <div class="comment-header-meta">
                                    <span class="comment-player-name">${username}</span>
                                    <span class="comment-date-time">${dateText}</span>
                                </div>
                                <div class="comment-text">${escapeHTML(comment.content)}</div>
                            </div>
                        </div>
                    `;
                });

                setTimeout(() => {
                    commentsList.scrollTop = commentsList.scrollHeight;
                }, 50);
            } else {
                commentsList.innerHTML = '<div class="comment-empty-message">Nenhum comentário ainda. Seja o primeiro a comentar!</div>';
            }
        }
    } catch (e) {
        console.error("Erro ao buscar comentários:", e);
    }

    // 4. Mostrar/Esconder avisos de autenticação
    const commentForm = document.getElementById('commentForm');
    const commentAuthWarning = document.getElementById('commentAuthWarning');

    if (currentUser) {
        commentForm?.classList.remove('hidden');
        commentAuthWarning?.classList.add('hidden');
    } else {
        commentForm?.classList.add('hidden');
        commentAuthWarning?.classList.remove('hidden');
    }
};

// Curtidas: Alternar clique de Curtir/Descurtir
async function handleLikeToggle() {
    if (!supabaseClient) return;
    if (!currentUser) {
        openAuthModal();
        return;
    }
    if (likeLock) return;
    likeLock = true;

    const btnLike = document.getElementById('btnLike');
    const likesCountEl = document.getElementById('likesCount');

    // Atualização otimista local imediata
    userHasLikedCurrentPhoto = !userHasLikedCurrentPhoto;
    if (userHasLikedCurrentPhoto) {
        currentPhotoLikesCount++;
        btnLike?.classList.add('liked');
        if (btnLike) btnLike.innerHTML = '<i class="fa-solid fa-heart"></i>';
    } else {
        currentPhotoLikesCount = Math.max(0, currentPhotoLikesCount - 1);
        btnLike?.classList.remove('liked');
        if (btnLike) btnLike.innerHTML = '<i class="fa-regular fa-heart"></i>';
    }
    if (likesCountEl) {
        likesCountEl.textContent = `${currentPhotoLikesCount} ${currentPhotoLikesCount === 1 ? 'curtida' : 'curtidas'}`;
    }

    try {
        if (userHasLikedCurrentPhoto) {
            const { error } = await supabaseClient
                .from('likes')
                .insert({ photo_path: activePhotoPath });
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('likes')
                .delete()
                .eq('photo_path', activePhotoPath)
                .eq('user_id', currentUser.id);
            if (error) throw error;
        }
    } catch (err) {
        console.error("Erro ao persistir curtida:", err);
        // Rollback da mudança otimista
        userHasLikedCurrentPhoto = !userHasLikedCurrentPhoto;
        if (userHasLikedCurrentPhoto) {
            currentPhotoLikesCount++;
            btnLike?.classList.add('liked');
            if (btnLike) btnLike.innerHTML = '<i class="fa-solid fa-heart"></i>';
        } else {
            currentPhotoLikesCount = Math.max(0, currentPhotoLikesCount - 1);
            btnLike?.classList.remove('liked');
            if (btnLike) btnLike.innerHTML = '<i class="fa-regular fa-heart"></i>';
        }
        if (likesCountEl) {
            likesCountEl.textContent = `${currentPhotoLikesCount} ${currentPhotoLikesCount === 1 ? 'curtida' : 'curtidas'}`;
        }
        window.showNotification("Não foi possível salvar a curtida.", "fa-solid fa-circle-xmark");
    } finally {
        likeLock = false;
    }
}

// Enviar Comentário
async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!supabaseClient || !currentUser) return;

    const input = document.getElementById('commentInput');
    const content = input?.value?.trim();

    if (!content) return;
    if (input) input.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('comments')
            .insert({
                photo_path: activePhotoPath,
                content: content
            });

        if (error) throw error;
        if (input) input.value = '';

        await window.loadPhotoInteractions(activePhotoPath);
    } catch (err) {
        console.error("Erro ao comentar:", err);
        window.showNotification("Erro ao postar comentário.", "fa-solid fa-circle-xmark");
    } finally {
        if (input) input.disabled = false;
    }
}

// Helper: Escape HTML contra injeção de script (XSS)
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Helper: Formatar data relativa amigável
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return 'agora mesmo';
    } else if (diffMin < 60) {
        return `há ${diffMin} min`;
    } else if (diffHour < 24) {
        return `há ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
    } else if (diffDay < 7) {
        return `há ${diffDay} ${diffDay === 1 ? 'dia' : 'dias'}`;
    } else {
        return date.toLocaleDateString('pt-BR');
    }
}

// Tradução de mensagens comuns de erro do Supabase Auth para português
function translateAuthError(message) {
    if (message.includes("Invalid login credentials")) {
        return "E-mail ou senha incorretos.";
    }
    if (message.includes("User already registered")) {
        return "Este e-mail já está cadastrado.";
    }
    if (message.includes("Password should be at least")) {
        return "A senha deve ter pelo menos 6 caracteres.";
    }
    if (message.includes("Signup requires a valid email")) {
        return "Informe um e-mail válido.";
    }
    return message;
}

// Injetar elementos dinâmicos após carregamento da página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHtmlElements);
} else {
    injectHtmlElements();
}

// Carregar SDK do Supabase dinamicamente se não estiver incluído
(function() {
    if (!window.supabase && !document.querySelector('script[src*="supabase-js"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            if (window.supabase) {
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                setupSupabaseAuthAndInteractions();
            }
        };
        document.head.appendChild(script);
    } else if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setupSupabaseAuthAndInteractions();
    }
})();

// Bind de funções globais chamadas inline no HTML injetado
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.handleCommentSubmit = handleCommentSubmit;
window.showNotification = function(message, iconClass = 'fa-solid fa-check', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const textSpan = toast.querySelector('span');
    const icon = toast.querySelector('.toast-success-icon i');

    if (textSpan) textSpan.textContent = message;
    if (icon) icon.className = iconClass;

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
};
