$(document).ready(function() {
    // Manejar la reproducción de videos con intro/outro
    $('.video-card').each(function() {
        const $card = $(this);
        const $video = $card.find('video');
        const $intro = $card.find('.video-intro');
        const $outro = $card.find('.video-outro');
        
        // Mostrar intro inicialmente
        $intro.removeClass('d-none');
        $video.addClass('d-none');
        $outro.addClass('d-none');
        
        // Al hacer clic en intro, comenzar video
        $intro.on('click', function() {
            $intro.addClass('d-none');
            $video.removeClass('d-none');
            $video[0].play();
        });
        
        // Al terminar video, mostrar outro
        $video.on('ended', function() {
            $video.addClass('d-none');
            $outro.removeClass('d-none');
        });
        
        // Al hacer clic en outro, volver a intro
        $outro.on('click', function() {
            $outro.addClass('d-none');
            $intro.removeClass('d-none');
            $video[0].currentTime = 0;
        });
    });
    
    // Cambiar entre vista de cuadrícula y lista
    $('.toggle-view').on('click', function() {
        const $mainContent = $('main');
        const currentView = $(this).data('view');
        
        if (currentView === 'grid') {
            $mainContent.find('.video-grid').addClass('video-list-view');
            $(this).data('view', 'list').html('<i class="fas fa-th-large"></i>');
        } else {
            $mainContent.find('.video-grid').removeClass('video-list-view');
            $(this).data('view', 'grid').html('<i class="fas fa-list"></i>');
        }
    });
    
    // Scroll suave para navegación
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        
        const target = $(this).attr('href');
        $('html, body').animate({
            scrollTop: $(target).offset().top - 20
        }, 800);
        
        // Actualizar menú activo
        $('.sidebar .nav-link').removeClass('active');
        $(this).addClass('active');
    });
    
    // Activar el primer módulo al cargar
    $('.sidebar .nav-link:first').addClass('active');
    
    // Mostrar/ocultar sidebar en móviles
    $('#sidebarCollapse').on('click', function() {
        $('#sidebar').toggleClass('show');
    });
});
