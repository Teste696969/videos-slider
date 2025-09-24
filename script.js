// Seleção de elementos do DOM
const playPauseBtn = document.querySelector(".play-pause-btn");
const fullScreenBtn = document.querySelector(".full-screen-btn");
const muteBtn = document.querySelector(".mute-btn");
const currentTimeElem = document.querySelector(".current-time");
const totalTimeElem = document.querySelector(".total-time")
const videoTitleElem = document.querySelector('.video-title');
const controlsContainer = document.querySelector('.video-controls-container');
const volumeSlider = document.querySelector(".volume-slider");
const videoContainer = document.querySelector(".video-container");
const timelineContainer = document.querySelector(".timeline-container");
const video = document.querySelector("video");

// Obtendo elementos do DOM relacionados à navegação
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const randomButton = document.getElementById('random-button');
const loopButton = document.getElementById('loop-button');

// Mutáveis e Variáveis
let videos = []; // Array que armazenará os dados do JSON
let maxVideoIndex = 0;
let hideControlsTimeout;
let isMouseOver = false;
let currentVideoIndex = 0; // Inicia em 0 (índice base do array)
let randomHistory = [];
let isLoopActive = false;
let isRandomActive = true; // Desative a reprodução aleatória por padrão
let videoQueue = [];

// Carregar o JSON assincronamente
fetch('Videos.json')
  .then(response => response.json())
  .then(data => {
    videos = data;
    maxVideoIndex = videos.length;
    videoQueue = Array.from({length: maxVideoIndex}, (_, i) => i); // Índices de 0 a maxVideoIndex-1
    console.log(videos)
    currentVideoIndex = 0;
    loadVideo(currentVideoIndex);
  })
  .catch(error => {
    console.error('Erro ao carregar Videos.json:', error);
    alert('Erro ao carregar a lista de vídeos. Verifique o console para mais detalhes.');
  });

// Função para encontrar o índice do vídeo pelo autor ou categoria
function findVideoIndexByName(searchTerm) {
  for (let i = 0; i < videos.length; i++) {
    const autor = videos[i].autor.toLowerCase();
    const categoria = videos[i].categoria.toLowerCase();
    if (autor.includes(searchTerm) || categoria.includes(searchTerm)) {
      return i;
    }
  }
  return null; // Retorna null se nenhum vídeo for encontrado
}

