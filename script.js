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
                if(prevBtn) prevBtn.style.display = 'none';
                if(nextBtn) nextBtn.style.display = 'none';
                if(counter) counter.style.display = 'none';
            } else {
                if(prevBtn) prevBtn.style.display = 'block';
                if(nextBtn) nextBtn.style.display = 'block';
                if(counter) counter.style.display = 'block';
            }

            showImage(currentImageIndex);
            modal.classList.add('show');
        }

        albumCards.forEach(card => {
            const cover = card.querySelector('.album-cover');
            if(cover) {
                cover.addEventListener('click', () => openModalWithAlbum(card));
            }
        });

        if(nextBtn) nextBtn.addEventListener('click', () => {
            if (currentAlbumImages.length === 0) return;
            currentImageIndex = (currentImageIndex + 1) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });

        if(prevBtn) prevBtn.addEventListener('click', () => {
            if (currentAlbumImages.length === 0) return;
            currentImageIndex = (currentImageIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length;
            showImage(currentImageIndex);
        });

        const closeModal = () => modal.classList.remove('show');
        if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
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

    // --- LÓGICA PARA A GALERIA DA PÁGINA DE EVENTOS ---
    function setupEventPageGallery() {
        const photoGallery = document.getElementById('photo-gallery');
        if (!photoGallery) return;

        const modal = document.getElementById('photoModal');
        if (!modal) return;

        const modalImg = modal.querySelector('#modalImage');
        const galleryPhotos = photoGallery.querySelectorAll('.gallery-photo');
        const closeModalBtn = modal.querySelector('.close-modal');

        galleryPhotos.forEach(photo => {
            photo.addEventListener('click', () => {
                if(modal && modalImg) {
                    modal.classList.add('show');
                    modalImg.src = photo.src;
                }
            });
        });

        const closeModal = () => modal.classList.remove('show');
        if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
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
    }

    // Executa todas as lógicas necessárias na página
    setupGeneralLogic();
    setupGalleryLogic();
    setupPlayersSectionLogic();
    setupEventPageGallery();
});
