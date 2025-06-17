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
const config = {
    githubRepo: 'ilovebiodanza/myvideos', // Reemplazar con tu repositorio
    branch: 'main', // Rama del repositorio
    token: encriptar('jks_XQaqN3xUXcLCbw3OpqcaN7y7yixb4d30au7Q',-3) // Token de acceso
};

// Variables de estado
let currentMode = 'view'; // 'view' o 'edit'
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

// Inicialización cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos del DOM
    modeIndicator = document.getElementById('modeIndicator');
    adminPanel = document.getElementById('adminPanel');
    videosContainer = document.getElementById('videosContainer');
    addVideoBtn = document.getElementById('addVideoBtn');
    addVideoForm = document.getElementById('addVideoForm');
    submitVideoBtn = document.getElementById('submitVideoBtn');
    cancelAddBtn = document.getElementById('cancelAddBtn');
    deleteVideoList = document.getElementById('deleteVideoList');
    
    // Inicializar modal de Bootstrap
    messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    
    // Configurar event listeners
    document.addEventListener('keydown', handleKeyCombination);
    addVideoBtn.addEventListener('click', () => addVideoForm.style.display = 'block');
    cancelAddBtn.addEventListener('click', () => addVideoForm.style.display = 'none');
    submitVideoBtn.addEventListener('click', uploadVideo);
    
    // Cargar videos iniciales
    loadVideos();
    setMode('view');
});

// Funciones principales
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
/*
async function loadVideosForClassification(classification) {
    try {
        const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents/${classification}?ref=${config.branch}`);
        if (!response.ok) throw new Error(`Error al cargar videos para ${classification}`);
        
        const videos = await response.json();
        const idClass = classification.replace(/ /g, "-")
        
        // Crear el elemento del acordeón
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        
        // Crear el encabezado del acordeón
        const accordionHeader = document.createElement('h2');
        accordionHeader.className = 'accordion-header';
        accordionHeader.id = `heading-${idClass}`;
        
        const accordionButton = document.createElement('button');
        accordionButton.className = 'accordion-button collapsed';
        accordionButton.type = 'button';
        accordionButton.setAttribute('data-bs-toggle', 'collapse');
        accordionButton.setAttribute('data-bs-target', `#collapse-${idClass}`);
        accordionButton.setAttribute('aria-expanded', 'false');
        accordionButton.setAttribute('aria-controls', `collapse-${idClass}`);
        accordionButton.textContent = classification;
        
        accordionHeader.appendChild(accordionButton);
        
        // Crear el cuerpo del acordeón
        const accordionCollapse = document.createElement('div');
        accordionCollapse.id = `collapse-${idClass}`;
        accordionCollapse.className = 'accordion-collapse collapse';
        accordionCollapse.setAttribute('aria-labelledby', `heading-${idClass}`);
        accordionCollapse.setAttribute('data-bs-parent', '#videosContainer');
        
        const accordionBody = document.createElement('div');
        accordionBody.className = 'accordion-body';
        
        const row = document.createElement('div');
        row.className = 'row';
        
        for (const video of videos) {
            if (video.type === 'file' && isVideoFile(video.name)) {
                const videoElement = createVideoElement(classification, video);
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4 mb-4';
                col.appendChild(videoElement);
                row.appendChild(col);
            }
        }
        
        accordionBody.appendChild(row);
        accordionCollapse.appendChild(accordionBody);
        
        // Ensamblar el item del acordeón
        accordionItem.appendChild(accordionHeader);
        accordionItem.appendChild(accordionCollapse);
        
        // Agregar al contenedor principal
        videosContainer.appendChild(accordionItem);
    } catch (error) {
        console.error(`Error al cargar videos para ${classification}:`, error);
    }
}
    */
