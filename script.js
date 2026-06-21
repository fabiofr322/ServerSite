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
    // Alvo: 8 de Julho de 2026 às 18:00 (Horário de Brasília, UTC-3)
    const targetDate = new Date('2026-07-08T21:00:00Z').getTime();

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
    setupDynamicGallery();
    loadDynamicVeteranos();
}

async function loadDynamicVeteranos() {
    const grid = document.querySelector('.veterans-grid');
    if (!grid) return;

    try {
        if (!supabaseClient) {
            setTimeout(loadDynamicVeteranos, 100);
            return;
        }

        const { data: veterans, error } = await supabaseClient
            .from('veterans')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (veterans && veterans.length > 0) {
            grid.innerHTML = '';
            veterans.forEach(vet => {
                const username = vet.minecraft_username;
                grid.innerHTML += `
                    <div class="veteran-card">
                        <div class="veteran-glow"></div>
                        <img src="https://mc-heads.net/body/${username}/100" alt="${username}" class="veteran-skin" onerror="this.src='icon/Fr32_Icon.png'">
                        <div class="veteran-info">
                            <span class="veteran-name">${username}</span>
                            <span class="veteran-badge">${escapeHTML(vet.title || 'Veterano')}</span>
                            <span class="veteran-desc">${escapeHTML(vet.description || '')}</span>
                        </div>
                    </div>
                `;
            });
        }
    } catch (err) {
        console.warn("[Mural] Falha ao carregar mural dinâmico, mantendo estático:", err);
    }
}

let cachedAlbums = {};

// Carregar estatísticas de curtidas e comentários para cada card da galeria
async function loadGalleryCardsStats(albums) {
    if (!supabaseClient || !albums) return;

    try {
        const [likesRes, commentsRes] = await Promise.all([
            supabaseClient.from('likes').select('photo_path'),
            supabaseClient.from('comments').select('photo_path')
        ]);

        if (likesRes.error) throw likesRes.error;
        if (commentsRes.error) throw commentsRes.error;

        const likes = likesRes.data || [];
        const comments = commentsRes.data || [];

        const likesMap = {};
        likes.forEach(l => {
            const path = getRelativePhotoPath(l.photo_path);
            likesMap[path] = (likesMap[path] || 0) + 1;
        });

        const commentsMap = {};
        comments.forEach(c => {
            const path = getRelativePhotoPath(c.photo_path);
            commentsMap[path] = (commentsMap[path] || 0) + 1;
        });

        Object.keys(albums).forEach(key => {
            const album = albums[key];
            let albumLikes = 0;
            let albumComments = 0;

            album.images.forEach(img => {
                const path = getRelativePhotoPath(img);
                albumLikes += likesMap[path] || 0;
                albumComments += commentsMap[path] || 0;
            });

            const likesBadge = document.querySelector(`.likes-badge[data-album-key="${escapeHTML(album.title)}"]`);
            const commentsBadge = document.querySelector(`.comments-badge[data-album-key="${escapeHTML(album.title)}"]`);

            if (likesBadge) likesBadge.textContent = albumLikes;
            if (commentsBadge) commentsBadge.textContent = albumComments;
        });
    } catch (err) {
        console.warn("[Gallery Stats] Erro ao carregar estatísticas dos cards:", err);
    }
}

async function setupDynamicGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    const tabsContainer = document.querySelector('.season-tabs');
    const emptyState = document.getElementById('emptyState');
    const emptyStateTitle = document.getElementById('emptyStateTitle');

    if (!galleryGrid) return;

    try {
        if (!supabaseClient) {
            setTimeout(setupDynamicGallery, 100);
            return;
        }

        // Buscar todas as temporadas e suas fotos em paralelo
        const [seasonsRes, photosRes] = await Promise.all([
            supabaseClient.from('seasons').select('*').order('number', { ascending: false }),
            supabaseClient.from('season_photos').select('*, seasons(number)').order('created_at', { ascending: false })
        ]);

        if (seasonsRes.error) throw seasonsRes.error;
        if (photosRes.error) throw photosRes.error;

        const seasons = seasonsRes.data || [];
        const photos = photosRes.data || [];

        if (seasons.length === 0) {
            bindGalleryInteractions();
            return;
        }

        // Renderizar abas de temporada dinamicamente
        if (tabsContainer) {
            tabsContainer.innerHTML = '';
            seasons.forEach((season, idx) => {
                tabsContainer.innerHTML += `
                    <button class="season-tab ${idx === 0 ? 'active' : ''}" data-target-season="${season.number}">Temporada ${season.number}</button>
                `;
            });
        }

        // Agrupar fotos por Álbum (grupo por temporada, título, e autor)
        const albums = {};
        photos.forEach(photo => {
            const seasonNumber = photo.seasons?.number || 9;
            const key = `${seasonNumber}_${photo.title || 'Construção'}_${photo.author_name || 'Jogador'}`;

            if (!albums[key]) {
                albums[key] = {
                    seasonNumber: seasonNumber,
                    title: photo.title || 'Construção',
                    author: photo.author_name || 'Jogador',
                    images: [],
                    created_at: photo.created_at
                };
            }
            albums[key].images.push(photo.photo_path);
        });

        cachedAlbums = albums;

        // Renderizar os cards de álbuns dinamicamente no grid
        galleryGrid.innerHTML = '';
        const albumList = Object.values(albums);

        if (albumList.length > 0) {
            albumList.forEach(album => {
                const imagesAttr = album.images.join(', ');
                const coverImage = album.images[0] || 'icon/Fr32_Icon.png';
                const hasMultiple = album.images.length > 1;

                galleryGrid.innerHTML += `
                    <div class="album-card" data-season="${album.seasonNumber}" data-images="${imagesAttr}">
                        <div class="album-cover">
                            <img src="${coverImage}" alt="Capa do álbum ${escapeHTML(album.title)}">
                            ${hasMultiple ? `
                                <div class="album-icon">
                                    <i class="fa-regular fa-images"></i>
                                </div>
                            ` : ''}
                        </div>
                        <h3 class="album-title">${escapeHTML(album.title)}</h3>
                        <div class="album-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; width: 100%;">
                            <div class="album-author-info" style="margin-top: 0; margin-bottom: 0;">
                                <img class="album-author-avatar" src="https://mc-heads.net/avatar/${album.author}/16" alt="Avatar de ${escapeHTML(album.author)}" onerror="this.src='icon/Fr32_Icon.png'">
                                <span class="album-author-name">${escapeHTML(album.author)}</span>
                            </div>
                            <div class="album-stats" style="display: flex; gap: 8px; font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">
                                <span class="album-stat-likes"><i class="fa-solid fa-heart" style="color: var(--primary); margin-right: 3px;"></i> <span class="likes-badge" data-album-key="${escapeHTML(album.title)}">0</span></span>
                                <span class="album-stat-comments"><i class="fa-solid fa-comment" style="color: var(--secondary); margin-right: 3px;"></i> <span class="comments-badge" data-album-key="${escapeHTML(album.title)}">0</span></span>
                            </div>
                        </div>
                    </div>
                `;
            });

            // Dispara carregamento das estatísticas dos cards em segundo plano
            loadGalleryCardsStats(albums);
        }

        bindGalleryInteractions();

    } catch (err) {
        console.warn("[Galeria] Falha ao carregar galeria dinâmica, mantendo estática:", err);
        bindGalleryInteractions();
    }
}

