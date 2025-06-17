function encriptar(texto, desplazamiento) {
    return texto.split('').map(char => {
        if (char >= 'A' && char <= 'Z') {
            return String.fromCharCode((char.charCodeAt(0) - 65 + desplazamiento) % 26 + 65);
        } else if (char >= 'a' && char <= 'z') {
            return String.fromCharCode((char.charCodeAt(0) - 97 + desplazamiento) % 26 + 97);
        }
        return char; // No modifica caracteres no alfabéticos
    }).join('');
}

// Configuración
const config = {    // Asegúrate de actualizar la llamada a esta función en loadVideosForClassification:
    // Cambia playButton.onclick a:
    // playButton.onclick = () => showVideoInModal(video.download_url, videoTitle.textContent, classification);

    githubRepo: 'ilovebiodanza/myvideos',
    branch: 'main',
    token: encriptar('jks_XQaqN3xUXcLCbw3OpqcaN7y7yixb4d30au7Q', -3)
};

// Variables de estado
let currentMode = 'view';
let messageModal;

// Elementos del DOM
let modeIndicator;
let adminPanel;
let videosContainer;
let addVideoBtn;
let addVideoForm;
let submitVideoBtn;
let cancelAddBtn;
let deleteVideoList;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initElements();
    initEventListeners();
    loadVideos();
    setMode('view');
});

function initElements() {
    modeIndicator = document.getElementById('modeIndicator');
    adminPanel = document.getElementById('adminPanel');
    videosContainer = document.getElementById('videosContainer');
    addVideoBtn = document.getElementById('addVideoBtn');
    addVideoForm = document.getElementById('addVideoForm');
    submitVideoBtn = document.getElementById('submitVideoBtn');
    cancelAddBtn = document.getElementById('cancelAddBtn');
    deleteVideoList = document.getElementById('deleteVideoList');
    messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
}

function initEventListeners() {
    document.addEventListener('keydown', handleKeyCombination);
    addVideoBtn.addEventListener('click', () => addVideoForm.style.display = 'block');
    cancelAddBtn.addEventListener('click', () => addVideoForm.style.display = 'none');
    submitVideoBtn.addEventListener('click', uploadVideo);
}

// Funciones de modo
function handleKeyCombination(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setMode('edit');
        e.preventDefault();
    } else if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        setMode('view');
        e.preventDefault();
    }
}

function setMode(mode) {
    currentMode = mode;
    if (mode === 'edit') {
        modeIndicator.textContent = 'Modo Actualización';
        modeIndicator.className = 'mode-indicator edit-mode';
        adminPanel.style.display = 'block';
        loadVideosForDeletion();
    } else {
        modeIndicator.textContent = 'Modo Visualización';
        modeIndicator.className = 'mode-indicator view-mode';
        adminPanel.style.display = 'none';
    }
}

// Funciones para cargar videos
async function loadVideos() {
    try {
        const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents?ref=${config.branch}`);
        if (!response.ok) throw new Error('Error al cargar las clasificaciones');
        
        const classifications = await response.json();
        videosContainer.innerHTML = '';
        
        for (const classification of classifications) {
            if (classification.type === 'dir') {
                await loadVideosForClassification(classification.name);
            }
        }
    } catch (error) {
        showMessage('Error', `No se pudieron cargar los videos: ${error.message}`);
    }
}

async function loadVideosForClassification(classification) {
    try {
        const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents/${classification}?ref=${config.branch}`);
        if (!response.ok) throw new Error(`Error al cargar videos para ${classification}`);
        
        const videos = await response.json();
        videos.sort((a, b) => a.name.localeCompare(b.name)); // Orden alfabético
        
        createClassificationAccordion(classification, videos);
    } catch (error) {
        console.error(`Error al cargar videos para ${classification}:`, error);
    }
}

