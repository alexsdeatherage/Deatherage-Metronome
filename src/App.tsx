import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

function App() {
  const [bpm, setBpm] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize Tone.js synth
  useEffect(() => {
    synthRef.current = new Tone.Synth({
      oscillator: {
        type: "square"
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 0.1
      }
    }).toDestination();
    
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const initializeAudio = async () => {
    try {
      await Tone.start();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const playClick = () => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease("C6", "8n");
    }
  };

  const startMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const intervalMs = (60 / bpm) * 1000;
    playClick(); // Play first click immediately
    
    intervalRef.current = window.setInterval(() => {
      playClick();
    }, intervalMs);
  };

  const stopMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleMetronome = () => {
    if (!isInitialized) {
      initializeAudio();
      return;
    }
    
    if (!isRunning) {
      setIsRunning(true);
      startMetronome();
    } else {
      setIsRunning(false);
      stopMetronome();
    }
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    // If metronome is running, restart with new tempo
    if (isRunning) {
      stopMetronome();
      startMetronome();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Metronome
        </h1>
        
        <div className="space-y-6">
          <div className="text-center">
            <label htmlFor="bpm" className="block text-white text-lg mb-2">
              Tempo (BPM)
            </label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handleBpmChange(Math.max(40, bpm - 1))}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                -
              </button>
              <input
                id="bpm"
                type="number"
                value={bpm}
                onChange={(e) => handleBpmChange(Number(e.target.value))}
                min="40"
                max="240"
                className="bg-white/20 text-white text-center text-2xl font-bold rounded-lg px-4 py-2 w-24 border-none outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={() => handleBpmChange(Math.min(240, bpm + 1))}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={toggleMetronome}
              className={`px-8 py-4 rounded-full text-xl font-semibold transition-all transform hover:scale-105 ${
                isRunning
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : isInitialized
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {!isInitialized ? 'Initialize Audio' : isRunning ? 'Stop' : 'Start'}
            </button>
          </div>
          
          {isRunning && (
            <div className="text-center">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mx-auto"></div>
              <p className="text-white/70 text-sm mt-2">Playing at {bpm} BPM</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;