function bindGalleryInteractions() {
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

            if (card.dataset.intervalId) {
                clearInterval(parseInt(card.dataset.intervalId));
            }

            const intervalId = setInterval(() => {
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

            card.dataset.intervalId = intervalId;
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

    const activeTab = document.querySelector('.season-tab.active');
    const initialSeason = activeTab ? activeTab.getAttribute('data-target-season') : "9";
    filterSeason(initialSeason);

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

        // Preenche imediatamente o título, autor e avatar do álbum no modal
        const titleEl = card.querySelector('.album-title');
        const authorNameEl = card.querySelector('.album-author-name');
        const authorAvatarEl = card.querySelector('.album-author-avatar');

        const modalTitle = document.getElementById('modalAlbumTitle');
        const modalAuthorName = document.getElementById('modalAuthorName');
        const modalAuthorAvatar = document.getElementById('modalAuthorAvatar');

        if (modalTitle && titleEl) modalTitle.textContent = titleEl.textContent;
        if (modalAuthorName && authorNameEl) modalAuthorName.textContent = authorNameEl.textContent;
        if (modalAuthorAvatar && authorAvatarEl) modalAuthorAvatar.src = authorAvatarEl.src;

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
        
        const wrapper = modal.querySelector('.modal-wrapper');
        if (wrapper) {
            wrapper.classList.add('modal-zoom-in');
            setTimeout(() => {
                wrapper.classList.remove('modal-zoom-in');
            }, 350);
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; 
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto'; 
    }

    albumCards.forEach(card => {
        card.addEventListener('click', () => openModal(card));
    });

    if (closeModalBtn) {
        const freshClose = closeModalBtn.cloneNode(true);
        closeModalBtn.parentNode.replaceChild(freshClose, closeModalBtn);
        freshClose.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target === modalImg) {
            closeModal();
        }
    });

    if (nextBtn) {
        const freshNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(freshNext, nextBtn);
        freshNext.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentAlbumImages.length === 0) return;
            currentImageIndex = (currentImageIndex + 1) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });
    }

    if (prevBtn) {
        const freshPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(freshPrev, prevBtn);
        freshPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentAlbumImages.length === 0) return;
            currentImageIndex = (currentImageIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });
    }

    document.onkeydown = (e) => {
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
    };

    // Suporte a scroll do mouse/trackpad para navegar entre álbuns diretamente com animações
    let lastWheelTime = 0;
    const wheelCooldown = 600; // Cooldown ligeiramente maior para acomodar a animação de transição

    modal.addEventListener('wheel', (e) => {
        if (!modal.classList.contains('show')) return;
        
        // Se estiver rolando dentro da seção de comentários, não faz nada (deixa o usuário ler os comentários)
        if (e.target.closest('.modal-interaction-panel')) {
            return;
        }

        e.preventDefault();

        const now = Date.now();
        if (now - lastWheelTime < wheelCooldown) return;

        const direction = e.deltaY > 0 ? 'next' : 'prev';
        lastWheelTime = now;

        navigateToNeighborAlbum(direction);
    }, { passive: false });

    function transitionToAlbum(targetCard, direction) {
        const wrapper = modal.querySelector('.modal-wrapper');
        if (!wrapper) {
            openModal(targetCard);
            return;
        }

        const imagesAttr = targetCard.getAttribute('data-images');
        if (!imagesAttr) return;

        const targetImages = imagesAttr.split(',').map(img => img.trim());
        const firstImageUrl = targetImages[0];

        const exitClass = direction === 'next' ? 'slide-exit-up' : 'slide-exit-down';
        const enterClass = direction === 'next' ? 'slide-enter-up' : 'slide-enter-down';

        // 1. Aplica classe de saída
        wrapper.classList.remove('slide-exit-up', 'slide-exit-down', 'slide-enter-up', 'slide-enter-down');
        wrapper.classList.add(exitClass);

        let imageLoaded = false;
        let animationDone = false;
        let domUpdated = false;

        // Função para atualizar o DOM e começar a animação de entrada
        function proceedToEnter() {
            if (domUpdated) return;
            domUpdated = true;

            currentAlbumImages = targetImages;
            currentImageIndex = 0;

            const titleEl = targetCard.querySelector('.album-title');
            const authorNameEl = targetCard.querySelector('.album-author-name');
            const authorAvatarEl = targetCard.querySelector('.album-author-avatar');

            const modalTitle = document.getElementById('modalAlbumTitle');
            const modalAuthorName = document.getElementById('modalAuthorName');
            const modalAuthorAvatar = document.getElementById('modalAuthorAvatar');

            if (modalTitle && titleEl) modalTitle.textContent = titleEl.textContent;
            if (modalAuthorName && authorNameEl) modalAuthorName.textContent = authorNameEl.textContent;
            if (modalAuthorAvatar && authorAvatarEl) modalAuthorAvatar.src = authorAvatarEl.src;

            if (currentAlbumImages.length <= 1) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                if (counter) counter.style.display = 'none';
            } else {
                if (prevBtn) prevBtn.style.display = 'flex';
                if (nextBtn) nextBtn.style.display = 'flex';
                if (counter) counter.style.display = 'block';
            }

            // Define o source da imagem do modal (já está em cache agora!)
            showImage(currentImageIndex);

            // 3. Aplica classe de entrada
            wrapper.classList.remove(exitClass);
            wrapper.classList.add(enterClass);

            // 4. Limpa as classes temporárias ao concluir a entrada
            setTimeout(() => {
                wrapper.classList.remove(enterClass);
            }, 350);
        }

        // Preload da imagem do novo álbum para evitar piscadas (caching instantâneo)
        const imgPreload = new Image();
        imgPreload.onload = imgPreload.onerror = () => {
            imageLoaded = true;
            if (animationDone) {
                proceedToEnter();
            }
        };
        imgPreload.src = firstImageUrl;

        // Limite máximo de espera (fallback de 1 segundo) para evitar travamento em redes muito lentas
        const fallbackTimeout = setTimeout(() => {
            imageLoaded = true;
            if (animationDone) {
                proceedToEnter();
            }
        }, 1000);

        // Espera a animação de saída de 300ms concluir
        setTimeout(() => {
            animationDone = true;
            if (imageLoaded) {
                clearTimeout(fallbackTimeout);
                proceedToEnter();
            }
        }, 300);
    }

    function navigateToNeighborAlbum(direction) {
        const visibleCards = Array.from(document.querySelectorAll('.album-card:not(.hidden)'));
        if (visibleCards.length === 0) return;

        const currentCard = visibleCards.find(card => {
            const imagesAttr = card.getAttribute('data-images') || '';
            const cardImages = imagesAttr.split(',').map(img => img.trim());
            return cardImages.length === currentAlbumImages.length && 
                   cardImages.every((img, idx) => img === currentAlbumImages[idx]);
        });

        if (!currentCard) return;

        const currentIndex = visibleCards.indexOf(currentCard);
        let targetIndex = -1;

        if (direction === 'next') {
            targetIndex = currentIndex + 1;
            if (targetIndex >= visibleCards.length) {
                targetIndex = 0; // Loop para o primeiro
            }
        } else {
            targetIndex = currentIndex - 1;
            if (targetIndex < 0) {
                targetIndex = visibleCards.length - 1; // Loop para o último
            }
        }

        const targetCard = visibleCards[targetIndex];
        if (targetCard) {
            transitionToAlbum(targetCard, direction);
            window.showNotification("Visualizando álbum " + (direction === 'next' ? 'seguinte' : 'anterior'), "fa-solid fa-images");
        }
    }
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
let isCurrentUserAdmin = false;

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
                        <label for="regMinecraft">Nome no Minecraft</label>
                        <input type="text" id="regMinecraft" required minlength="3" placeholder="Seu Nome de jogo" autocomplete="off">
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

    // 3.5. Inserir settingsModal no body
    if (!document.getElementById('settingsModal')) {
        const settingsModal = document.createElement('div');
        settingsModal.id = 'settingsModal';
        settingsModal.className = 'modal';
        settingsModal.innerHTML = `
            <div class="settings-container">
                <span class="close-modal" onclick="closeSettingsModal()">&times;</span>
                <div class="settings-sidebar">
                    <h3 class="settings-menu-title"><i class="fa-solid fa-gears"></i> Painel</h3>
                    <button class="settings-tab-btn active" onclick="switchSettingsTab('general')">
                        <i class="fa-solid fa-user-gear"></i> Geral
                    </button>
                    <button class="settings-tab-btn" onclick="switchSettingsTab('security')">
                        <i class="fa-solid fa-shield-halved"></i> Segurança
                    </button>
                    <button class="settings-tab-btn" onclick="switchSettingsTab('mfa')">
                        <i class="fa-solid fa-lock"></i> Autenticação 2FA
                    </button>
                </div>
                <div class="settings-content">
                    <!-- Aba Geral -->
                    <div id="settingsTab-general" class="settings-pane">
                        <h4>Informações Gerais</h4>
                        
                        <div class="settings-card">
                            <h5 class="settings-card-title">Alterar Nome no Minecraft</h5>
                            <form id="settingsNickForm" onsubmit="handleNicknameUpdate(event)">
                                <div class="input-group">
                                    <label for="settingsNewNick">Nome no Minecraft</label>
                                    <input type="text" id="settingsNewNick" required minlength="3" placeholder="Seu novo Nick">
                                    <small class="input-hint">Use apenas letras, números e underlines (_). Mínimo 3 caracteres.</small>
                                </div>
                                <button type="submit" class="btn btn-primary" id="btnSettingsNickSubmit">
                                    Alterar Nick <i class="fa-solid fa-user-pen"></i>
                                </button>
                            </form>
                        </div>
                        
                        <div class="settings-card">
                            <h5 class="settings-card-title">Alterar E-mail da Conta</h5>
                            <form id="settingsEmailForm" onsubmit="handleEmailUpdate(event)">
                                <div class="input-group">
                                    <label for="settingsNewEmail">Novo E-mail</label>
                                    <input type="email" id="settingsNewEmail" required placeholder="novoemail@exemplo.com">
                                </div>
                                <div class="input-group">
                                    <label for="settingsEmailPassword">Senha Atual</label>
                                    <input type="password" id="settingsEmailPassword" required placeholder="Confirme sua senha para validar">
                                </div>
                                <div class="input-group hidden" id="emailMfaGroup">
                                    <label for="settingsEmailMfaCode">Autenticação 2FA (Obrigatório)</label>
                                    <input type="text" id="settingsEmailMfaCode" maxlength="6" minlength="6" placeholder="000000" style="text-align: center; font-family: monospace; letter-spacing: 0.2rem;">
                                    <small class="input-hint">Insira o código de 6 dígitos do seu aplicativo Authenticator.</small>
                                </div>
                                <button type="submit" class="btn btn-primary" id="btnSettingsEmailSubmit">
                                    Alterar E-mail <i class="fa-solid fa-envelope"></i>
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Aba Segurança -->
                    <div id="settingsTab-security" class="settings-pane hidden">
                        <h4>Alterar Senha</h4>
                        <div class="settings-card">
                            <form id="settingsPasswordForm" onsubmit="handlePasswordUpdate(event)">
                                <div class="input-group">
                                    <label for="settingsCurrentPassword">Senha Atual</label>
                                    <input type="password" id="settingsCurrentPassword" required placeholder="Digite sua senha atual">
                                </div>
                                <div class="input-group">
                                    <label for="settingsNewPassword">Nova Senha</label>
                                    <input type="password" id="settingsNewPassword" required minlength="6" placeholder="Mínimo 6 caracteres">
                                </div>
                                <div class="input-group">
                                    <label for="settingsConfirmPassword">Confirmar Nova Senha</label>
                                    <input type="password" id="settingsConfirmPassword" required minlength="6" placeholder="Confirme a nova senha">
                                </div>
                                <div class="input-group hidden" id="passwordMfaGroup">
                                    <label for="settingsPasswordMfaCode">Autenticação 2FA (Obrigatório)</label>
                                    <input type="text" id="settingsPasswordMfaCode" maxlength="6" minlength="6" placeholder="000000" style="text-align: center; font-family: monospace; letter-spacing: 0.2rem;">
                                    <small class="input-hint">Insira o código de 6 dígitos do seu aplicativo Authenticator.</small>
                                </div>
                                <button type="submit" class="btn btn-primary" id="btnSettingsPasswordSubmit">
                                    Alterar Senha <i class="fa-solid fa-key"></i>
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Aba 2FA -->
                    <div id="settingsTab-mfa" class="settings-pane hidden">
                        <h4>Autenticação em Duas Etapas (2FA)</h4>
                        <p class="settings-desc">Adicione uma camada extra de segurança exigindo um código do celular ao fazer login.</p>
                        
                        <div id="mfaSetupActive" class="mfa-status-card hidden">
                            <div class="mfa-status-badge mfa-active"><i class="fa-solid fa-circle-check"></i> 2FA Ativo</div>
                            <p>Sua conta está protegida com autenticação em duas etapas por aplicativo gerador (Google Authenticator, Authy, etc).</p>
                            <button type="button" class="btn btn-danger" id="btnDisableMfa" onclick="disableMfa()">
                                Desativar 2FA <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>

                        <div id="mfaSetupInactive" class="mfa-status-card">
                            <div class="mfa-status-badge mfa-inactive"><i class="fa-solid fa-circle-xmark"></i> 2FA Inativo</div>
                            <button type="button" class="btn btn-primary" id="btnStartMfa" onclick="startMfaEnrollment()">
                                Configurar 2FA por Aplicativo <i class="fa-solid fa-qrcode"></i>
                            </button>
                            
                            <div id="mfaVerifyArea" class="mfa-setup-area hidden">
                                <p class="mfa-setup-instructions">1. Escaneie o QR Code abaixo com o autenticador do seu celular (ou insira a chave manual):</p>
                                <div id="mfaQrCodeContainer" class="mfa-qr-container"></div>
                                <div class="mfa-secret-box">
                                    <strong>Chave manual:</strong> <span id="mfaSecretText"></span>
                                </div>
                                <p class="mfa-setup-instructions">2. Insira o código de 6 dígitos gerado pelo aplicativo para confirmar a ativação:</p>
                                <form id="mfaConfirmForm" onsubmit="verifyMfaEnrollment(event)">
                                    <div class="input-group">
                                        <input type="text" id="settingsMfaCode" required maxlength="6" minlength="6" placeholder="000000" style="text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; font-family: monospace;">
                                    </div>
                                    <button type="submit" class="btn btn-success" id="btnVerifyMfa">
                                        Confirmar Ativação <i class="fa-solid fa-shield-check"></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(settingsModal);
    }

    // 3.6. Inserir mfaLoginModal no body (Desafio 2FA no login)
    if (!document.getElementById('mfaLoginModal')) {
        const mfaLoginModal = document.createElement('div');
        mfaLoginModal.id = 'mfaLoginModal';
        mfaLoginModal.className = 'modal';
        mfaLoginModal.innerHTML = `
            <div class="auth-container" style="max-width: 400px; text-align: center;">
                <span class="close-modal" onclick="closeMfaLoginModal()">&times;</span>
                <div style="font-size: 3rem; color: var(--primary); margin-bottom: 1.2rem;">
                    <i class="fa-solid fa-shield-halved"></i>
                </div>
                <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff;">Autenticação 2FA</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.4; margin-bottom: 1.5rem;">
                    Insira o código de 6 dígitos gerado pelo aplicativo autenticador do seu celular.
                </p>
                <form id="mfaLoginForm" onsubmit="handleMfaLogin(event)">
                    <div class="input-group">
                        <input type="text" id="loginMfaCode" required maxlength="6" minlength="6" placeholder="000000" style="text-align: center; font-size: 1.8rem; letter-spacing: 0.5rem; border-color: var(--primary); font-family: monospace;">
                    </div>
                    <button type="submit" class="btn btn-primary btn-auth-submit" id="btnMfaLoginSubmit" style="width: 100%;">
                        Confirmar Código <i class="fa-solid fa-lock-open"></i>
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(mfaLoginModal);
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

    // Restaurar sessão existente ao carregar a página (persiste login após reload)
    supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
        currentUser = session?.user || null;
        if (currentUser) {
            currentProfile = {
                minecraft_username: currentUser.user_metadata?.minecraft_username || 'Jogador'
            };
            isCurrentUserAdmin = false;

            try {
                // Busca em paralelo perfil e permissões
                const [profileRes, permRes] = await Promise.all([
                    supabaseClient.from('profiles').select('minecraft_username').eq('id', currentUser.id).single(),
                    supabaseClient.from('user_permissions').select('role').eq('user_id', currentUser.id).maybeSingle()
                ]);

                if (profileRes.data) currentProfile = profileRes.data;
                if (permRes.data) isCurrentUserAdmin = true;
            } catch (err) {
                console.warn("Erro ao restaurar sessão:", err);
            }
            updateUserInterface();
        } else {
            currentProfile = null;
            isCurrentUserAdmin = false;
            updateUserInterface();
        }
    });

    // CORREÇÃO CRÍTICA do deadlock do Supabase v2:
    // O callback onAuthStateChange NÃO pode ser async nem fazer await diretamente.
    // O Supabase bloqueia internamente o signInWithPassword até o callback retornar.
    // Se o callback faz await, ele nunca retorna → signInWithPassword nunca resolve → tela trava.
    // Solução: callback síncrono + todo trabalho assíncrono dentro de setTimeout(async, 0).
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const user = session?.user || null;
        currentUser = user;

        if (!user) {
            // Logout: limpar perfil, cargo e atualizar UI na próxima iteração do event loop
            currentProfile = null;
            isCurrentUserAdmin = false;
            setTimeout(() => { updateUserInterface(); }, 0);
            return;
        }

        // Usar metadados já disponíveis como fallback imediato (sem await)
        currentProfile = {
            minecraft_username: user.user_metadata?.minecraft_username || 'Jogador'
        };

        // Buscar perfil completo de forma assíncrona SEM bloquear o callback
        setTimeout(async () => {
            isCurrentUserAdmin = false;
            try {
                const [profileRes, permRes] = await Promise.all([
                    supabaseClient.from('profiles').select('minecraft_username').eq('id', user.id).single(),
                    supabaseClient.from('user_permissions').select('role').eq('user_id', user.id).maybeSingle()
                ]);

                if (!profileRes.error && profileRes.data) {
                    currentProfile = profileRes.data;
                }
                if (!permRes.error && permRes.data) {
                    isCurrentUserAdmin = true;
                }
            } catch (_) { /* mantém fallback dos metadados */ }

            updateUserInterface();

            const modal = document.getElementById('albumModal');
            const modalImg = document.getElementById('modalImage');
            if (modal && modal.classList.contains('show') && modalImg && modalImg.src) {
                const photoPath = getRelativePhotoPath(modalImg.src);
                window.loadPhotoInteractions(photoPath);
            }
        }, 0);
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
                                const cleanImg = decodeURIComponent(img.startsWith('/') ? img.substring(1) : img);
                                const cleanPath = decodeURIComponent(relativePath.startsWith('/') ? relativePath.substring(1) : relativePath);
                                return cleanImg === cleanPath || cleanImg.endsWith(cleanPath) || cleanPath.endsWith(cleanImg);
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

