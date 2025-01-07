import { useState, useEffect, useRef } from 'react';
import { videoData } from './data';
import { Filter, SkipBack, SkipForward } from 'lucide-react';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function App() {
  const [videos, setVideos] = useState(shuffleArray(videoData.videos));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const authors = Array.from(new Set(videoData.videos.map((video) => video.autor)));
  const categories = Array.from(new Set(videoData.videos.map((video) => video.categoria)));

  const toggleLoop = () => {
    setIsLooping((prev) => !prev);
    if (videoRef.current) {
      videoRef.current.loop = !isLooping; // Atualiza a propriedade loop do elemento <video>
    }
  };


  useEffect(() => {
    const filteredVideos = videoData.videos.filter((video) => {
      const categoryMatch = selectedCategory ? video.categoria === selectedCategory : true;
      const authorMatch = selectedAuthor ? video.autor === selectedAuthor : true;
      return categoryMatch && authorMatch;
    });
    setVideos(shuffleArray(filteredVideos));
    setCurrentIndex(0);
  }, [selectedCategory, selectedAuthor]);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      // Atualiza o tempo atual a cada mudança no vídeo
      const handleTimeUpdate = () => setCurrentTime(video.currentTime);

      // Define a duração do vídeo
      const handleLoadedMetadata = () => setDuration(video.duration);

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [videoRef]);


  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVideoEnd = () => {
    if (repeatCount < 3 && videoRef.current?.duration <= 40) {
      setRepeatCount((prev) => prev + 1);
      videoRef.current?.play();
    } else {
      setRepeatCount(0);
      if (!isLooping) {
        playNextVideo();
      } else {
        videoRef.current?.play();
      }
    }
  };

  const playNextVideo = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
    setRepeatCount(0);
  };

  const playPreviousVideo = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + videos.length) % videos.length);
    setRepeatCount(0);
  };

  const handlePausePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (videoRef.current.duration * newProgress) / 100;
    }
    setProgress(newProgress);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };


  const currentVideo = videos[currentIndex];

  return (
    <div className="min-h-screen bg-black text-orange-500">
      <div className="bg-black p-4 flex items-center justify-between">
        <h1 className="text-xl text-white font-bold">Nothing Here</h1>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded bg-orange-500 hover:bg-orange-400"
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-black p-4 flex gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <label className="text-sm">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-orange-600 rounded px-3 py-2"
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Author:</label>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="bg-orange-600 rounded px-3 py-2"
            >
              <option value="">All</option>
              {authors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {currentVideo && (
        <video
          ref={videoRef}
          key={currentVideo.url}
          className="w-full h-full object-contain"
          src={currentVideo.url}
          style={{ height: "500px" }}
          autoPlay
          onEnded={handleVideoEnd}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        />
      )}

      {/* Controles do vídeo */}
      <div className="flex flex-col items-center gap-4 justify-between bg-black p-4">
        {/* Timeline */}
        <div className="w-full px-4">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => {
              const time = Number(e.target.value);
              videoRef.current.currentTime = time;
              setCurrentTime(time);
            }}
            className="w-full mx-4 appearance-none h-2 bg-orange-500 rounded-lg cursor-pointer"
            style={{
              background: `linear-gradient(to right, orange ${(currentTime / duration) * 100}%, #ccc ${(currentTime / duration) * 100}%)`,
              WebkitAppearance: 'none',
            }}
          />
          <div className="flex items-center justify-between text-sm text-white mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex flex-row items-center gap-4 justify-between bg-black">
          {/* Botão Pause/Play */}
          <button
            onClick={handlePausePlay}
            className="bg-orange-500 hover:bg-orange-500 px-4 py-2 rounded"
          >
            {isPaused ? 'Play' : 'Pause'}
          </button>
          {/* Botão Anterior */}
          <button
            onClick={playPreviousVideo}
            className="bg-orange-500 hover:bg-orange-500 px-4 py-2 rounded"
          >
            <SkipBack />
          </button>

          {/* Botão Próximo */}
          <button
            onClick={playNextVideo}
            className="bg-orange-500 hover:bg-orange-500 px-4 py-2 rounded"
          >
            <SkipForward />
          </button>

          {/* Botão de Loop */}
          <button
            onClick={toggleLoop}
            className={`flex items-center justify-center px-4 py-2 rounded ${isLooping ? 'bg-orange-500 text-white' : 'bg-gray-800 text-white'
              } `}
          >
            Loop
          </button>
        </div>
      </div>

      <div className="text-orange-500 p-4">
        <p className="text-sm">
          Playing: {currentVideo?.autor} - {currentVideo?.categoria}
        </p>
      </div>
    </div>
  );
}

export default App;
