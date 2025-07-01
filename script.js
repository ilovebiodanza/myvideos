function encriptar(texto, desplazamiento) {
  return texto
    .split("")
    .map((char) => {
      // Solo encripta letras, deja otros caracteres como están
      if (char >= "A" && char <= "Z") {
        return String.fromCharCode(
          (char.charCodeAt(0) - 65 + desplazamiento + 26) % 26 + 65
        );
      } else if (char >= "a" && char <= "z") {
        return String.fromCharCode(
          (char.charCodeAt(0) - 97 + desplazamiento + 26) % 26 + 97
        );
      } else if (char >= "0" && char <= "9") {
        // Manejar números
        return String.fromCharCode(
          (char.charCodeAt(0) - 48 + desplazamiento + 10) % 10 + 48
        );
      }
      return char; // No modifica caracteres especiales como _, -, etc.
    })
    .join("");
}

// Configuración
const config = {
  // Asegúrate de actualizar la llamada a esta función en loadVideosForClassification:
  // Cambia playButton.onclick a:
  // playButton.onclick = () => showVideoInModal(video.download_url, videoTitle.textContent, classification);

  githubRepo: "ilovebiodanza/myvideos",
  branch: "main",
  token: encriptar("jks_TgJVT4PfbADYT9VVqsOKOne3k0qGrU0VHL3D", -3),
};  

// Variables de estado
let currentMode = "view";
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
document.addEventListener("DOMContentLoaded", function () {
  initElements();
  initEventListeners();
  loadVideos();
  setMode("view");
});

function initElements() {
  modeIndicator = document.getElementById("modeIndicator");
  adminPanel = document.getElementById("adminPanel");
  videosContainer = document.getElementById("videosContainer");
  addVideoBtn = document.getElementById("addVideoBtn");
  addVideoForm = document.getElementById("addVideoForm");
  submitVideoBtn = document.getElementById("submitVideoBtn");
  cancelAddBtn = document.getElementById("cancelAddBtn");
  deleteVideoList = document.getElementById("deleteVideoList");
  messageModal = new bootstrap.Modal(document.getElementById("messageModal"));
}

function initEventListeners() {
  document.addEventListener("keydown", handleKeyCombination);
  addVideoBtn.addEventListener(
    "click",
    () => (addVideoForm.style.display = "block")
  );
  cancelAddBtn.addEventListener(
    "click",
    () => (addVideoForm.style.display = "none")
  );
  submitVideoBtn.addEventListener("click", uploadVideo);
}

// Funciones de modo
function handleKeyCombination(e) {
  if (e.ctrlKey && e.shiftKey && e.key === "E") {
    setMode("edit");
    e.preventDefault();
  } else if (e.ctrlKey && e.shiftKey && e.key === "V") {
    setMode("view");
    e.preventDefault();
  }
}

function setMode(mode) {
  currentMode = mode;
  if (mode === "edit") {
    modeIndicator.textContent = "Modo Actualización";
    modeIndicator.className = "mode-indicator badge bg-danger";
    adminPanel.style.display = "block";
    loadVideosForDeletion();
  } else {
    modeIndicator.textContent = "Modo Visualización";
    modeIndicator.className = "mode-indicator badge bg-primary";
    adminPanel.style.display = "none";
  }
}

// Función recursiva para obtener todos los videos de un repositorio
async function getAllVideos(path = '') {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.githubRepo}/contents/${path}?ref=${config.branch}`
    );
    if (!response.ok) throw new Error("Error al cargar el contenido");

    const items = await response.json();
    let videos = [];

    for (const item of items) {
      if (item.type === "dir") {
        // Si es un directorio, explorar recursivamente
        const subVideos = await getAllVideos(item.path);
        videos = videos.concat(subVideos);
      } else if (item.type === "file" && isVideoFile(item.name)) {
        // Si es un archivo de video, agregarlo con su ruta completa
        videos.push({
          ...item,
          classification: path.split('/')[0], // La primera parte de la ruta es la clasificación principal
          fullPath: path // Guardamos la ruta completa para agrupación
        });
      }
    }

    return videos;
  } catch (error) {
    console.error(`Error al obtener videos de ${path}:`, error);
    return [];
  }
}

// Funciones para cargar videos
async function loadVideos() {
  try {
    const allVideos = await getAllVideos();
    videosContainer.innerHTML = "";
    
    // Agrupar videos por su ruta completa
    const videosByPath = groupVideosByPath(allVideos);
    
    // Crear acordeones para cada grupo
    for (const [path, videos] of Object.entries(videosByPath)) {
      createClassificationAccordion(path, videos);
    }
  } catch (error) {
    showMessage("Error", `No se pudieron cargar los videos: ${error.message}`);
  }
}

// Función para agrupar videos por su ruta
function groupVideosByPath(videos) {
  return videos.reduce((groups, video) => {
    const path = video.fullPath || video.classification || 'Videos';
    if (!groups[path]) {
      groups[path] = [];
    }
    groups[path].push(video);
    return groups;
  }, {});
}

async function loadVideosForClassification(classification) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.githubRepo}/contents/${classification}?ref=${config.branch}`
    );
    if (!response.ok)
      throw new Error(`Error al cargar videos para ${classification}`);

    const videos = await response.json();
    videos.sort((a, b) => a.name.localeCompare(b.name)); // Orden alfabético

    createClassificationAccordion(classification, videos);
  } catch (error) {
    console.error(`Error al cargar videos para ${classification}:`, error);
  }
}