// Extrai o caminho relativo da imagem se for local ou mantém absoluta se for externa (Supabase)
function getRelativePhotoPath(absoluteUrl) {
    if (!absoluteUrl) return '';
    try {
        const urlObj = new URL(absoluteUrl);
        // Se a imagem for do mesmo host/servidor do site, retorna o caminho relativo
        if (urlObj.host === window.location.host) {
            let path = urlObj.pathname;
            if (path.startsWith('/')) {
                path = path.substring(1);
            }
            return decodeURIComponent(path);
        }
        // Se for externa (ex: bucket do Supabase), retorna a URL completa
        return absoluteUrl;
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
        
        let adminBtnHtml = '';
        if (isCurrentUserAdmin) {
            adminBtnHtml = `
                <a href="admin/index.html" class="btn-admin-nav" title="Painel de Administração" target="_self" style="margin-right: 10px; color: var(--primary); display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(255, 20, 147, 0.1); border: 1px solid rgba(255, 20, 147, 0.35); transition: all 0.3s ease; box-shadow: 0 0 8px rgba(255, 20, 147, 0.2);">
                    <i class="fa-solid fa-user-shield" style="font-size: 0.9rem;"></i>
                </a>
            `;
        }

        const userHtml = `
            <div class="user-profile-menu">
                ${adminBtnHtml}
                <button onclick="openSettingsModal()" class="btn-settings-nav" title="Configurações da Conta" style="margin-right: 10px; color: var(--secondary); display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(139, 0, 255, 0.1); border: 1px solid rgba(139, 0, 255, 0.35); transition: all 0.3s ease; box-shadow: 0 0 8px rgba(139, 0, 255, 0.2); cursor: pointer;">
                    <i class="fa-solid fa-gear" style="font-size: 0.95rem;"></i>
                </button>
                <img src="https://mc-heads.net/avatar/${nick}/22" class="nav-user-avatar" alt="Avatar de ${nick}">
                <span class="nav-user-name">${nick}</span>
                <button class="btn-logout-nav" onclick="handleLogout()" title="Sair do painel">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
        navUserArea.innerHTML = userHtml;

        if (mobileUserLi) {
            let mobileAdminHtml = '';
            if (isCurrentUserAdmin) {
                mobileAdminHtml = `
                    <div style="text-align: center; margin-bottom: 0.5rem; width: 100%;">
                        <a href="admin/index.html" class="btn-admin-nav-mobile" target="_self" style="display: inline-flex; align-items: center; gap: 8px; color: var(--primary); font-weight: 800; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; padding: 6px 16px; border-radius: 20px; background: rgba(255, 20, 147, 0.1); border: 1px solid rgba(255, 20, 147, 0.3);">
                            <i class="fa-solid fa-user-shield"></i> Painel Admin
                        </a>
                    </div>
                `;
            }

            mobileUserLi.innerHTML = `
                <div class="user-profile-menu" style="flex-direction: column; gap: 10px; align-items: center;">
                    ${mobileAdminHtml}
                    <div style="text-align: center; margin-bottom: 0.5rem; width: 100%;">
                        <button class="btn-settings-nav-mobile" onclick="openSettingsModal()" style="display: inline-flex; align-items: center; gap: 8px; color: var(--secondary); font-weight: 800; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; padding: 6px 16px; border-radius: 20px; background: rgba(139, 0, 255, 0.1); border: 1px solid rgba(139, 0, 255, 0.3); cursor: pointer; width: auto; border: 1px solid rgba(139, 0, 255, 0.3);">
                            <i class="fa-solid fa-gear"></i> Configurações
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="https://mc-heads.net/avatar/${nick}/22" class="nav-user-avatar" alt="Avatar">
                        <span class="nav-user-name">${nick}</span>
                    </div>
                    <button class="btn-logout-nav" onclick="handleLogout()" style="width: 100%; justify-content: center;">
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

// Exibir mensagem de erro diretamente no formulário de autenticação
function showAuthError(formId, message) {
    // Remover erro anterior
    const oldError = document.getElementById('authErrorMsg');
    if (oldError) oldError.remove();

    const form = document.getElementById(formId);
    if (!form) return;

    const errorDiv = document.createElement('div');
    errorDiv.id = 'authErrorMsg';
    errorDiv.style.cssText = 'background:#ff4444;color:#fff;padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:13px;text-align:center;';
    errorDiv.textContent = message;

    form.insertBefore(errorDiv, form.firstChild);
    setTimeout(() => { if (errorDiv.parentNode) errorDiv.remove(); }, 6000);
}

// Obter mensagem de erro legível de qualquer objeto de erro do Supabase
function getErrorMessage(err) {
    if (!err) return 'Erro desconhecido.';
    const msg = err.message || err.error_description || err.msg || String(err);
    return translateAuthError(msg);
}

// Lógica de Envio de Login
async function handleLogin(event) {
    event.preventDefault();

    const btnSubmit = document.getElementById('btnLoginSubmit');

    // Supabase ainda não carregou — mostrar erro sem travar o botão
    if (!supabaseClient) {
        window.showNotification("Aguarde, conectando ao servidor...", "fa-solid fa-spinner");
        return;
    }

    const emailEl = document.getElementById('loginEmail');
    const passwordEl = document.getElementById('loginPassword');
    const email = emailEl?.value?.trim();
    const password = passwordEl?.value;

    if (!email || !password) {
        window.showNotification("Preencha e-mail e senha.", "fa-solid fa-triangle-exclamation");
        return;
    }

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Carregando... <i class="fa-solid fa-spinner fa-spin"></i>';
    }

    // Segurança: liberar botão após 12s para não travar a UI caso haja falha silenciosa
    const safetyTimer = setTimeout(() => {
        const btn = document.getElementById('btnLoginSubmit');
        if (btn && btn.disabled) {
            btn.disabled = false;
            btn.innerHTML = 'Entrar <i class="fa-solid fa-right-to-bracket"></i>';
        }
    }, 12000);

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Limpar campos após login bem-sucedido (segurança contra inspeção)
        if (emailEl) emailEl.value = '';
        if (passwordEl) passwordEl.value = '';

        // 3. Verificar se MFA é exigido para esta conta
        const { data: mfaData, error: mfaError } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!mfaError && mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
            // Esconde modal de login padrão e abre o modal de código MFA
            closeAuthModal();
            openMfaLoginModal();
            return;
        }

        window.showNotification("Bem-vindo de volta!", "fa-solid fa-circle-check");
        closeAuthModal();
    } catch (err) {
        const msg = getErrorMessage(err);
        showAuthError('loginForm', msg);
        window.showNotification(msg, "fa-solid fa-circle-xmark");
    } finally {
        clearTimeout(safetyTimer);
        const btn = document.getElementById('btnLoginSubmit');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Entrar <i class="fa-solid fa-right-to-bracket"></i>';
        }
    }
}

