export function setupVideoPlayer(videoElement, isAutoScrollEnabled) {
  let options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.7
  };

  let observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        videoElement.play();
        // Update loop state based on auto-scroll
        videoElement.loop = !isAutoScrollEnabled();
      } else {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    });
  }, options);

  observer.observe(videoElement);

  return () => {
    observer.unobserve(videoElement);
  };
}