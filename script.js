/* script.js - versão atualizada
   - Mantém: menu mobile, copiar IP, galerias, players section, modals
   - Substitui Firebase por JSONBin para a votação (uso direto do bin que você passou)
*/

document.addEventListener('DOMContentLoaded', () => {

    // ---------- CONFIG JSONBIN (SUBSTITUI O FIREBASE) ----------
    const JSONBIN_API_KEY = "$2a$10$5YF9uaxieZ7q7ZGT5Wjo2ub8CFXDbeizsaGs1gIakR4br4lL.ZFxu";
    const JSONBIN_BIN_ID = "689b720fd0ea881f405786fb";
    const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
    const JSONBIN_LATEST_URL = `${JSONBIN_URL}/latest`;

    const VOTE_COOLDOWN = 10; // segundos
    const cooldownKey = "lastVoteTime";

    async function getVotes() {
        try {
            const res = await fetch(JSONBIN_LATEST_URL, {
                headers: { "X-Master-Key": JSONBIN_API_KEY }
            });
            if (!res.ok) throw new Error(`GET error ${res.status}`);
            const data = await res.json();
            return data.record || {};
        } catch (err) {
            console.error("Erro ao buscar votos (JSONBin):", err);
            return {};
        }
    }

    async function updateVotes(votes) {
        try {
            const res = await fetch(JSONBIN_URL, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Master-Key": JSONBIN_API_KEY
                },
                body: JSON.stringify(votes)
            });
            if (!res.ok) throw new Error(`PUT error ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Erro ao atualizar votos (JSONBin):", err);
            throw err;
        }
    }

    // ---------- LÓGICA GERAL DO SITE ----------
    function setupGeneralLogic() {
        // Menu mobile
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Copiar IP
        const copyButton = document.querySelector('button[onclick="copyIp()"], button[onclick="copyIp()"]');
        if (copyButton) {
            copyButton.onclick = null;
            copyButton.addEventListener('click', () => {
                const ipElement = document.getElementById('server-ip');
                if (!ipElement) return;
                navigator.clipboard.writeText(ipElement.innerText).then(() => {
                    const message = document.getElementById('copy-message');
                    if (message) {
                        message.style.opacity = '1';
                        setTimeout(() => { message.style.opacity = '0'; }, 2000);
                    }
                });
            });
        }
    }

    // ---------- LÓGICA DA PÁGINA DA GALERIA PRINCIPAL (albumModal) ----------
    function setupGalleryLogic() {
        const modal = document.getElementById('albumModal');
        if (!modal) return;

        const modalImg = modal.querySelector('#modalImage');
        const closeModalBtn = modal.querySelector('.close-modal');
        const prevBtn = modal.querySelector('.prev-slide');
        const nextBtn = modal.querySelector('.next-slide');
        const counter = modal.querySelector('.slide-counter');
        const albumCards = document.querySelectorAll('.album-card');

        let currentAlbumImages = [];
        let currentImageIndex = 0;

        albumCards.forEach(card => {
            const raw = card.dataset.images || "";
            const images = raw.split(',').map(s => s.trim()).filter(Boolean);
            if (images.length > 1) {
                card.setAttribute('data-multiple-images', 'true');
                let coverIndex = 0;
                const coverImage = card.querySelector('.album-cover img');
                if (!coverImage) return;
                setInterval(() => {
                    coverIndex = (coverIndex + 1) % images.length;
                    coverImage.style.opacity = '0';
                    setTimeout(() => {
                        coverImage.src = images[coverIndex];
                        coverImage.style.opacity = '1';
                    }, 500);
                }, 4000);
            }
        });

        function showImage(index) {
            if (!modalImg) return;
            modalImg.src = currentAlbumImages[index];
            if (counter) counter.textContent = `${index + 1} / ${currentAlbumImages.length}`;
        }

        function openModalWithAlbum(albumCard) {
            const raw = albumCard.dataset.images || "";
            currentAlbumImages = raw.split(',').map(s => s.trim()).filter(Boolean);
            currentImageIndex = 0;

            if (!prevBtn || !nextBtn || !counter) {
                // se algum elemento faltou, tenta escolher por query global
            }

            if (currentAlbumImages.length <= 1) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                if (counter) counter.style.display = 'none';
            } else {
                if (prevBtn) prevBtn.style.display = 'block';
                if (nextBtn) nextBtn.style.display = 'block';
                if (counter) counter.style.display = 'block';
            }

            showImage(currentImageIndex);
            modal.classList.add('show');
        }

        albumCards.forEach(card => {
            const cover = card.querySelector('.album-cover');
            if (cover) {
                cover.addEventListener('click', () => openModalWithAlbum(card));
            }
        });

        if (nextBtn) nextBtn.addEventListener('click', () => {
            if (currentAlbumImages.length === 0) return;
            currentImageIndex = (currentImageIndex + 1) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });

        if (prevBtn) prevBtn.addEventListener('click', () => {
            if (currentAlbumImages.length === 0) return;
            currentImageIndex = (currentImageIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });

        const closeModal = () => modal.classList.remove('show');
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Preenche cabeças
        document.querySelectorAll('.album-card .player-name').forEach(nameElement => {
            const playerName = nameElement.innerText.trim();
            const headImg = nameElement.parentElement.querySelector('.player-head');
            if (playerName && headImg) {
                headImg.src = `https://mc-heads.net/avatar/${playerName}/16`;
                headImg.onerror = () => { headImg.style.display = 'none'; };
            }
        });
    }

    // ---------- LÓGICA PARA A SEÇÃO DE JOGADORES NA INDEX ----------
    function setupPlayersSectionLogic() {
        const playersSection = document.getElementById('players');
        if (!playersSection) return;

        playersSection.querySelectorAll('.player-name').forEach(nameElement => {
            const playerName = nameElement.innerText.trim();
            const headImg = nameElement.parentElement.querySelector('.player-head');
            if (playerName && headImg) {
                headImg.src = `https://mc-heads.net/avatar/${playerName}/64`;
                headImg.onerror = () => { headImg.style.display = 'none'; };
            }
        });
    }

    // ---------- LÓGICA PARA A GALERIA DA PÁGINA DE EVENTOS (photoModal) ----------
    function setupEventPageGallery() {
        const photoGallery = document.getElementById('photo-gallery');
        if (!photoGallery) return;

        const modal = document.getElementById('photoModal');
        const modalImg = modal ? modal.querySelector('#modalImage') : null;
        const galleryPhotos = photoGallery.querySelectorAll('.gallery-photo');
        const closeModalBtn = modal ? modal.querySelector('.close-modal') : null;

        galleryPhotos.forEach(photo => {
            photo.addEventListener('click', () => {
                if (!modal || !modalImg) return;
                modal.classList.add('show');
                modalImg.src = photo.src;
            });
        });

        const closeModal = () => modal && modal.classList.remove('show');
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (modal) modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        photoGallery.querySelectorAll('.player-name').forEach(nameElement => {
            const playerName = nameElement.innerText.trim();
            const headImg = nameElement.closest('.photo-card').querySelector('.player-head');
            if (playerName && headImg) {
                headImg.src = `https://mc-heads.net/avatar/${playerName}/16`;
                headImg.onerror = () => { headImg.style.display = 'none'; };
            }
        });
    }

    // ---------- LÓGICA PARA A VOTAÇÃO DO EVENTO (USANDO JSONBIN) ----------
    async function setupEventVotingLogic() {
        const votingSection = document.getElementById('voting-section');
        if (!votingSection) return; // não é página de evento

        const votingPoll = document.getElementById('voting-poll');
        const photoCards = document.querySelectorAll('#photo-gallery .photo-card');
        const voteMessage = document.getElementById('vote-message');
        const votingOptions = Array.from(photoCards).map((card, index) => {
            const titleEl = card.querySelector('h4');
            const playerEl = card.querySelector('.player-name');
            const title = titleEl ? titleEl.textContent.trim() : `Opção ${index+1}`;
            const player = playerEl ? playerEl.textContent.trim() : "";
            return { id: `option_${index}`, title, player };
        });

        // Renderiza as opções
        votingPoll.innerHTML = votingOptions.map(option => `
            <div class="voting-option" data-id="${option.id}">
                <div class="flex justify-between items-center mb-1 text-xs">
                    <span class="text-white font-bold">${option.title} <span class="text-gray-400 font-normal">por ${option.player}</span></span>
                    <span class="text-gray-400 vote-count">0 votos</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2.5">
                    <div class="vote-bar bg-purple-600 h-2.5 rounded-full transition-all duration-500" style="width: 0%"></div>
                </div>
                <button class="vote-button mt-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded-md text-xs transition-colors">Votar</button>
            </div>
        `).join('');

        // Pega votos iniciais do JSONBin
        let votes = await getVotes();

        // Se JSONBin estiver vazio, inicializa local com zeros e tenta escrever (opcional)
        if (!votes || Object.keys(votes).length === 0) {
            votingOptions.forEach(opt => votes[opt.id] = 0);
            try { await updateVotes(votes); } catch (e) { /* se falhar, continua com votes local */ }
        } else {
            // garante que chaves ausentes sejam inicializadas localmente (sem sobrescrever o bin)
            votingOptions.forEach(opt => { if (!(opt.id in votes)) votes[opt.id] = 0; });
        }

        // Função para atualizar visualmente
        function renderVotes() {
            const totalVotes = Object.values(votes).reduce((sum, c) => sum + (Number(c) || 0), 0);
            votingOptions.forEach(option => {
                const optionVotes = Number(votes[option.id] || 0);
                const percentage = totalVotes === 0 ? 0 : (optionVotes / totalVotes) * 100;
                const optionElement = votingPoll.querySelector(`.voting-option[data-id="${option.id}"]`);
                if (!optionElement) return;
                const bar = optionElement.querySelector('.vote-bar');
                const count = optionElement.querySelector('.vote-count');
                if (bar) bar.style.width = `${percentage}%`;
                if (count) count.textContent = `${optionVotes} ${optionVotes === 1 ? 'voto' : 'votos'}`;
            });
        }

        renderVotes();

        // Handler dos botões de voto
        votingPoll.querySelectorAll('.vote-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const now = Date.now();
                const lastVote = parseInt(localStorage.getItem(cooldownKey) || "0", 10);

                if (now - lastVote < VOTE_COOLDOWN * 1000) {
                    const remaining = Math.ceil((VOTE_COOLDOWN * 1000 - (now - lastVote)) / 1000);
                    if (voteMessage) {
                        voteMessage.textContent = `⏳ Aguarde ${remaining}s para votar novamente.`;
                        voteMessage.classList.remove("text-green-400");
                        voteMessage.classList.add("text-yellow-400");
                        voteMessage.style.opacity = '1';
                        setTimeout(() => { voteMessage.style.opacity = '0'; }, 2000);
                    }
                    return;
                }

                const optionId = e.target.closest('.voting-option').dataset.id;
                votes[optionId] = (Number(votes[optionId] || 0) + 1);

                try {
                    await updateVotes(votes);
                    localStorage.setItem(cooldownKey, now.toString());
                    if (voteMessage) {
                        voteMessage.textContent = "✅ Obrigado pelo seu voto!";
                        voteMessage.classList.remove("text-yellow-400");
                        voteMessage.classList.add("text-green-400");
                        voteMessage.style.opacity = '1';
                        setTimeout(() => { voteMessage.style.opacity = '0'; }, 2000);
                    }
                    renderVotes();
                } catch (err) {
                    // reverte se falhar
                    votes[optionId] = Math.max(0, Number(votes[optionId]) - 1);
                    if (voteMessage) {
                        voteMessage.textContent = "❌ Erro ao registrar voto. Tente novamente.";
                        voteMessage.classList.remove("text-green-400");
                        voteMessage.classList.add("text-red-400");
                        voteMessage.style.opacity = '1';
                        setTimeout(() => { voteMessage.style.opacity = '0'; }, 2500);
                    }
                }
            });
        });
    }

    // ---------- EXECUÇÃO ----------
    setupGeneralLogic();
    setupGalleryLogic();
    setupPlayersSectionLogic();
    setupEventPageGallery();
    setupEventVotingLogic();

});