// Lógica de Envio de Registro
async function handleRegister(event) {
    event.preventDefault();

    const btnSubmit = document.getElementById('btnRegisterSubmit');

    // Supabase ainda não carregou — mostrar erro sem travar o botão
    if (!supabaseClient) {
        window.showNotification("Aguarde, conectando ao servidor...", "fa-solid fa-spinner");
        return;
    }

    const minecraftEl = document.getElementById('regMinecraft');
    const emailEl = document.getElementById('regEmail');
    const passwordEl = document.getElementById('regPassword');

    const minecraft = minecraftEl?.value?.trim();
    const email = emailEl?.value?.trim();
    const password = passwordEl?.value;

    if (!minecraft || !email || !password) {
        window.showNotification("Preencha todos os campos.", "fa-solid fa-triangle-exclamation");
        return;
    }
    if (minecraft.length < 3) {
        window.showNotification("O Nick do Minecraft deve ter pelo menos 3 caracteres.", "fa-solid fa-triangle-exclamation");
        return;
    }

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Registrando... <i class="fa-solid fa-spinner fa-spin"></i>';
    }

    // Segurança: liberar botão após 12s para não travar a UI caso haja falha silenciosa
    const safetyTimer = setTimeout(() => {
        const btn = document.getElementById('btnRegisterSubmit');
        if (btn && btn.disabled) {
            btn.disabled = false;
            btn.innerHTML = 'Criar Conta <i class="fa-solid fa-user-plus"></i>';
        }
    }, 12000);

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

        // Limpar campos após registro bem-sucedido (segurança contra inspeção)
        if (minecraftEl) minecraftEl.value = '';
        if (emailEl) emailEl.value = '';
        if (passwordEl) passwordEl.value = '';

        window.showNotification("Conta criada com sucesso! Faça login.", "fa-solid fa-circle-check");
        closeAuthModal();
        // Abrir automaticamente o modal de login após registro
        setTimeout(() => {
            openAuthModal();
            switchAuthTab('login');
        }, 500);
    } catch (err) {
        window.showNotification(translateAuthError(err.message), "fa-solid fa-circle-xmark");
    } finally {
        clearTimeout(safetyTimer);
        const btn = document.getElementById('btnRegisterSubmit');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Criar Conta <i class="fa-solid fa-user-plus"></i>';
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

// Lógica de Alteração de E-mail (Configurações de Perfil)
async function handleEmailUpdate(event) {
    event.preventDefault();

    if (!supabaseClient || !currentUser) {
        window.showNotification("Você precisa estar logado para alterar o e-mail.", "fa-solid fa-triangle-exclamation");
        return;
    }

    const emailInput = document.getElementById('settingsNewEmail');
    const passwordInput = document.getElementById('settingsEmailPassword');
    const mfaCodeInput = document.getElementById('settingsEmailMfaCode');
    const newEmail = emailInput?.value?.trim();
    const currentPassword = passwordInput?.value;

    if (!newEmail || !currentPassword) {
        window.showNotification("Preencha o novo e-mail e a senha atual.", "fa-solid fa-triangle-exclamation");
        return;
    }

    const btnSubmit = document.getElementById('btnSettingsEmailSubmit');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Processando... <i class="fa-solid fa-spinner fa-spin"></i>';
    }

    try {
        // 1. Reautenticação segura antes de iniciar o processo
        const { error: reauthError } = await supabaseClient.auth.signInWithPassword({
            email: currentUser.email,
            password: currentPassword
        });

        if (reauthError) {
            throw new Error("Senha atual incorreta. A alteração foi recusada por segurança.");
        }

        // 2. Se o usuário tem 2FA ativo, verificar o código do Authenticator
        const isMfaActive = await checkMfaStatus();
        if (isMfaActive) {
            const mfaCode = mfaCodeInput?.value?.trim();
            if (!mfaCode || mfaCode.length !== 6 || isNaN(mfaCode)) {
                throw new Error("Insira o código de 6 dígitos do seu Authenticator para confirmar a alteração.");
            }

            // Buscar o fator verificado da conta
            const { data: factorsData, error: listError } = await supabaseClient.auth.mfa.listFactors();
            if (listError) throw listError;

            const activeFactor = factorsData?.all?.find(f => f.status === 'verified');
            if (!activeFactor) throw new Error("Nenhum fator 2FA encontrado na conta.");

            // Criar desafio e verificar o código
            const { data: challengeData, error: challengeError } = await supabaseClient.auth.mfa.challenge({ factorId: activeFactor.id });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabaseClient.auth.mfa.verify({
                factorId: activeFactor.id,
                challengeId: challengeData.id,
                code: mfaCode
            });
            if (verifyError) throw new Error("Código 2FA incorreto. A alteração foi recusada.");
        }

        // 3. Chamar API do Supabase para atualizar o e-mail
        const { error: updateError } = await supabaseClient.auth.updateUser({ email: newEmail });
        if (updateError) throw updateError;

        // Limpar inputs de segurança
        if (passwordInput) passwordInput.value = '';
        if (emailInput) emailInput.value = '';
        if (mfaCodeInput) mfaCodeInput.value = '';

        window.showNotification("Verifique ambos os e-mails para confirmar a alteração!", "fa-solid fa-envelope-circle-check");
    } catch (err) {
        const msg = err.message || getErrorMessage(err);
        window.showNotification(msg, "fa-solid fa-circle-xmark");
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Alterar E-mail <i class="fa-solid fa-envelope"></i>';
        }
    }
}

