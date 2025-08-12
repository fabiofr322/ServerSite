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

    // --- LÓGICA DA PÁGINA DA GALERIA ---
    function setupGalleryLogic() {
        const modal = document.getElementById('albumModal');
        if (!modal) return; // Sai se não estiver na página da galeria

        const modalImg = document.getElementById('modalImage');
        const closeModalBtn = document.querySelector('.close-modal');
        const prevBtn = document.querySelector('.prev-slide');
        const nextBtn = document.querySelector('.next-slide');
        const counter = document.querySelector('.slide-counter');
        const albumCards = document.querySelectorAll('.album-card');

        let currentAlbumImages = [];
        let currentImageIndex = 0;

        // Itera sobre cada card de álbum
        albumCards.forEach(card => {
            const images = card.dataset.images.split(',');
            
            // Verifica se o álbum tem múltiplas imagens
            if (images.length > 1) {
                card.setAttribute('data-multiple-images', 'true');

                // --- NOVA LÓGICA DO SLIDESHOW DA CAPA ---
                let coverIndex = 0;
                const coverImage = card.querySelector('.album-cover img');

                // Inicia um temporizador para trocar a imagem da capa
                setInterval(() => {
                    // Avança para a próxima imagem da lista
                    coverIndex = (coverIndex + 1) % images.length;

                    // Aplica um efeito de fade-out
                    coverImage.style.opacity = '0';

                    // Espera a transição de fade-out terminar para trocar a imagem e aplicar o fade-in
                    setTimeout(() => {
                        coverImage.src = images[coverIndex].trim();
                        coverImage.style.opacity = '1';
                    }, 500); // Duração deve ser a mesma da transição no CSS (0.5s)

                }, 4000); // Troca de imagem a cada 4 segundos
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

        // Navegação do Modal
        nextBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });

        prevBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });

        // Fechar modal
        const closeModal = () => modal.classList.remove('show');
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Lógica para buscar cabeças de jogadores
        document.querySelectorAll('.album-card .player-name').forEach(nameElement => {
            const playerName = nameElement.innerText.trim();
            const headImg = nameElement.parentElement.querySelector('.player-head');
            if (playerName && headImg) {
                headImg.src = `https://mc-heads.net/avatar/${playerName}/16`;
                headImg.onerror = () => { headImg.style.display = 'none'; };
            }
        });
    }

    // --- NOVA LÓGICA PARA A SEÇÃO DE JOGADORES NA INDEX ---
    function setupPlayersSectionLogic() {
        const playersSection = document.getElementById('players');
        if (!playersSection) return; // Roda apenas se a seção #players existir

        playersSection.querySelectorAll('.player-name').forEach(nameElement => {
            const playerName = nameElement.innerText.trim();
            const headImg = nameElement.parentElement.querySelector('.player-head');
            if (playerName && headImg) {
                headImg.src = `https://mc-heads.net/avatar/${playerName}/64`; // Tamanho 64x64
                headImg.onerror = () => { headImg.style.display = 'none'; };
            }
        });
    }

    // Executa as lógicas
    setupGeneralLogic();
    setupGalleryLogic();
    setupPlayersSectionLogic();
});