function createClassificationAccordion(classification, videos) {
  const accordionItem = document.createElement("div");
  accordionItem.className = "accordion-item shadow-sm mb-3";

  // Extraer el nombre de visualización de la ruta (última parte)
  const displayName = classification.split('/').pop();
  
  const accordionHeader = document.createElement("h2");
  accordionHeader.className = "accordion-header";
  accordionHeader.id = `heading${classification.replace(/[^a-zA-Z0-9]/g, "")}`;

  const accordionButton = document.createElement("button");
  accordionButton.className = "accordion-button collapsed fw-semibold";
  accordionButton.type = "button";
  accordionButton.setAttribute("data-bs-toggle", "collapse");
  accordionButton.setAttribute(
    "data-bs-target",
    `#collapse${classification.replace(/[^a-zA-Z0-9]/g, "")}`
  );
  accordionButton.textContent = displayName;
  accordionHeader.appendChild(accordionButton);

  const accordionCollapse = document.createElement("div");
  accordionCollapse.id = `collapse${classification.replace(/[^a-zA-Z0-9]/g, "")}`;
  accordionCollapse.className = "accordion-collapse collapse";
  accordionCollapse.setAttribute(
    "aria-labelledby",
    `heading${classification.replace(/[^a-zA-Z0-9]/g, "")}`
  );
  accordionCollapse.setAttribute("data-bs-parent", "#videosContainer");

  const accordionBody = document.createElement("div");
  accordionBody.className = "accordion-body p-0";

  const listGroup = document.createElement("div");
  listGroup.className = "list-group list-group-flush";
  
  // Ordenar videos alfabéticamente
  videos.sort((a, b) => a.name.localeCompare(b.name));
  
  // Añadir videos a la lista
  videos.forEach((video) => {
    listGroup.appendChild(createVideoListItem(classification, video));
  });

  accordionBody.appendChild(listGroup);
  accordionCollapse.appendChild(accordionBody);
  accordionItem.appendChild(accordionHeader);
  accordionItem.appendChild(accordionCollapse);
  videosContainer.appendChild(accordionItem);
}