window.handleEmailUpdate = handleEmailUpdate;

// Lógica de Alteração de Senha (Configurações de Perfil)
async function handlePasswordUpdate(event) {
    event.preventDefault();

    if (!supabaseClient || !currentUser) {
        window.showNotification("Você precisa estar logado para alterar a senha.", "fa-solid fa-triangle-exclamation");
        return;
    }

    const currentPasswordInput = document.getElementById('settingsCurrentPassword');
    const newPasswordInput = document.getElementById('settingsNewPassword');
    const confirmPasswordInput = document.getElementById('settingsConfirmPassword');
    const mfaCodeInput = document.getElementById('settingsPasswordMfaCode');

    const currentPassword = currentPasswordInput?.value;
    const newPassword = newPasswordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        window.showNotification("Preencha todos os campos de senha.", "fa-solid fa-triangle-exclamation");
        return;
    }

    // Validação de força mínima no frontend
    if (newPassword.length < 6) {
        window.showNotification("A nova senha deve ter no mínimo 6 caracteres.", "fa-solid fa-triangle-exclamation");
        return;
    }
    if (newPassword === currentPassword) {
        window.showNotification("A nova senha deve ser diferente da senha atual.", "fa-solid fa-triangle-exclamation");
        return;
    }
    if (newPassword !== confirmPassword) {
        window.showNotification("As novas senhas não coincidem.", "fa-solid fa-triangle-exclamation");
        return;
    }

    const btnSubmit = document.getElementById('btnSettingsPasswordSubmit');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Processando... <i class="fa-solid fa-spinner fa-spin"></i>';
    }

    try {
        // 1. Reautenticação segura com a senha atual
        const { error: reauthError } = await supabaseClient.auth.signInWithPassword({
            email: currentUser.email,
            password: currentPassword
        });

        if (reauthError) {
            throw new Error("Senha atual incorreta. A alteração foi recusada por segurança.");
        }

        // 2. Se o usuário tem 2FA ativo, verificar o código do Authenticator
        const isMfaActive = await checkMfaStatus();
        if (isMfaActive) {
            const mfaCode = mfaCodeInput?.value?.trim();
            if (!mfaCode || mfaCode.length !== 6 || isNaN(mfaCode)) {
                throw new Error("Insira o código de 6 dígitos do seu Authenticator para confirmar a alteração.");
            }

            // Buscar o fator verificado da conta
            const { data: factorsData, error: listError } = await supabaseClient.auth.mfa.listFactors();
            if (listError) throw listError;

            const activeFactor = factorsData?.all?.find(f => f.status === 'verified');
            if (!activeFactor) throw new Error("Nenhum fator 2FA encontrado na conta.");

            // Criar desafio e verificar o código
            const { data: challengeData, error: challengeError } = await supabaseClient.auth.mfa.challenge({ factorId: activeFactor.id });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabaseClient.auth.mfa.verify({
                factorId: activeFactor.id,
                challengeId: challengeData.id,
                code: mfaCode
            });
            if (verifyError) throw new Error("Código 2FA incorreto. A alteração foi recusada.");
        }

        // 3. Chamar a API do Supabase para atualizar a senha
        const { error: updateError } = await supabaseClient.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;

        // Limpar inputs de segurança
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        if (mfaCodeInput) mfaCodeInput.value = '';

        window.showNotification("Senha alterada com sucesso!", "fa-solid fa-circle-check");
    } catch (err) {
        const msg = err.message || getErrorMessage(err);
        window.showNotification(msg, "fa-solid fa-circle-xmark");
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Alterar Senha <i class="fa-solid fa-key"></i>';
        }
    }
}