function createClassificationAccordion(classification, videos) {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';
    
    // Crear encabezado del acordeón
    const accordionHeader = document.createElement('h2');
    accordionHeader.className = 'accordion-header';
    accordionHeader.id = `heading${classification.replace(/\s+/g, '')}`;
    
    const accordionButton = document.createElement('button');
    accordionButton.className = 'accordion-button collapsed';
    accordionButton.type = 'button';
    accordionButton.setAttribute('data-bs-toggle', 'collapse');
    accordionButton.setAttribute('data-bs-target', `#collapse${classification.replace(/\s+/g, '')}`);
    accordionButton.textContent = classification;
    accordionHeader.appendChild(accordionButton);
    
    // Crear cuerpo del acordeón
    const accordionCollapse = document.createElement('div');
    accordionCollapse.id = `collapse${classification.replace(/\s+/g, '')}`;
    accordionCollapse.className = 'accordion-collapse collapse';
    accordionCollapse.setAttribute('aria-labelledby', `heading${classification.replace(/\s+/g, '')}`);
    accordionCollapse.setAttribute('data-bs-parent', '#videosContainer');
    
    const accordionBody = document.createElement('div');
    accordionBody.className = 'accordion-body p-0';
    
    const listGroup = document.createElement('div');
    listGroup.className = 'list-group list-group-flush';
    
    // Añadir videos a la lista
    videos.forEach(video => {
        if (video.type === 'file' && isVideoFile(video.name)) {
            listGroup.appendChild(createVideoListItem(classification, video));
        }
    });
    
    accordionBody.appendChild(listGroup);
    accordionCollapse.appendChild(accordionBody);
    accordionItem.appendChild(accordionHeader);
    accordionItem.appendChild(accordionCollapse);
    videosContainer.appendChild(accordionItem);
}

function createVideoListItem(classification, video) {
    const listItem = document.createElement('div');
    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    const videoTitle = document.createElement('span');
    videoTitle.nameOk = video.name.replace(/\.[^/.]+$/, '');
    videoTitle.textContent = videoTitle.nameOk.replace("Yo amo Biodanza", "Yo❤Biodanza");
    
    const playButton = document.createElement('button');
    playButton.className = 'btn btn-primary btn-sm';
    playButton.textContent = 'Play';
    playButton.onclick = () => showVideoInModal(video.download_url, videoTitle.nameOk, classification);
    
    listItem.appendChild(videoTitle);
    listItem.appendChild(playButton);
    
    if (currentMode === 'edit') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm ms-2';
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteVideo(classification, video.name);
        };
        listItem.appendChild(deleteBtn);
    }
    
    return listItem;
}

// Modal de video
function showVideoInModal(videoUrl, videoTitle, classification) {
    const modalId = 'videoModal_' + Math.random().toString(36).substr(2, 9);
    
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-xl">
                <div class="modal-content video-modal-content" style="background-color: black;">
                    <div class="modal-header border-0" style="background-color: black;">
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0 d-flex flex-column justify-content-center align-items-center text-center text-white" style="min-height: 70vh;">
                        <!-- Pantalla de intro -->
                        <div id="intro-screen" class="d-flex flex-column align-items-center justify-content-center">
                            <img src="../myimages/perfil/logo - yo amo biodanza - fondo transparente.png" alt="Logo" class="mb-4" style="max-width: 200px;">
                            <h3 class="text-uppercase mb-2">${classification}</h3>
                            <h2 class="display-5">${videoTitle}</h2>
                        </div>
                        
                        <!-- Reproductor de video (oculto inicialmente) -->
                        <video id="video-player" controls class="d-none" style="max-width: 100%; max-height: 80vh;">
                            <source src="${videoUrl}" type="video/mp4">
                        </video>
                        
                        <!-- Pantalla de fin (oculta inicialmente) -->
                        <div id="end-screen" class="d-none flex-column align-items-center justify-content-center">
                            <img src="../myimages/perfil/logo - yo amo biodanza - fondo transparente.png" alt="Logo" class="mb-4" style="max-width: 200px;">
                            <h2 class="display-5">Fin del video</h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    const videoModal = new bootstrap.Modal(document.getElementById(modalId));
    const videoElement = document.querySelector(`#${modalId} #video-player`);
    const introScreen = document.querySelector(`#${modalId} #intro-screen`);
    const endScreen = document.querySelector(`#${modalId} #end-screen`);
    
    // Mostrar modal
    videoModal.show();
    
    // Configurar temporizador para la intro
    const introTimer = setTimeout(() => {
        introScreen.classList.add('d-none');
        videoElement.classList.remove('d-none');
        videoElement.play();
    }, 5000); // 5 segundos
    
    // Manejar el final del video
    videoElement.addEventListener('ended', () => {
        videoElement.classList.add('d-none');
        endScreen.classList.remove('d-none');
    });
    
    // Detener todo cuando se cierra el modal
    document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
        clearTimeout(introTimer);
        if (videoElement) {
            videoElement.pause();
            videoElement.currentTime = 0;
        }
        modalContainer.remove();
    });
    
    // Redimensionar responsivamente
    videoElement.onloadedmetadata = function() {
        const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        const windowHeight = window.innerHeight * 0.8;
        const windowWidth = window.innerWidth * 0.9;
        
        if (windowWidth / aspectRatio <= windowHeight) {
            videoElement.style.width = `${windowWidth}px`;
            videoElement.style.height = 'auto';
        } else {
            videoElement.style.height = `${windowHeight}px`;
            videoElement.style.width = 'auto';
        }
    };
}
// Funciones de administración
async function loadVideosForDeletion() {
    try {
        const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents?ref=${config.branch}`);
        if (!response.ok) throw new Error('Error al cargar las clasificaciones');
        
        const classifications = await response.json();
        deleteVideoList.innerHTML = '';
        
        for (const classification of classifications) {
            if (classification.type === 'dir') {
                await loadVideosListForDeletion(classification.name);
            }
        }
    } catch (error) {
        showMessage('Error', `No se pudieron cargar los videos para eliminación: ${error.message}`);
    }
}

async function loadVideosListForDeletion(classification) {
    try {
        const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents/${classification}?ref=${config.branch}`);
        if (!response.ok) throw new Error(`Error al cargar videos para ${classification}`);
        
        const videos = await response.json();
        
        videos.forEach(video => {
            if (video.type === 'file' && isVideoFile(video.name)) {
                const listItem = document.createElement('button');
                listItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                listItem.textContent = `${classification}/${video.name.replace(/\.[^/.]+$/, '')}`;
                
                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'badge bg-danger rounded-pill';
                deleteBtn.textContent = 'Eliminar';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteVideo(classification, video.name);
                };
                
                listItem.appendChild(deleteBtn);
                deleteVideoList.appendChild(listItem);
            }
        });
    } catch (error) {
        console.error(`Error al cargar videos para eliminación en ${classification}:`, error);
    }
}

