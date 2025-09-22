import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Upload, 
  Trash2, 
  Volume2,
  Wifi,
  WifiOff
} from 'lucide-react';
import io from 'socket.io-client';
import './App.css';

// WebSocket connection
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://walkman-esp-backend.onrender.com';

function App() {
  // Audio and playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  // Playlist state
  const [playlist, setPlaylist] = useState([]);
  
  // UI state
  const [isConnected, setIsConnected] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  
  // Audio visualization
  const [audioData, setAudioData] = useState(new Array(32).fill(0));
  
  // Refs
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Load playlist from localStorage on mount
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('webplayer-playlist');
    if (savedPlaylist) {
      try {
        const parsed = JSON.parse(savedPlaylist);
        setPlaylist(parsed);
      } catch (error) {
        console.error('Error loading playlist:', error);
      }
    }
  }, []);
  
  // Save playlist to localStorage when it changes
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem('webplayer-playlist', JSON.stringify(playlist));
    }
  }, [playlist]);
  
  // WebSocket connection
  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });
    
    socketRef.current.on('connect', () => {
      console.log('Connected to backend');
      setIsConnected(true);
      // Send current song info when connected
      sendSongInfo();
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from backend');
      setIsConnected(false);
    });
    
    socketRef.current.on('command', (data) => {
      console.log('Received command:', data);
      setLastCommand(data);
      handleRemoteCommand(data.command);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  // Send song info to backend when song changes or playback state changes
  const sendSongInfo = () => {
    if (socketRef.current && socketRef.current.connected) {
      const songInfo = {
        songName: currentSong ? currentSong.name : 'No Song',
        isPlaying: isPlaying,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
        trackNumber: currentTrack + 1,
        totalTracks: playlist.length
      };
      
      socketRef.current.emit('songInfo', songInfo);
      console.log('Sent song info:', songInfo);
    }
  };
  
  // Send song info when relevant state changes
  useEffect(() => {
    sendSongInfo();
  }, [currentSong, isPlaying, currentTrack, playlist.length]);
  
  // Audio context for visualization
  useEffect(() => {
    if (audioRef.current && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        analyserRef.current.fftSize = 64;
      } catch (error) {
        console.error('Error setting up audio context:', error);
      }
    }
  }, [playlist]);
  
  // Audio visualization animation
  useEffect(() => {
    let animationId;
    
    const updateAudioData = () => {
      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Normalize and smooth the data
        const normalizedData = Array.from(dataArray).map(value => value / 255);
        setAudioData(normalizedData);
      }
      animationId = requestAnimationFrame(updateAudioData);
    };
    
    if (isPlaying) {
      updateAudioData();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying]);
  
  // Handle remote commands from NodeMCU
  const handleRemoteCommand = async (command) => {
    console.log('Handling remote command:', command);
    
    try {
      switch (command) {
        case 'playpause':
          await togglePlayPause();
          break;
        case 'play':
          if (!isPlaying) await togglePlayPause();
          break;
        case 'pause':
          if (isPlaying) await togglePlayPause();
          break;
        case 'next':
          nextTrack();
          break;
        case 'prev':
          previousTrack();
          break;
        default:
          console.warn('Unknown command:', command);
      }
    } catch (error) {
      console.error('Error handling remote command:', error);
    }
  };
  
  // Playback controls
  const togglePlayPause = async () => {
    if (!audioRef.current || playlist.length === 0) return;
    
    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };
  
  const nextTrack = () => {
    if (playlist.length === 0) return;
    const next = (currentTrack + 1) % playlist.length;
    setCurrentTrack(next);
    setCurrentTime(0);
  };
  
  const previousTrack = () => {
    if (playlist.length === 0) return;
    const prev = currentTrack === 0 ? playlist.length - 1 : currentTrack - 1;
    setCurrentTrack(prev);
    setCurrentTime(0);
  };
  
  // File upload handling
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const newTrack = {
          id: Date.now() + Math.random(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: url,
          file: file
        };
        
        setPlaylist(prev => [...prev, newTrack]);
      }
    });
    
    event.target.value = '';
  };
  
  const removeTrack = (trackId) => {
    setPlaylist(prev => {
      const newPlaylist = prev.filter(track => track.id !== trackId);
      const removedIndex = prev.findIndex(track => track.id === trackId);
      
      if (removedIndex === currentTrack && newPlaylist.length > 0) {
        setCurrentTrack(0);
      } else if (removedIndex < currentTrack) {
        setCurrentTrack(prev => prev - 1);
      }
      
      return newPlaylist;
    });
  };
  
  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleEnded = () => {
    nextTrack();
  };
  
  // Format time helper
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const currentSong = playlist[currentTrack];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className="app">
      <div className="walkman">
        {/* Header */}
        <div className="walkman-header">
          <div className="brand">
            <h1>WEB PLAYER</h1>
            <div className="connection-status">
              {isConnected ? (
                <><Wifi size={16} /> CONNECTED</>
              ) : (
                <><WifiOff size={16} /> OFFLINE</>
              )}
            </div>
          </div>
        </div>
        
        {/* Display Screen */}
        <div className="display-screen">
          <div className="track-info">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTrack}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="track-details"
              >
                {currentSong ? (
                  <>
                    <h2 className="track-name">{currentSong.name}</h2>
                    <div className="track-progress">
                      <span className="time">{formatTime(currentTime)}</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="time">{formatTime(duration)}</span>
                    </div>
                  </>
                ) : (
                  <div className="no-track">
                    <p>No tracks loaded</p>
                    <button 
                      className="upload-btn-inline"
                      onClick={() => setShowUpload(true)}
                    >
                      Add Music
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Audio Visualizer */}
          <div className="visualizer">
            {audioData.map((value, index) => (
              <motion.div
                key={index}
                className="visualizer-bar"
                animate={{
                  height: `${Math.max(2, value * 100)}%`,
                  opacity: isPlaying ? 0.7 + value * 0.3 : 0.3
                }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
        </div>
        
        {/* Controls */}
        <div className="controls">
          <motion.button
            className="control-btn"
            onClick={previousTrack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={playlist.length === 0}
          >
            <SkipBack size={24} />
          </motion.button>
          
          <motion.button
            className="control-btn play-btn"
            onClick={togglePlayPause}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={playlist.length === 0}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </motion.button>
          
          <motion.button
            className="control-btn"
            onClick={nextTrack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={playlist.length === 0}
          >
            <SkipForward size={24} />
          </motion.button>
        </div>
        
        {/* Volume Control */}
        <div className="volume-control">
          <Volume2 size={16} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              setVolume(newVolume);
              if (audioRef.current) {
                audioRef.current.volume = newVolume;
              }
            }}
            className="volume-slider"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="action-buttons">
          <motion.button
            className="action-btn"
            onClick={() => setShowUpload(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload size={16} />
            Add Music
          </motion.button>
        </div>
        
        {/* Last Command Indicator */}
        <AnimatePresence>
          {lastCommand && (
            <motion.div
              className="command-indicator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              Remote: {lastCommand.command.toUpperCase()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Manage Playlist</h3>
              
              <div className="upload-section">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={20} />
                  Upload Audio Files
                </button>
              </div>
              
              <div className="playlist">
                {playlist.length === 0 ? (
                  <p className="empty-playlist">No tracks in playlist</p>
                ) : (
                  playlist.map((track, index) => (
                    <div
                      key={track.id}
                      className={`playlist-item ${index === currentTrack ? 'active' : ''}`}
                    >
                      <span className="track-name">{track.name}</span>
                      <button
                        className="remove-btn"
                        onClick={() => removeTrack(track.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <button
                className="close-btn"
                onClick={() => setShowUpload(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden Audio Element */}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          volume={volume}
          preload="metadata"
        />
      )}
    </div>
  );
}

export default App;