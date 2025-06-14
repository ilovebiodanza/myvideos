document.addEventListener('DOMContentLoaded', function() {
    // Mostrar/ocultar submenús
    const moduleLinks = document.querySelectorAll('.modules-list > li > a');
    
    moduleLinks.forEach(link => {
        if (link.nextElementSibling && link.nextElementSibling.classList.contains('submenu')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                this.nextElementSibling.classList.toggle('show');
            });
        }
    });
    
    // Manejar la reproducción de videos con intro/outro
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
        const card = video.closest('.video-card');
        const intro = card.querySelector('.video-intro');
        const outro = card.querySelector('.video-outro');
        
        // Mostrar intro al cargar
        intro.style.display = 'flex';
        video.style.display = 'none';
        outro.style.display = 'none';
        
        // Al hacer clic en intro, comenzar video
        intro.addEventListener('click', function() {
            intro.style.display = 'none';
            video.style.display = 'block';
            video.play();
        });
        
        // Al terminar video, mostrar outro
        video.addEventListener('ended', function() {
            video.style.display = 'none';
            outro.style.display = 'flex';
        });
        
        // Al hacer clic en outro, volver a intro
        outro.addEventListener('click', function() {
            outro.style.display = 'none';
            intro.style.display = 'flex';
        });
    });
    
    // Scroll suave para navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
            
            // Actualizar menú activo
            document.querySelectorAll('.modules-list a').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
});
