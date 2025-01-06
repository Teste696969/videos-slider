import './style.css';
import { videoData } from './src/data.js';
import { setupVideoPlayer } from './src/VideoPlayer.js';
import { setupAutoScroll } from './src/AutoScroll.js';
import { shuffleArray } from './src/utils/shuffle.js';

const app = document.querySelector('#app');

// Criar o container de vídeos
const videoContainer = document.createElement('div');
videoContainer.className = 'video-container';

// Configurar auto-scroll
const { button, scrollToNextVideo, isAutoScrollEnabled } = setupAutoScroll(videoContainer);

// Criar filtros para categoria e autor
const categorySelect = document.createElement('select');
categorySelect.className = 'filter-select';
categorySelect.innerHTML = `<option value="">All Categories</option>`;
const authorSelect = document.createElement('select');
authorSelect.className = 'filter-select';
authorSelect.innerHTML = `<option value="">All Authors</option>`;

// Obter categorias e autores únicos
const categories = [...new Set(videoData.videos.map(video => video.categoria))];
const authors = [...new Set(videoData.videos.map(video => video.autor))];

// Popular os selects
categories.forEach(category => {
  const option = document.createElement('option');
  option.value = category;
  option.textContent = category;
  categorySelect.appendChild(option);
});

authors.forEach(author => {
  const option = document.createElement('option');
  option.value = author;
  option.textContent = author;
  authorSelect.appendChild(option);
});

// Criar container para botões e filtros
const controlsContainer = document.createElement('div');
controlsContainer.className = 'controls-container';
controlsContainer.appendChild(button);
controlsContainer.appendChild(categorySelect);
controlsContainer.appendChild(authorSelect);

// Criar container principal
const container = document.createElement('div');
container.appendChild(controlsContainer);
container.appendChild(videoContainer);

// Variáveis para gerenciamento de carregamento
const BATCH_SIZE = 8;
let loadedVideos = 0;
let filteredVideos = shuffleArray(videoData.videos);

// Função para carregar vídeos com base nos filtros
function applyFilters() {
  const selectedCategory = categorySelect.value;
  const selectedAuthor = authorSelect.value;

  filteredVideos = videoData.videos.filter(video => {
    return (
      (!selectedCategory || video.categoria === selectedCategory) &&
      (!selectedAuthor || video.autor === selectedAuthor)
    );
  });

  filteredVideos = shuffleArray(filteredVideos); // Embaralhar vídeos filtrados
  loadedVideos = 0; // Resetar contagem de vídeos carregados
  videoContainer.innerHTML = ''; // Limpar vídeos anteriores
  loadBatch(); // Carregar o primeiro lote
}

// Adicionar eventos nos filtros
categorySelect.addEventListener('change', applyFilters);
authorSelect.addEventListener('change', applyFilters);

// Função para carregar lote de vídeos
function loadBatch() {
  const nextBatch = filteredVideos.slice(loadedVideos, loadedVideos + BATCH_SIZE);

  // Se não houver mais vídeos, encerrar
  if (nextBatch.length === 0) return;

  nextBatch.forEach(video => {
    const wrapper = document.createElement('div');
    wrapper.className = 'video-wrapper';

    const videoElement = document.createElement('video');
    videoElement.className = 'video';
    videoElement.src = video.url;
    videoElement.loop = false;
    videoElement.controls = true;
    videoElement.muted = false;
    videoElement.playsInline = true;

    videoElement.addEventListener('ended', () => {
      scrollToNextVideo();
      handleActiveVideo(null);
    });

    videoElement.addEventListener('play', () => {
      handleActiveVideo(videoElement);
    });

    wrapper.appendChild(videoElement);
    videoContainer.appendChild(wrapper);

    // Configurar observador para auto-play/pause
    setupVideoPlayer(videoElement, isAutoScrollEnabled);
  });

  loadedVideos += nextBatch.length;
  updateSentinel();
}

// Função para atualizar o sentinel
function updateSentinel() {
  const oldSentinel = document.querySelector('.sentinel');
  if (oldSentinel) oldSentinel.remove();

  const videos = videoContainer.querySelectorAll('.video-wrapper');
  const sentinelTarget = videos[videos.length - 2]; // Penúltimo vídeo

  if (sentinelTarget) {
    const sentinel = document.createElement('div');
    sentinel.className = 'sentinel';
    sentinelTarget.appendChild(sentinel);
    batchObserver.observe(sentinel);
  }
}

// Configurar observador para carregamento incremental
const batchObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadBatch();
    }
  });
});

// Inicializar o carregamento
loadBatch(); // Carregar o primeiro lote

// Adicionar container ao app
app.appendChild(container);