function createVideoListItem(classification, video) {
  const listItem = document.createElement("div");
  listItem.className =
    "list-group-item d-flex justify-content-between align-items-center px-3 py-2";

  const videoTitle = document.createElement("span");
  videoTitle.className = "text-break"; // Añadido para manejo de texto largo
  videoTitle.nameOk = video.name.replace(/\.[^/.]+$/, "");
  videoTitle.textContent = videoTitle.nameOk.replace(
    "Yo amo Biodanza",
    "Yo❤Biodanza"
  );

  const playButton = document.createElement("button");
  playButton.className = "btn btn-primary btn-sm ms-2";
  playButton.textContent = "Play";
  playButton.onclick = () =>
    showVideoInModal(video.download_url, videoTitle.nameOk, classification);

  listItem.appendChild(videoTitle);
  listItem.appendChild(playButton);

  if (currentMode === "edit") {
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm ms-2";
    deleteBtn.textContent = "Eliminar";
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
  const modalId = "videoModal_" + Math.random().toString(36).substr(2, 9);

  const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-xl">
                <div class="modal-content video-modal-content bg-black">
                    <div class="modal-header border-0 bg-black">
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body p-0 d-flex flex-column justify-content-center align-items-center text-center text-white video-modal-container">
                        <!-- Pantalla de intro -->
                        <div id="intro-screen" class="d-flex flex-column align-items-center justify-content-center w-100 h-100 position-absolute top-0 start-0">
                            <img src="http://ilovebiodanza.github.io/myimages/perfil/logo - yo amo biodanza - fondo transparente.png" alt="Logo" class="mb-4" style="max-width: 200px;">
                            <h3 class="text-uppercase mb-2">${classification}</h3>
                            <h2 class="display-5">${videoTitle}</h2>
                        </div>
                        
                        <!-- Reproductor de video -->
                        <div class="video-wrapper w-100 h-100 d-flex justify-content-center align-items-center">
                            <video id="video-player" controls class="d-none" style="max-width: 100%; max-height: 100%;">
                                <source src="${videoUrl}" type="video/mp4">
                            </video>
                        </div>
                        
                        <!-- Pantalla de fin -->
                        <div id="end-screen" class="d-none flex-column align-items-center justify-content-center w-100 h-100 position-absolute top-0 start-0">
                            <img src="http://ilovebiodanza.github.io/myimages/perfil/logo - yo amo biodanza - fondo transparente.png" alt="Logo" class="mb-4" style="max-width: 200px;">
                            <h2 class="display-5">Fin del video</h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  const videoModal = new bootstrap.Modal(document.getElementById(modalId));
  const videoElement = document.querySelector(`#${modalId} #video-player`);
  const introScreen = document.querySelector(`#${modalId} #intro-screen`);
  const endScreen = document.querySelector(`#${modalId} #end-screen`);
  const videoWrapper = document.querySelector(`#${modalId} .video-wrapper`);

  // Mostrar modal
  videoModal.show();

  // Configurar temporizador para la intro
  const introTimer = setTimeout(() => {
    introScreen.classList.add("d-none");
    videoElement.classList.remove("d-none");
    videoElement.play();
  }, 5000); // 5 segundos

  // Manejar el final del video
  videoElement.addEventListener("ended", () => {
    videoElement.classList.add("d-none");
    endScreen.classList.remove("d-none");
  });

  // Redimensionar responsivamente
  videoElement.onloadedmetadata = function () {
    const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    const windowHeight = window.innerHeight * 0.7;
    const windowWidth = window.innerWidth * 0.9;

    if (windowWidth / aspectRatio <= windowHeight) {
      videoElement.style.width = `${windowWidth}px`;
      videoElement.style.height = "auto";
    } else {
      videoElement.style.height = `${windowHeight}px`;
      videoElement.style.width = "auto";
    }
  };

  // Ajustar tamaño cuando cambia la ventana
  window.addEventListener("resize", function () {
    if (videoElement.videoWidth) {
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
      const windowHeight = window.innerHeight * 0.7;
      const windowWidth = window.innerWidth * 0.9;

      if (windowWidth / aspectRatio <= windowHeight) {
        videoElement.style.width = `${windowWidth}px`;
        videoElement.style.height = "auto";
      } else {
        videoElement.style.height = `${windowHeight}px`;
        videoElement.style.width = "auto";
      }
    }
  });

  // Limpieza al cerrar el modal
  document.getElementById(modalId).addEventListener("hidden.bs.modal", () => {
    clearTimeout(introTimer);
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
    window.removeEventListener("resize", this);
    modalContainer.remove();
  });
}
// Funciones de administración
async function loadVideosForDeletion() {
  try {
    const allVideos = await getAllVideos();
    deleteVideoList.innerHTML = "";

    // Agrupar videos por su ruta completa
    const videosByPath = groupVideosByPath(allVideos);
    
    // Crear elementos de lista para eliminación
    for (const [path, videos] of Object.entries(videosByPath)) {
      const groupHeader = document.createElement("div");
      groupHeader.className = "list-group-item list-group-item-secondary fw-bold";
      groupHeader.textContent = path;
      deleteVideoList.appendChild(groupHeader);
      
      videos.forEach((video) => {
        const listItem = document.createElement("button");
        listItem.className =
          "list-group-item list-group-item-action d-flex justify-content-between align-items-center ps-4";
        listItem.textContent = `${video.fullPath}/${video.name.replace(
          /\.[^/.]+$/,
          ""
        )}`;

        const deleteBtn = document.createElement("span");
        deleteBtn.className = "badge bg-danger rounded-pill";
        deleteBtn.textContent = "Eliminar";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          deleteVideo(video.fullPath, video.name);
        };

        listItem.appendChild(deleteBtn);
        deleteVideoList.appendChild(listItem);
      });
    }
  } catch (error) {
    showMessage(
      "Error",
      `No se pudieron cargar los videos para eliminación: ${error.message}`
    );
  }
}