window.handlePasswordUpdate = handlePasswordUpdate;

// Lógica de Alteração de Nick (Configurações de Perfil)
async function handleNicknameUpdate(event) {
    event.preventDefault();

    if (!supabaseClient || !currentUser || !currentProfile) {
        window.showNotification("Você precisa estar logado para alterar o nick.", "fa-solid fa-triangle-exclamation");
        return;
    }

    const nickInput = document.getElementById('settingsNewNick');
    const newNick = nickInput?.value?.trim();

    if (!newNick) {
        window.showNotification("Preencha o novo Nick.", "fa-solid fa-triangle-exclamation");
        return;
    }

    if (newNick === currentProfile.minecraft_username) {
        window.showNotification("O novo Nick é idêntico ao Nick atual.", "fa-solid fa-triangle-exclamation");
        return;
    }

    // Validação de formato de Nick do Minecraft
    const nickRegex = /^[a-zA-Z0-9_]{3,16}$/;
    if (!nickRegex.test(newNick)) {
        window.showNotification("Nick inválido! Use de 3 a 16 caracteres, contendo apenas letras, números e underline (_).", "fa-solid fa-triangle-exclamation");
        return;
    }

    const btnSubmit = document.getElementById('btnSettingsNickSubmit');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Processando... <i class="fa-solid fa-spinner fa-spin"></i>';
    }

    try {
        // Atualizar o nick na tabela profiles
        const { error } = await supabaseClient
            .from('profiles')
            .update({ minecraft_username: newNick })
            .eq('id', currentUser.id);

        if (error) {
            // Tratar erro de restrição única (nick em uso)
            if (error.code === '23505') {
                throw new Error("Este Nick do Minecraft já está em uso por outro jogador.");
            }
            throw error;
        }

        // Atualizar o estado da sessão local
        currentProfile.minecraft_username = newNick;
        updateUserInterface();

        window.showNotification("Nick do Minecraft atualizado com sucesso!", "fa-solid fa-circle-check");
    } catch (err) {
        const msg = getErrorMessage(err);
        window.showNotification(msg, "fa-solid fa-circle-xmark");
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Alterar Nick <i class="fa-solid fa-user-pen"></i>';
        }
    }
}

