export function setupAutoScroll(videoContainer) {
  let isAutoScrollEnabled = true;
  let currentVideoIndex = 0;

  // Create auto-scroll button
  const button = document.createElement('button');
  button.className = 'auto-scroll-button';
  button.textContent = '🔄 Auto-scroll: On';
  
  function toggleAutoScroll() {
    isAutoScrollEnabled = !isAutoScrollEnabled;
    button.textContent = `🔄 Auto-scroll: ${isAutoScrollEnabled ? 'On' : 'Off'}`;
    
    // Toggle loop for all videos
    const videos = videoContainer.querySelectorAll('video');
    videos.forEach(video => {
      video.loop = !isAutoScrollEnabled;
    });
  }

  function scrollToNextVideo() {
    if (!isAutoScrollEnabled) return;
    
    const videos = videoContainer.querySelectorAll('.video-wrapper');
    currentVideoIndex = (currentVideoIndex + 1) % videos.length;
    videos[currentVideoIndex].scrollIntoView({ behavior: 'smooth' });
  }

  button.addEventListener('click', toggleAutoScroll);

  return {
    button,
    scrollToNextVideo,
    isAutoScrollEnabled: () => isAutoScrollEnabled
  };
}