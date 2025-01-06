import { useState, useEffect, useRef } from 'react';
import { videoData } from './data';
import { Filter } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState('2d');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0); 
  const videoRef = useRef<HTMLVideoElement>(null);

  const authors = Array.from(new Set(videoData.videos.map(video => video.autor)));
  const categories = Array.from(new Set(videoData.videos.map(video => video.categoria)));

  useEffect(() => {
    const filteredVideos = videoData.videos.filter(video => {
      const categoryMatch = selectedCategory ? video.categoria === selectedCategory : true;
      const authorMatch = selectedAuthor ? video.autor === selectedAuthor : true;
      return categoryMatch && authorMatch;
    });
    setVideos(shuffleArray(filteredVideos));
    setCurrentIndex(0);
  }, [selectedCategory, selectedAuthor]);

  const handleVideoEnd = () => {
    if (repeatCount < 2 && videoRef.current?.duration <= 30) {
      setRepeatCount((prev) => prev + 1);
      videoRef.current?.play(); // Reproduzir novamente
    } else {
      setRepeatCount(0); // Resetar a contagem
      setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
    }
  };

  const playNextVideo = () => {
    setRepeatCount(0); // Resetar a contagem
    setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  const playPreviousVideo = () => {
    setRepeatCount(0); // Resetar a contagem
    setCurrentIndex((prevIndex) => (prevIndex - 1 + videos.length) % videos.length);
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('nexttrack', playNextVideo);
      navigator.mediaSession.setActionHandler('previoustrack', playPreviousVideo);
      
      return () => {
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      };
    }
  }, [videos]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentVideo) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Video by ${currentVideo.autor}`,
        artist: currentVideo.categoria,
      });
    }
  }, [currentIndex, videos]);

  const currentVideo = videos[currentIndex];

  const handleMetadataLoaded = () => {
    if (videoRef.current?.duration > 40) {
      setRepeatCount(0); // Resetar se o vídeo for maior que 40s
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="bg-black text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Nothing Here</h1>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700"
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-800 text-white p-4 flex gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <label className="text-sm">Category:</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-700 rounded px-3 py-2"
            >
              <option value="">All</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
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
              {authors.map(author => (
                <option key={author} value={author}>{author}</option>
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
            style={{ height: "650px"}}
            autoPlay
            controls
            onEnded={handleVideoEnd}
            onLoadedMetadata={handleMetadataLoaded}
          />
        )}

      <div className="text-white p-4">
        <p className="text-sm">
          Playing: {currentVideo?.autor} - {currentVideo?.categoria}
        </p>
      </div>
    </div>
  );
}

export default App;