// Função para gerar um índice aleatório entre min e max (mantida, mas não usada diretamente)
function getRandomIndex(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para carregar um vídeo (adaptada para usar URL do JSON)
function loadVideo(index) {
  if (index < 0 || index >= maxVideoIndex) return; // Validação de índice
  video.src = videos[index].url;
  video.load();
  video.play();

  // Atualizar dinamicamente o título do vídeo usando autor e categoria
  videoTitleElem.textContent = `${videos[index].autor} - ${videos[index].categoria}`;
}

// Event Listener para o botão Anterior
prevButton.addEventListener('click', () => {
  if (isRandomActive) {
    if (randomHistory.length > 1) {
      randomHistory.pop(); // Remove o vídeo atual
      currentVideoIndex = randomHistory.pop(); // Obtém o vídeo anterior
      loadVideo(currentVideoIndex);
    }
  } else {
    if (currentVideoIndex > 0) {
      currentVideoIndex--;
      loadVideo(currentVideoIndex);
    }
  }
});

// Event Listener para o botão Próximo
nextButton.addEventListener('click', () => {
  if (isRandomActive) {
    getRandomVideo();
  } else {
    if (currentVideoIndex < maxVideoIndex - 1) {
      currentVideoIndex++;
      loadVideo(currentVideoIndex);
    } else {
      // Se atingir o último vídeo, retorne ao primeiro
      currentVideoIndex = 0;
      loadVideo(currentVideoIndex);
    }
  }
});

// Event Listener para o botão Aleatório
randomButton.addEventListener('click', () => {
  isRandomActive = !isRandomActive; // Alterne entre aleatório ativado/desativado

  if (isRandomActive) {
    randomButton.classList.add('active-random');
  } else {
    randomButton.classList.remove('active-random');
  }
});

// Função para obter o próximo vídeo aleatório (adaptada para índices 0-based)
function getRandomVideo() {
  if (videoQueue.length === 0) {
    videoQueue = Array.from({length: maxVideoIndex}, (_, i) => i);
  }

  const randomIndex = Math.floor(Math.random() * videoQueue.length);
  currentVideoIndex = videoQueue[randomIndex];
  videoQueue.splice(randomIndex, 1);

  // Adiciona o vídeo atual ao histórico
  randomHistory.push(currentVideoIndex);

  loadVideo(currentVideoIndex);
}

// Event Listener para o botão de Loop
loopButton.addEventListener('click', () => {
  isLoopActive = !isLoopActive;

  if (isLoopActive) {
    video.loop = true;
    loopButton.classList.add('active-loop');
  } else {
    video.loop = false;
    loopButton.classList.remove('active-loop');
  }
});

// Event Listener para o término do vídeo
video.addEventListener('ended', () => {
  if (isRandomActive) {
    getRandomVideo();
  } else {
    if (currentVideoIndex < maxVideoIndex - 1) {
      currentVideoIndex++;
      loadVideo(currentVideoIndex);
    } else {
      // Se atingir o último vídeo, retorne ao primeiro
      currentVideoIndex = 0;
      loadVideo(currentVideoIndex);
    }
  }
});

// Event Listener para eventos de teclado
document.addEventListener("keydown", e => {
  const tagName = document.activeElement.tagName.toLowerCase()

  if (tagName === "input") return

  switch (e.key.toLowerCase()) {
    case " ":
      if (tagName === "button") return
    case "k":
      togglePlay()
      break
    case "f":
      toggleFullScreenMode()
      break
    case "m":
      toggleMute()
      break
    case "arrowleft":
    case "j":
      skip(-5)
      break
    case "arrowright":
    case "l":
      skip(5)
      break
  }
})

// Timeline
timelineContainer.addEventListener("mousemove", handleTimelineUpdate)
timelineContainer.addEventListener("mousedown", toggleScrubbing)
document.addEventListener("mouseup", e => {
  if (isScrubbing) toggleScrubbing(e)
})
document.addEventListener("mousemove", e => {
  if (isScrubbing) handleTimelineUpdate(e)
})

let isScrubbing = false
let wasPaused
function toggleScrubbing(e) {
  const rect = timelineContainer.getBoundingClientRect()
  const percent = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width
  isScrubbing = (e.buttons & 1) === 1
  videoContainer.classList.toggle("scrubbing", isScrubbing)
  if (isScrubbing) {
    wasPaused = video.paused
    video.pause()
  } else {
    video.currentTime = percent * video.duration
    if (!wasPaused) video.play()
  }

  handleTimelineUpdate(e)
}

function handleTimelineUpdate(e) {
  const rect = timelineContainer.getBoundingClientRect()
  const percent = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width

  if (isScrubbing) {
    e.preventDefault()
    timelineContainer.style.setProperty("--progress-position", percent)
  }
}

// Duration
video.addEventListener("loadeddata", () => {
  totalTimeElem.textContent = formatDuration(video.duration)
})

video.addEventListener("timeupdate", () => {
  currentTimeElem.textContent = formatDuration(video.currentTime)
  const percent = video.currentTime / video.duration
  timelineContainer.style.setProperty("--progress-position", percent)
})

const leadingZeroFormatter = new Intl.NumberFormat(undefined, {
  minimumIntegerDigits: 2,
})
function formatDuration(time) {
  const seconds = Math.floor(time % 60)
  const minutes = Math.floor(time / 60) % 60
  const hours = Math.floor(time / 3600)
  if (hours === 0) {
    return `${minutes}:${leadingZeroFormatter.format(seconds)}`
  } else {
    return `${hours}:${leadingZeroFormatter.format(
      minutes
    )}:${leadingZeroFormatter.format(seconds)}`
  }
}

function skip(duration) {
  video.currentTime += duration
}

// Volume
muteBtn.addEventListener("click", toggleMute)
volumeSlider.addEventListener("input", e => {
  video.volume = e.target.value
  video.muted = e.target.value === 0
})

function toggleMute() {
  video.muted = !video.muted
}

video.addEventListener("volumechange", () => {
  volumeSlider.value = video.volume
  let volumeLevel
  if (video.muted || video.volume === 0) {
    volumeSlider.value = 0
    volumeLevel = "muted"
  } else if (video.volume >= 0.5) {
    volumeLevel = "high"
  } else {
    volumeLevel = "low"
  }

  videoContainer.dataset.volumeLevel = volumeLevel
})

// Modos de visualização
fullScreenBtn.addEventListener("click", toggleFullScreenMode)

function toggleFullScreenMode() {
  if (document.fullscreenElement == null) {
    videoContainer.requestFullscreen();
    controlsContainer.classList.add('fullscreen');
    hideControlsTimeout = setTimeout(() => {
      if (!video.paused) {
        controlsContainer.style.opacity = 0;
        document.body.style.cursor = 'none';
      }
    }, 2000);
  } else {
    document.exitFullscreen();
    controlsContainer.classList.remove('fullscreen');
    controlsContainer.style.opacity = 1;
    document.body.style.cursor = 'auto';
    clearTimeout(hideControlsTimeout);
  }
}

document.addEventListener('fullscreenchange', () => {
  videoContainer.classList.toggle('full-screen', document.fullscreenElement);
});

// Play/Pause
playPauseBtn.addEventListener("click", togglePlay)
video.addEventListener("click", togglePlay)

function togglePlay() {
  video.paused ? video.play() : video.pause()
}

video.addEventListener("play", () => {
  videoContainer.classList.remove("paused")
  hideControlsTimeout = setTimeout(() => {
    if (!isMouseOver) {
      controlsContainer.style.opacity = 0;
      document.body.style.cursor = 'none';
    }
  }, 2000);
})

video.addEventListener("pause", () => {
  videoContainer.classList.add("paused")
  clearTimeout(hideControlsTimeout);
  controlsContainer.style.opacity = 1;
  document.body.style.cursor = 'auto';
})

video.addEventListener('mousemove', () => {
  if (video.play) {
    controlsContainer.style.opacity = 1;
    document.body.style.cursor = 'auto';
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => {
      if (!video.paused) {
        controlsContainer.style.opacity = 0;
        document.body.style.cursor = 'none';
      }
    }, 2000);
  }
});