async function loadVideosForClassification(classification) {
    try {
        const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents/${classification}?ref=${config.branch}`);
        if (!response.ok) throw new Error(`Error al cargar videos para ${classification}`);
        
        const videos = await response.json();
        const classificationContainer = document.createElement('div');
        classificationContainer.className = 'classification-container mb-5';
        
        const classificationTitle = document.createElement('h2');
        classificationTitle.textContent = classification;
        classificationTitle.className = 'mb-3';
        classificationContainer.appendChild(classificationTitle);
        
        const videoList = document.createElement('ul');
        videoList.className = 'video-list';
        
        // Ordenar videos alfabéticamente
        videos.sort((a, b) => a.name.localeCompare(b.name));
        
        for (const video of videos) {
            if (video.type === 'file' && isVideoFile(video.name)) {
                const videoElement = createVideoElement(classification, video);
                videoList.appendChild(videoElement);
            }
        }
        
        classificationContainer.appendChild(videoList);
        videosContainer.appendChild(classificationContainer);
    } catch (error) {
        console.error(`Error al cargar videos para ${classification}:`, error);
    }
}
/*
function createVideoElement(classification, video) {
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card video-item h-100';
    
    const title = document.createElement('h4');
    title.textContent = video.name.replace(/\.[^/.]+$/, ''); // Remover extensión
    videoCard.appendChild(title);
    
    const videoPlayer = document.createElement('video');
    videoPlayer.className = 'video-player';
    videoPlayer.controls = true;
    videoPlayer.src = video.download_url;
    videoCard.appendChild(videoPlayer);
    
    if (currentMode === 'edit') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm mt-2';
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.onclick = () => deleteVideo(classification, video.name);
        videoCard.appendChild(deleteBtn);
    }
    
    return videoCard;
}
*/

function createVideoElement(classification, video) {
    const listItem = document.createElement('li');
    listItem.className = 'video-list-item';
    
    const title = document.createElement('span');
    title.textContent = video.name.replace(/\.[^/.]+$/, ''); // Remover extensión
    listItem.appendChild(title);
    
    const playBtn = document.createElement('button');
    playBtn.className = 'video-play-btn';
    playBtn.textContent = 'Play';
    playBtn.onclick = () => showVideoModal(video.download_url);
    listItem.appendChild(playBtn);
    
    if (currentMode === 'edit') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteVideo(classification, video.name);
        };
        listItem.appendChild(deleteBtn);
    }
    
    return listItem;
}

function showVideoModal(videoUrl) {
    const modalTitle = document.getElementById('videoModalTitle');
    const modalBody = document.getElementById('videoModalBody');
    
    modalBody.innerHTML = `<video controls autoplay class="w-100"><source src="${videoUrl}" type="video/mp4"></video>`;
    
    const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
    videoModal.show();
}

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
        
        for (const video of videos) {
            if (video.type === 'file' && isVideoFile(video.name)) {
                const listItem = document.createElement('button');
                listItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                listItem.textContent = `${classification}/${video.name}`;
                
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
        }
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
        // Leer el archivo como base64
        const fileContent = await readFileAsBase64(file);
        
        // Crear el contenido para GitHub API
        const content = fileContent.split(',')[1]; // Remover el prefijo data:...
        
        // Crear el commit
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
        addVideoForm.style.display = 'none';
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoClassification').value = '';
        document.getElementById('videoFile').value = '';
        
        // Recargar los videos
        loadVideos();
        if (currentMode === 'edit') {
            loadVideosForDeletion();
        }
    } catch (error) {
        showMessage('Error', `No se pudo subir el video: ${error.message}`);
    }
}

async function deleteVideo(classification, videoName) {
    if (!confirm(`¿Está seguro que desea eliminar ${classification}/${videoName}?`)) {
        return;
    }
    
    try {
        // Primero necesitamos obtener el SHA del archivo a eliminar
        const getResponse = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents/${classification}/${videoName}?ref=${config.branch}`);
        if (!getResponse.ok) throw new Error('No se pudo obtener información del video');
        
        const fileInfo = await getResponse.json();
        
        // Luego hacemos la solicitud para eliminar
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
        
        // Recargar los videos
        loadVideos();
        if (currentMode === 'edit') {
            loadVideosForDeletion();
        }
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