async function loadVideosListForDeletion(classification) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.githubRepo}/contents/${classification}?ref=${config.branch}`
    );
    if (!response.ok)
      throw new Error(`Error al cargar videos para ${classification}`);

    const videos = await response.json();

    videos.forEach((video) => {
      if (video.type === "file" && isVideoFile(video.name)) {
        const listItem = document.createElement("button");
        listItem.className =
          "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
        listItem.textContent = `${classification}/${video.name.replace(
          /\.[^/.]+$/,
          ""
        )}`;

        const deleteBtn = document.createElement("span");
        deleteBtn.className = "badge bg-danger rounded-pill";
        deleteBtn.textContent = "Eliminar";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          deleteVideo(classification, video.name);
        };

        listItem.appendChild(deleteBtn);
        deleteVideoList.appendChild(listItem);
      }
    });
  } catch (error) {
    console.error(
      `Error al cargar videos para eliminación en ${classification}:`,
      error
    );
  }
}

async function uploadVideo() {
    const title = document.getElementById("videoTitle").value.trim();
    const classification = document.getElementById("videoClassification").value.trim();
    const fileInput = document.getElementById("videoFile");

    if (!title || !classification || !fileInput.files.length) {
        showMessage("Error", "Por favor complete todos los campos");
        return;
    }

    // Mostrar indicador de carga
    const uploadIndicator = document.getElementById("uploadIndicator");
    const uploadTimer = uploadIndicator.querySelector(".upload-timer");
    uploadIndicator.style.display = "flex";
    
    let seconds = 0;
    const timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        uploadTimer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);

    const file = fileInput.files[0];
    const fileName = `${title}.${file.name.split(".").pop()}`;
    const path = classification; // Ahora puede incluir subdirectorios (ej: "clasificacion/subdirectorio")

    try {
        const fileContent = await readFileAsBase64(file);
        const content = fileContent.split(",")[1];

        // Verificar si el directorio existe, si no, crearlo
        await ensureDirectoryExists(path);

        const response = await fetch(
            `https://api.github.com/repos/${config.githubRepo}/contents/${path}/${fileName}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `token ${config.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: `Agregar video: ${fileName}`,
                    content: content,
                    branch: config.branch,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al subir el video");
        }

        showMessage("Éxito", "Video subido correctamente");
        resetForm();
        loadVideos();
        if (currentMode === "edit") loadVideosForDeletion();
    } catch (error) {
        showMessage("Error", `No se pudo subir el video: ${error.message}`);
    } finally {
        // Ocultar indicador de carga
        clearInterval(timerInterval);
        uploadIndicator.style.display = "none";
    }
}

// Función para asegurar que un directorio exista (crea todos los directorios necesarios en la ruta)
async function ensureDirectoryExists(path) {
    const parts = path.split('/');
    let currentPath = '';
    
    for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${config.githubRepo}/contents/${currentPath}?ref=${config.branch}`
            );
            
            if (response.status === 404) {
                // El directorio no existe, hay que crearlo
                const createResponse = await fetch(
                    `https://api.github.com/repos/${config.githubRepo}/contents/${currentPath}/.gitkeep`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `token ${config.token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            message: `Crear directorio: ${currentPath}`,
                            content: btoa(""), // Archivo vacío
                            branch: config.branch,
                        }),
                    }
                );
                
                if (!createResponse.ok) {
                    throw new Error(`No se pudo crear el directorio ${currentPath}`);
                }
            } else if (!response.ok) {
                throw new Error(`Error al verificar el directorio ${currentPath}`);
            }
        } catch (error) {
            throw new Error(`Error al asegurar el directorio ${currentPath}: ${error.message}`);
        }
    }
}

async function deleteVideo(path, videoName) {
  if (!confirm(`¿Está seguro que desea eliminar ${path}/${videoName}?`))
    return;

  try {
    const getResponse = await fetch(
      `https://api.github.com/repos/${config.githubRepo}/contents/${path}/${videoName}?ref=${config.branch}`
    );
    if (!getResponse.ok)
      throw new Error("No se pudo obtener información del video");

    const fileInfo = await getResponse.json();

    const deleteResponse = await fetch(
      `https://api.github.com/repos/${config.githubRepo}/contents/${path}/${videoName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `token ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Eliminar video: ${videoName}`,
          sha: fileInfo.sha,
          branch: config.branch,
        }),
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(errorData.message || "Error al eliminar el video");
    }

    showMessage("Éxito", "Video eliminado correctamente");
    loadVideos();
    if (currentMode === "edit") loadVideosForDeletion();
  } catch (error) {
    showMessage("Error", `No se pudo eliminar el video: ${error.message}`);
  }
}

// Funciones auxiliares
function isVideoFile(filename) {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
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
  document.getElementById("messageModalTitle").textContent = title;
  document.getElementById("messageModalBody").textContent = message;
  messageModal.show();
}

function resetForm() {
  addVideoForm.style.display = "none";
  document.getElementById("videoTitle").value = "";
  document.getElementById("videoClassification").value = "";
  document.getElementById("videoFile").value = "";
}