window.handleNicknameUpdate = handleNicknameUpdate;


// ==========================================
// LÓGICA: AUTENTICAÇÃO EM DUAS ETAPAS (2FA/MFA TOTP)
// ==========================================
let currentEnrollmentFactorId = null;

// Verifica se o usuário logado possui MFA ativo
async function checkMfaStatus() {
    if (!supabaseClient || !currentUser) return false;
    try {
        const { data, error } = await supabaseClient.auth.mfa.listFactors();
        if (error) throw error;
        
        const activeFactor = data?.all?.find(f => f.status === 'verified');
        return !!activeFactor;
    } catch (e) {
        console.error("Erro ao verificar status MFA:", e);
        return false;
    }
}

// Inicia o processo de cadastro de um gerador de código
async function startMfaEnrollment() {
    if (!supabaseClient || !currentUser) return;

    const btnStart = document.getElementById('btnStartMfa');
    const qrContainer = document.getElementById('mfaQrCodeContainer');
    const secretText = document.getElementById('mfaSecretText');
    const verifyArea = document.getElementById('mfaVerifyArea');

    if (btnStart) btnStart.disabled = true;

    try {
        // 1. Limpar qualquer fator "unverified" pendente anterior para começar do zero
        const { data: factorsData, error: listError } = await supabaseClient.auth.mfa.listFactors();
        if (!listError && factorsData) {
            const allFactors = factorsData.all || factorsData.totp || [];
            const unverifiedFactors = allFactors.filter(f => f.status === 'unverified');
            for (const factor of unverifiedFactors) {
                await supabaseClient.auth.mfa.unenroll({ factorId: factor.id });
            }
        }

        // 2. Criar novo fator TOTP
        const { data, error } = await supabaseClient.auth.mfa.enroll({
            factorType: 'totp',
            issuer: 'FR32SURVIVAL',
            friendlyName: currentUser.email
        });

        if (error) throw error;

        currentEnrollmentFactorId = data.id;

        // Renderizar QR Code usando QRCode.js — gera o código 100% no navegador
        // sem chamadas a APIs externas que podem estar bloqueadas ou descontinuadas
        if (qrContainer && data.totp?.uri) {
            qrContainer.innerHTML = ''; // Limpar qualquer conteúdo anterior
            new QRCode(qrContainer, {
                text: data.totp.uri,
                width: 200,
                height: 200,
                colorDark: '#000000',   // Módulos (quadradinhos) pretos
                colorLight: '#ffffff',  // Fundo branco — garante máximo contraste
                correctLevel: QRCode.CorrectLevel.M
            });
        }

        // Exibir chave secreta por extenso como alternativa
        if (secretText && data.totp?.secret) {
            secretText.textContent = data.totp.secret;
        }

        // Exibir a seção de verificação
        if (verifyArea) verifyArea.classList.remove('hidden');
        if (btnStart) btnStart.style.display = 'none';

        window.showNotification("Fator MFA criado! Escaneie o QR Code no seu aplicativo.", "fa-solid fa-qrcode");
    } catch (err) {
        window.showNotification(getErrorMessage(err), "fa-solid fa-circle-xmark");
        if (btnStart) btnStart.disabled = false;
    }
}

// Confirma o código do QR Code para ativar o MFA na conta
async function verifyMfaEnrollment(event) {
    event.preventDefault();

    if (!supabaseClient || !currentEnrollmentFactorId) return;

    const codeInput = document.getElementById('settingsMfaCode');
    const code = codeInput?.value?.trim();

    if (!code || code.length !== 6 || isNaN(code)) {
        window.showNotification("Insira um código de 6 dígitos numéricos.", "fa-solid fa-triangle-exclamation");
        return;
    }

    const btnVerify = document.getElementById('btnVerifyMfa');
    if (btnVerify) btnVerify.disabled = true;

    try {
        // Criar desafio com o ID do fator pendente
        const { data: challengeData, error: challengeError } = await supabaseClient.auth.mfa.challenge({
            factorId: currentEnrollmentFactorId
        });

        if (challengeError) throw challengeError;

        // Confirmar resposta
        const { error: verifyError } = await supabaseClient.auth.mfa.verify({
            factorId: currentEnrollmentFactorId,
            challengeId: challengeData.id,
            code: code
        });

        if (verifyError) throw verifyError;

        // Resetar interface de configuração de MFA
        currentEnrollmentFactorId = null;
        if (codeInput) codeInput.value = '';
        
        // Atualizar abas/informações do modal de perfil
        if (window.loadProfileSettings) window.loadProfileSettings();

        window.showNotification("Autenticação em Duas Etapas ATIVADA com sucesso!", "fa-solid fa-shield-halved");
    } catch (err) {
        window.showNotification(getErrorMessage(err), "fa-solid fa-circle-xmark");
    } finally {
        if (btnVerify) btnVerify.disabled = false;
    }
}

// Desativa a autenticação de duas etapas
async function disableMfa() {
    if (!supabaseClient || !currentUser) return;

    // Confirmação de segurança amigável
    if (!confirm("Tem certeza que deseja desativar a Autenticação de Duas Etapas? Sua conta ficará menos protegida.")) {
        return;
    }

    const btnDisable = document.getElementById('btnDisableMfa');
    if (btnDisable) btnDisable.disabled = true;

    try {
        // Listar todos os fatores verificados
        const { data: factorsData, error: listError } = await supabaseClient.auth.mfa.listFactors();
        if (listError) throw listError;

        const verifiedFactor = factorsData?.all?.find(f => f.status === 'verified');
        if (!verifiedFactor) {
            throw new Error("Nenhum fator MFA ativo encontrado.");
        }

        // Remover fator
        const { error: unenrollError } = await supabaseClient.auth.mfa.unenroll({
            factorId: verifiedFactor.id
        });

        if (unenrollError) throw unenrollError;

        if (window.loadProfileSettings) window.loadProfileSettings();

        window.showNotification("Autenticação em Duas Etapas desativada.", "fa-solid fa-circle-info");
    } catch (err) {
        window.showNotification(getErrorMessage(err), "fa-solid fa-circle-xmark");
    } finally {
        if (btnDisable) btnDisable.disabled = false;
    }
}

// Envia a verificação de MFA durante a tela de Login
async function handleMfaLogin(event) {
    event.preventDefault();

    if (!supabaseClient) return;

    const codeInput = document.getElementById('loginMfaCode');
    const code = codeInput?.value?.trim();

    if (!code || code.length !== 6 || isNaN(code)) {
        window.showNotification("Insira o código de 6 dígitos.", "fa-solid fa-triangle-exclamation");
        return;
    }

    const btnMfaLoginSubmit = document.getElementById('btnMfaLoginSubmit');
    if (btnMfaLoginSubmit) btnMfaLoginSubmit.disabled = true;

    try {
        // Listar fatores associados ao usuário que iniciou o login
        const { data: factorsData, error: listError } = await supabaseClient.auth.mfa.listFactors();
        if (listError) throw listError;

        const activeFactor = factorsData?.all?.find(f => f.status === 'verified');
        if (!activeFactor) {
            throw new Error("Nenhum fator MFA verificado na conta.");
        }

        // Criar desafio
        const { data: challengeData, error: challengeError } = await supabaseClient.auth.mfa.challenge({
            factorId: activeFactor.id
        });

        if (challengeError) throw challengeError;

        // Validar código
        const { error: verifyError } = await supabaseClient.auth.mfa.verify({
            factorId: activeFactor.id,
            challengeId: challengeData.id,
            code: code
        });

        if (verifyError) throw verifyError;

        if (codeInput) codeInput.value = '';
        closeMfaLoginModal();
        window.showNotification("Autenticação concluída. Bem-vindo de volta!", "fa-solid fa-circle-check");
    } catch (err) {
        window.showNotification("Código incorreto ou inválido.", "fa-solid fa-circle-xmark");
    } finally {
        if (btnMfaLoginSubmit) btnMfaLoginSubmit.disabled = false;
    }
}

