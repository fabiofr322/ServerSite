document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA GERAL DO SITE ---
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
        const copyButton = document.querySelector('button[onclick="copyIp()"]');
        if (copyButton) {
            copyButton.onclick = null; 
            copyButton.addEventListener('click', () => {
                const ipElement = document.getElementById('server-ip');
                if (!ipElement) return;
                navigator.clipboard.writeText(ipElement.innerText).then(() => {
                    const message = document.getElementById('copy-message');
                    if(message) {
                        message.style.opacity = '1';
                        setTimeout(() => { message.style.opacity = '0'; }, 2000);
                    }
                });
            });
        }
    }

    // --- LÓGICA DA PÁGINA DA GALERIA PRINCIPAL ---
    function setupGalleryLogic() {
        const modal = document.getElementById('albumModal');
        if (!modal) return; 

        const modalImg = document.getElementById('modalImage');
        const closeModalBtn = document.querySelector('.close-modal');
        const prevBtn = document.querySelector('.prev-slide');
        const nextBtn = document.querySelector('.next-slide');
        const counter = document.querySelector('.slide-counter');
        const albumCards = document.querySelectorAll('.album-card');

        let currentAlbumImages = [];
        let currentImageIndex = 0;

        albumCards.forEach(card => {
            const images = card.dataset.images.split(',');
            if (images.length > 1) {
                card.setAttribute('data-multiple-images', 'true');
                let coverIndex = 0;
                const coverImage = card.querySelector('.album-cover img');
                setInterval(() => {
                    coverIndex = (coverIndex + 1) % images.length;
                    coverImage.style.opacity = '0';
                    setTimeout(() => {
                        coverImage.src = images[coverIndex].trim();
                        coverImage.style.opacity = '1';
                    }, 500);
                }, 4000);
            }
        });

        function showImage(index) {
            modalImg.src = currentAlbumImages[index];
            counter.textContent = `${index + 1} / ${currentAlbumImages.length}`;
        }

        function openModalWithAlbum(albumCard) {
            currentAlbumImages = albumCard.dataset.images.split(',').map(img => img.trim());
            currentImageIndex = 0;
            
            if (currentAlbumImages.length <= 1) {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
                counter.style.display = 'none';
            } else {
                prevBtn.style.display = 'block';
                nextBtn.style.display = 'block';
                counter.style.display = 'block';
            }

            showImage(currentImageIndex);
            modal.classList.add('show');
        }

        albumCards.forEach(card => {
            card.querySelector('.album-cover').addEventListener('click', () => {
                openModalWithAlbum(card);
            });
        });

        nextBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });

        prevBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });

        const closeModal = () => modal.classList.remove('show');
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        document.querySelectorAll('.album-card .player-name').forEach(nameElement => {
            const playerName = nameElement.innerText.trim();
            const headImg = nameElement.parentElement.querySelector('.player-head');
            if (playerName && headImg) {
                headImg.src = `https://mc-heads.net/avatar/${playerName}/16`;
                headImg.onerror = () => { headImg.style.display = 'none'; };
            }
        });
    }

    // --- LÓGICA PARA A SEÇÃO DE JOGADORES NA INDEX ---
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

    // --- LÓGICA PARA A GALERIA DE FOTOS E VOTAÇÃO DO EVENTO ---
    function setupEventPageLogic() {
        const photoGallery = document.getElementById('photo-gallery');
        if (!photoGallery) return; 

        // Lógica da Galeria de Fotos
        const modal = document.getElementById('photoModal');
        const modalImg = document.getElementById('modalImage');
        const galleryPhotos = photoGallery.querySelectorAll('.gallery-photo');
        const closeModalBtn = modal.querySelector('.close-modal');

        galleryPhotos.forEach(photo => {
            photo.addEventListener('click', () => {
                modal.classList.add('show');
                modalImg.src = photo.src;
            });
        });

        const closeModal = () => modal.classList.remove('show');
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Lógica para buscar cabeças de jogadores
        photoGallery.querySelectorAll('.player-name').forEach(nameElement => {
            const playerName = nameElement.innerText.trim();
            const headImg = nameElement.closest('.photo-card').querySelector('.player-head');
            if (playerName && headImg) {
                headImg.src = `https://mc-heads.net/avatar/${playerName}/16`;
                headImg.onerror = () => { headImg.style.display = 'none'; };
            }
        });

        // Lógica de Votação
        const votingPoll = document.getElementById('voting-poll');
        const photoCards = photoGallery.querySelectorAll('.photo-card');
        const voteMessage = document.getElementById('vote-message');
        
        // Gera as opções de voto dinamicamente a partir da galeria
        const votingOptions = Array.from(photoCards).map(card => {
            const title = card.querySelector('h4').textContent;
            const player = card.querySelector('.player-name').textContent;
            return { title, player, votes: 0 };
        });

        // Renderiza o painel de votação
        votingPoll.innerHTML = votingOptions.map((option, index) => `
            <div class="voting-option" data-index="${index}">
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

        // Lógica de clique e atualização
        let hasVoted = false;
        const voteButtons = votingPoll.querySelectorAll('.vote-button');

        voteButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                if (hasVoted) {
                    alert('Você já votou nesta sessão!');
                    return;
                }
                
                hasVoted = true;
                const selectedOptionIndex = e.target.closest('.voting-option').dataset.index;
                votingOptions[selectedOptionIndex].votes++;
                
                updatePollUI();

                voteButtons.forEach(btn => {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                    btn.classList.remove('hover:bg-purple-600');
                });
                
                voteMessage.style.opacity = '1';
            });
        });

        function updatePollUI() {
            const totalVotes = votingOptions.reduce((sum, option) => sum + option.votes, 0);
            
            votingOptions.forEach((option, index) => {
                const percentage = totalVotes === 0 ? 0 : (option.votes / totalVotes) * 100;
                const optionElement = votingPoll.querySelector(`.voting-option[data-index="${index}"]`);
                optionElement.querySelector('.vote-bar').style.width = `${percentage}%`;
                optionElement.querySelector('.vote-count').textContent = `${option.votes} ${option.votes === 1 ? 'voto' : 'votos'}`;
            });
        }
    }

    // Executa todas as lógicas necessárias na página
    setupGeneralLogic();
    setupGalleryLogic();
    setupPlayersSectionLogic();
    setupEventPageLogic();
});
