import './style.css';
import { videoData } from './src/data.js';
import { setupVideoPlayer } from './src/VideoPlayer.js';
import { setupAutoScroll } from './src/AutoScroll.js';
import { shuffleArray } from './src/utils/shuffle.js';

const app = document.querySelector('#app');

// Create video container
const videoContainer = document.createElement('div');
videoContainer.className = 'video-container';

// Setup auto-scroll
const { button, scrollToNextVideo, isAutoScrollEnabled } = setupAutoScroll(videoContainer);

// Create container div
const container = document.createElement('div');
container.appendChild(button);
container.appendChild(videoContainer);

// Randomize videos
const randomizedVideos = shuffleArray(videoData.videos);

// Create video elements
randomizedVideos.forEach((video) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';

  const videoElement = document.createElement('video');
  videoElement.className = 'video';
  videoElement.src = video.url;
  videoElement.loop = true; // Default to loop enabled
  videoElement.controls = true;
  videoElement.muted = false;
  videoElement.playsInline = true;
  
  // Add ended event listener for auto-scroll
  videoElement.addEventListener('ended', scrollToNextVideo);

  videoElement.addEventListener('loadeddata', () => {
    videoElement.classList.add('loaded');
  });

  wrapper.appendChild(videoElement);
  videoContainer.appendChild(wrapper);

  // Setup intersection observer for this video
  setupVideoPlayer(videoElement, isAutoScrollEnabled);
});

app.appendChild(container);