// Modais Auxiliares para o MFA no Login
function openMfaLoginModal() {
    const modal = document.getElementById('mfaLoginModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeMfaLoginModal() {
    const modal = document.getElementById('mfaLoginModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

window.checkMfaStatus = checkMfaStatus;
window.startMfaEnrollment = startMfaEnrollment;
window.verifyMfaEnrollment = verifyMfaEnrollment;
window.disableMfa = disableMfa;
window.handleMfaLogin = handleMfaLogin;
window.closeMfaLoginModal = closeMfaLoginModal;

// Abrir/Fechar modal de Configurações
async function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Carrega o nick atual do usuário nos inputs
        const nickInput = document.getElementById('settingsNewNick');
        if (nickInput && currentProfile) {
            nickInput.value = currentProfile.minecraft_username || '';
        }

        // Carrega o e-mail atual do usuário no placeholder/label se desejado
        const emailInput = document.getElementById('settingsNewEmail');
        if (emailInput && currentUser) {
            emailInput.value = '';
            emailInput.placeholder = currentUser.email || '';
        }

        // Reinicia a aba para Geral
        switchSettingsTab('general');

        // Carrega informações de status do 2FA
        loadProfileSettings();
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Alterna entre abas nas configurações
function switchSettingsTab(tabName) {
    // Esconder todas as abas
    document.querySelectorAll('.settings-pane').forEach(pane => {
        pane.classList.add('hidden');
    });

    // Desativar estilo dos botões da sidebar
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar aba ativa
    const activePane = document.getElementById(`settingsTab-${tabName}`);
    if (activePane) activePane.classList.remove('hidden');

    // Destacar botão ativo
    const activeBtn = Array.from(document.querySelectorAll('.settings-tab-btn')).find(btn => 
        btn.getAttribute('onclick').includes(`'${tabName}'`)
    );
    if (activeBtn) activeBtn.classList.add('active');
}

// Carrega dados dinâmicos das configurações
async function loadProfileSettings() {
    const mfaSetupActive = document.getElementById('mfaSetupActive');
    const mfaSetupInactive = document.getElementById('mfaSetupInactive');
    const verifyArea = document.getElementById('mfaVerifyArea');
    const btnStart = document.getElementById('btnStartMfa');
    
    // Resetar campos de ativação pendentes
    if (verifyArea) verifyArea.classList.add('hidden');
    if (btnStart) {
        btnStart.style.display = 'inline-flex';
        btnStart.disabled = false;
    }

    const isMfaActive = await checkMfaStatus();

    if (isMfaActive) {
        // Mostrar card de 2FA ativo
        if (mfaSetupActive) mfaSetupActive.classList.remove('hidden');
        if (mfaSetupInactive) mfaSetupInactive.classList.add('hidden');

        // Tornar campos de 2FA visíveis e obrigatórios nos formulários de e-mail e senha
        const emailMfaGroup = document.getElementById('emailMfaGroup');
        const passwordMfaGroup = document.getElementById('passwordMfaGroup');
        const emailMfaInput = document.getElementById('settingsEmailMfaCode');
        const passwordMfaInput = document.getElementById('settingsPasswordMfaCode');

        if (emailMfaGroup) emailMfaGroup.classList.remove('hidden');
        if (passwordMfaGroup) passwordMfaGroup.classList.remove('hidden');
        if (emailMfaInput) emailMfaInput.required = true;
        if (passwordMfaInput) passwordMfaInput.required = true;
    } else {
        // Mostrar card de 2FA inativo
        if (mfaSetupActive) mfaSetupActive.classList.add('hidden');
        if (mfaSetupInactive) mfaSetupInactive.classList.remove('hidden');

        // Ocultar e desmarcar campos de 2FA nos formulários
        const emailMfaGroup = document.getElementById('emailMfaGroup');
        const passwordMfaGroup = document.getElementById('passwordMfaGroup');
        const emailMfaInput = document.getElementById('settingsEmailMfaCode');
        const passwordMfaInput = document.getElementById('settingsPasswordMfaCode');

        if (emailMfaGroup) emailMfaGroup.classList.add('hidden');
        if (passwordMfaGroup) passwordMfaGroup.classList.add('hidden');
        if (emailMfaInput) { emailMfaInput.required = false; emailMfaInput.value = ''; }
        if (passwordMfaInput) { passwordMfaInput.required = false; passwordMfaInput.value = ''; }
    }
}

window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.switchSettingsTab = switchSettingsTab;
window.loadProfileSettings = loadProfileSettings;






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

    // 3. Carregar lista de comentários com profiles associados (desacoplados)
    try {
        const { data: commentsData, error } = await supabaseClient
            .from('comments')
            .select('id, content, created_at, user_id')
            .eq('photo_path', activePhotoPath)
            .order('created_at', { ascending: true });

        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.innerHTML = '';
            if (!error && commentsData && commentsData.length > 0) {
                // Buscar profiles associados
                const userIds = [...new Set(commentsData.map(c => c.user_id))];
                let profilesMap = {};

                if (userIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabaseClient
                        .from('profiles')
                        .select('id, minecraft_username')
                        .in('id', userIds);

                    if (!profilesError && profilesData) {
                        profilesData.forEach(p => {
                            profilesMap[p.id] = p.minecraft_username;
                        });
                    }
                }

                commentsData.forEach(comment => {
                    const username = profilesMap[comment.user_id] || 'Jogador';
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
                .insert({ 
                    photo_path: activePhotoPath,
                    user_id: currentUser.id
                });
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('likes')
                .delete()
                .eq('photo_path', activePhotoPath)
                .eq('user_id', currentUser.id);
            if (error) throw error;
        }

        if (typeof loadGalleryCardsStats === 'function') {
            loadGalleryCardsStats(cachedAlbums);
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
                content: content,
                user_id: currentUser.id
            });

        if (error) throw error;
        if (input) input.value = '';

        await window.loadPhotoInteractions(activePhotoPath);

        if (typeof loadGalleryCardsStats === 'function') {
            loadGalleryCardsStats(cachedAlbums);
        }
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

// Inicializar Supabase (SDK já carregado via <script> no <head>)
function initSupabase() {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setupSupabaseAuthAndInteractions();
    } else {
        // Fallback: aguardar até 5s para o SDK carregar
        let tentativas = 0;
        const intervalo = setInterval(() => {
            tentativas++;
            if (window.supabase) {
                clearInterval(intervalo);
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                setupSupabaseAuthAndInteractions();
            } else if (tentativas >= 50) {
                clearInterval(intervalo);
                console.error('[Auth] SDK do Supabase não carregou após 5s.');
            }
        }, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}

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

// Sobrescrever a lógica de cadeados para garantir que todos os cards fiquem visíveis e sem blur
function updateLockUI(index, clicks) {
    const card = document.getElementById(`card-${index}`);
    if (card) {
        card.classList.remove('blurred');
    }
    const overlay = document.getElementById(`overlay-${index}`);
    if (overlay) {
        overlay.style.display = 'none';
    }
}
window.clickLock = function() {};
