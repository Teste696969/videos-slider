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
  const [selectedCategory, setSelectedCategory] = useState('2D/3D'); // Categoria padrão
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );
  const [showFilters, setShowFilters] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerVideoRef = useRef<HTMLVideoElement>(null);

  const getAuthorCounts = () => {
    const filteredVideos = videoData.videos.filter(
      (video) => !selectedCategory || video.categoria === selectedCategory
    );
    const counts = filteredVideos.reduce((acc, video) => {
      acc[video.autor] = (acc[video.autor] || 0) + 1;
      return acc;
    }, {});
    return counts;
  };

  const authors = Array.from(
    new Set(
      videoData.videos
        .filter((video) => !selectedCategory || video.categoria === selectedCategory)
        .map((video) => video.autor)
    )
  );

  const categories = Array.from(new Set([
    '2D/3D',  // Nova categoria combinada
    ...videoData.videos.map((video) => video.categoria)
  ]));

  const toggleLoop = () => {
    setIsLooping((prev) => !prev);
    if (videoRef.current) {
      videoRef.current.loop = !isLooping; // Atualiza a propriedade loop do elemento <video>
    }
  };
  const focusVideo = () => {
    if (videoRef.current) {
      videoRef.current.focus();
    }
  };
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener("resize", handleOrientationChange);
    return () => window.removeEventListener("resize", handleOrientationChange);
  }, []);

  useEffect(() => {
    const filteredVideos = videoData.videos.filter((video) => {
      const categoryMatch = selectedCategory === '2D/3D'
        ? (video.categoria === '2d' || video.categoria === '3d')
        : (selectedCategory ? video.categoria === selectedCategory : true);
      const authorMatch = selectedAuthor ? video.autor === selectedAuthor : true;
      return categoryMatch && authorMatch;
    });
    setVideos(shuffleArray(filteredVideos));
    setCurrentIndex(0);
  }, [selectedCategory, selectedAuthor]);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      const handleTimeUpdate = () => setCurrentTime(video.currentTime);
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
    setRepeatCount(0);
    if (!isLooping) {
      playNextVideo();
    } else {
      videoRef.current?.play();
    }

    // Verifica se o vídeo atual está em fullscreen
    if (document.fullscreenElement) {
      // Reentra no modo fullscreen após a troca
      videoRef.current?.requestFullscreen();
    }
  };

  const handleVideoWaiting = () => {
    if (!currentVideo?.url) {
      console.warn("Video source is empty. Skipping to the next.");
      playNextVideo();
      return;
    }

    if (loadingTimeout) clearTimeout(loadingTimeout); // Limpa qualquer timeout anterior

    const timeout = setTimeout(() => {
      console.warn("Video is taking too long to load. Skipping to the next.");
      playNextVideo();
    }, 10000); // 10 segundos de limite

    setLoadingTimeout(timeout);
  };

  const handleVideoPlaying = () => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };

  const playNextVideo = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
    setRepeatCount(0);

    // Verifica se o vídeo atual está em fullscreen
    if (document.fullscreenElement) {
      // Reentra no modo fullscreen após a troca
      videoRef.current?.requestFullscreen();
    }
  };

  const playPreviousVideo = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + videos.length) % videos.length);
    setRepeatCount(0);
  };

  const toggleOrientation = async () => {
    if (screen.orientation && screen.orientation.lock) {
      try {
        
        const newOrientation =
          screen.orientation.type.startsWith("portrait")
            ? "landscape"
            : "portrait";

        await screen.orientation.lock(newOrientation);
        focusVideo()
        console.log(`Orientação alterada para: ${screen.orientation.type}`);
      } catch (err) {
        console.error("Não foi possível mudar a orientação:", err);
      }
    } else {
      console.warn("Seu navegador não suporta screen.orientation.lock()");
    }
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

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.focus(); // Dá foco no vídeo
    }
  }, [currentVideo]); // Executa sempre que o vídeo atual mudar

  useEffect(() => {
    if (!currentVideo?.url) {
      console.warn("Video source is empty. Skipping to the next.");
      playNextVideo();
    }
  }, [currentVideo]);

  return (
    <div className="min-h-screen bg-black text-orange-500">
      <div className="bg-black p-4 flex items-center justify-between">
        <h1 className="text-xl text-white font-bold">Nothing Here</h1>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded bg-gray-800 hover:bg-orange-400"
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
              <option value="2D/3D">2D/3D</option> {/* Nova opção combinada */}
              {categories.filter(category => category !== '2D/3D').map((category) => (
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
              className="bg-gray-700 rounded px-3 py-2"
            >
              <option value="">All</option>
              {Object.entries(getAuthorCounts()).map(([author, count]) => (
                <option key={author} value={author}>
                  {author} ({count})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {currentVideo && (
        <div
          ref={containerVideoRef}
          style={{ height: isLandscape ? "385px" : "820px" }} // Altura dinâmica
        >
          <video
            ref={videoRef}
            key={currentVideo?.url || 'empty-video'}
            className="w-full h-full object-contain"
            src={currentVideo?.url || ''}
            autoPlay
            // controls
            onEnded={handleVideoEnd}
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onWaiting={handleVideoWaiting} // Configura timeout se o vídeo demorar
            onPlaying={handleVideoPlaying} // Limpa timeout quando o vídeo começar
            tabIndex={0}
          />
        </div>

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
              background: `linear-gradient(to right, orange ${(currentTime / duration) * 100}%,rgb(41, 40, 40) ${(currentTime / duration) * 100}%)`,
              WebkitAppearance: 'none',
            }}
          />
        </div>

        <div className="flex flex-col items-center gap-4 justify-between bg-black">
          <div className="flex flex-row items-center gap-4 justify-between bg-black">
            {/* Botão Pause/Play */}
            <button
              onClick={handlePausePlay}
              className="bg-gray-800 hover:bg-orange-500 px-4 py-2 rounded"
            >
              {isPaused ? 'Play' : 'Pause'}
            </button>
            {/* Botão Anterior */}
            <button
              onClick={playPreviousVideo}
              className="bg-gray-800 hover:bg-orange-500 px-4 py-2 rounded"
            >
              <SkipBack />
            </button>

            {/* Botão Próximo */}
            <button
              onClick={playNextVideo}
              className="bg-gray-800 hover:bg-orange-500 px-4 py-2 rounded"
            >
              <SkipForward />
            </button>

            {/* Botão de Loop */}
            <button
              onClick={toggleLoop}
              className={`flex items-center justify-center px-4 py-2 rounded ${isLooping ? 'bg-orange-500 text-white' : 'bg-gray-800 text-white'}`}
            >
              Loop
            </button>
          </div>

          <div className='flex flex-row items-center gap-4'>
            {/* Botão de Foco */}
            <button
              onClick={focusVideo}
              className="bg-gray-800 hover:bg-orange-500 px-4 py-2 rounded"
            >
              Focus
            </button>

            {/* Botão de Paisagem */}
            <button
              onClick={toggleOrientation}
              className="bg-gray-800 hover:bg-orange-500 px-4 py-2 rounded"
            >
              Mudar para Paisagem
            </button>
          </div>
        </div>
      </div>

      <div className="text-orange-500 flex flex-row items-center justify-center p-4">
        <p className="text-sm">
          {currentVideo?.autor} - {currentVideo?.categoria}
        </p>
      </div>
    </div>
  );
}

export default App;
