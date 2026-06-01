document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('hamburgerMenuBtn');
    const menu = document.getElementById('cornerMenu');

    if (menuBtn && menu) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            menu.classList.toggle('show');
        });

        // Cerrar al hacer clic en un enlace
        const links = menu.querySelectorAll('.corner-menu-link');
        links.forEach(link => {
            link.addEventListener('click', () => menu.classList.remove('show'));
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
    }
});