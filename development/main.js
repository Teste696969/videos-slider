import './style.css';
import { videoData } from './src/data.js';
import { setupAutoScroll } from './src/AutoScroll.js';
import { shuffleArray } from './src/utils/shuffle.js';

const app = document.querySelector('#app');
const videoContainer = document.createElement('div');
videoContainer.className = 'video-container';

const { button, scrollToNextVideo, isAutoScrollEnabled } = setupAutoScroll(videoContainer);

const container = document.createElement('div');
container.appendChild(button);
container.appendChild(videoContainer);

app.appendChild(container);

const BATCH_SIZE = 20; // Quantidade de vídeos carregados por vez
let loadedVideos = 0;
let activeVideo = null; // Rastrea o vídeo ativo

// Shuffle videos
const randomizedVideos = shuffleArray(videoData.videos);

// Função para carregar um lote de vídeos
function loadBatch() {
  const nextBatch = randomizedVideos.slice(loadedVideos, loadedVideos + BATCH_SIZE);
  nextBatch.forEach(video => {
    const wrapper = document.createElement('div');
    wrapper.className = 'video-wrapper';

    const videoElement = document.createElement('video');
    videoElement.className = 'video';
    videoElement.src = video.url;
    videoElement.loop = false; // Desativar loop para controle manual
    videoElement.controls = true;
    videoElement.muted = false;
    videoElement.playsInline = true;

    // Evento ao terminar
    videoElement.addEventListener('ended', () => {
      scrollToNextVideo();
      playNextVideo(videoElement);
    });

    // Evento ao iniciar a reprodução
    videoElement.addEventListener('play', () => {
      handleActiveVideo(videoElement);
    });

    wrapper.appendChild(videoElement);
    videoContainer.appendChild(wrapper);
  });

  loadedVideos += BATCH_SIZE;
}

// Gerencia o vídeo ativo
function handleActiveVideo(newActiveVideo) {
  if (activeVideo && activeVideo !== newActiveVideo) {
    activeVideo.pause();
    activeVideo.currentTime = 0; // Reinicia o vídeo anterior
  }
  activeVideo = newActiveVideo;
}

// Reproduz o próximo vídeo
function playNextVideo(currentVideo) {
  const videos = Array.from(videoContainer.querySelectorAll('.video'));
  const currentIndex = videos.indexOf(currentVideo);

  if (currentIndex !== -1 && currentIndex + 1 < videos.length) {
    const nextVideo = videos[currentIndex + 1];
    nextVideo.scrollIntoView({ behavior: 'smooth' });
    nextVideo.play(); // Inicia o próximo vídeo automaticamente
    handleActiveVideo(nextVideo); // Atualiza o vídeo ativo
  }
}

// Configurar observador para carregamento incremental
const observerOptions = {
  root: null,
  rootMargin: '500px', // Precarregar vídeos próximos ao viewport
  threshold: 0
};

const batchObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && loadedVideos < randomizedVideos.length) {
      loadBatch();
      batchObserver.unobserve(entry.target); // Evita múltiplas execuções
    }
  });
});

// Inicializar o carregamento
loadBatch();

// Observar o final do contêiner
const sentinel = document.createElement('div');
sentinel.className = 'sentinel';
videoContainer.appendChild(sentinel);
batchObserver.observe(sentinel);