async function uploadVideo() {
    const title = document.getElementById('videoTitle').value.trim();
    const classification = document.getElementById('videoClassification').value.trim();
    const fileInput = document.getElementById('videoFile');
    
    if (!title || !classification || !fileInput.files.length) {
        showMessage('Error', 'Por favor complete todos los campos');
        return;
    }
    
    const file = fileInput.files[0];
    const fileName = `${title}.${file.name.split('.').pop()}`;
    const path = `${classification}/${fileName}`;
    
    try {
        const fileContent = await readFileAsBase64(file);
        const content = fileContent.split(',')[1];
        
        const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Agregar video: ${fileName}`,
                content: content,
                branch: config.branch
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al subir el video');
        }
        
        showMessage('Éxito', 'Video subido correctamente');
        resetForm();
        loadVideos();
        if (currentMode === 'edit') loadVideosForDeletion();
    } catch (error) {
        showMessage('Error', `No se pudo subir el video: ${error.message}`);
    }
}

async function deleteVideo(classification, videoName) {
    if (!confirm(`¿Está seguro que desea eliminar ${classification}/${videoName}?`)) return;
    
    try {
        const getResponse = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents/${classification}/${videoName}?ref=${config.branch}`);
        if (!getResponse.ok) throw new Error('No se pudo obtener información del video');
        
        const fileInfo = await getResponse.json();
        
        const deleteResponse = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents/${classification}/${videoName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Eliminar video: ${videoName}`,
                sha: fileInfo.sha,
                branch: config.branch
            })
        });
        
        if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            throw new Error(errorData.message || 'Error al eliminar el video');
        }
        
        showMessage('Éxito', 'Video eliminado correctamente');
        loadVideos();
        if (currentMode === 'edit') loadVideosForDeletion();
    } catch (error) {
        showMessage('Error', `No se pudo eliminar el video: ${error.message}`);
    }
}

// Funciones auxiliares
function isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showMessage(title, message) {
    document.getElementById('messageModalTitle').textContent = title;
    document.getElementById('messageModalBody').textContent = message;
    messageModal.show();
}

function resetForm() {
    addVideoForm.style.display = 'none';
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoClassification').value = '';
    document.getElementById('videoFile').value = '';
}
