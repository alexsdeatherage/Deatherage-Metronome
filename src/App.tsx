import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface TimeSignature {
  beats: number;
  noteValue: number;
  label: string;
}

const TIME_SIGNATURES: TimeSignature[] = [
  { beats: 2, noteValue: 4, label: '2/4' },
  { beats: 3, noteValue: 4, label: '3/4' },
  { beats: 4, noteValue: 4, label: '4/4' },
  { beats: 6, noteValue: 8, label: '6/8' },
  { beats: 3, noteValue: 8, label: '3/8' },
  { beats: 5, noteValue: 4, label: '5/4' },
  { beats: 7, noteValue: 4, label: '7/4' },
];

function App() {
  const [bpm, setBpm] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTimeSignature, setSelectedTimeSignature] = useState<TimeSignature>(TIME_SIGNATURES[2]); // Default to 4/4
  const [currentBeat, setCurrentBeat] = useState(1);
  const synthRef = useRef<Tone.Synth | null>(null);
  const accentSynthRef = useRef<Tone.Synth | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize Tone.js synths
  useEffect(() => {
    // Regular beat synth
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
    
    // Accent beat synth (higher pitch and volume)
    accentSynthRef.current = new Tone.Synth({
      oscillator: {
        type: "sawtooth"
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.4,
        release: 0.2
      }
    }).toDestination();
    
    // Set accent synth to be louder
    accentSynthRef.current.volume.value = 6;
    
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (accentSynthRef.current) {
        accentSynthRef.current.dispose();
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

  const playClick = (isAccent: boolean = false) => {
    if (isAccent && accentSynthRef.current) {
      accentSynthRef.current.triggerAttackRelease("C7", "8n");
    } else if (synthRef.current) {
      synthRef.current.triggerAttackRelease("C6", "8n");
    }
  };

  const startMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setCurrentBeat(1);
    const intervalMs = (60 / bpm) * 1000;
    
    // Play first beat immediately
    playClick(true);
    
    intervalRef.current = window.setInterval(() => {
      setCurrentBeat(prevBeat => {
        const nextBeat = prevBeat === selectedTimeSignature.beats ? 1 : prevBeat + 1;
        const isAccent = nextBeat === 1;
        playClick(isAccent);
        return nextBeat;
      });
    }, intervalMs);
  };

  const stopMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentBeat(1);
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

  const handleTimeSignatureChange = (timeSignature: TimeSignature) => {
    setSelectedTimeSignature(timeSignature);
    // If metronome is running, restart with new time signature
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
          {/* Time Signature Selection */}
          <div className="text-center">
            <label className="block text-white text-lg mb-3">
              Time Signature
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {TIME_SIGNATURES.map((timeSig) => (
                <button
                  key={timeSig.label}
                  onClick={() => handleTimeSignatureChange(timeSig)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedTimeSignature.label === timeSig.label
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {timeSig.label}
                </button>
              ))}
            </div>
          </div>

          {/* Beat Indicators */}
          {isRunning && (
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-3">
                {Array.from({ length: selectedTimeSignature.beats }, (_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      currentBeat === i + 1
                        ? i === 0
                          ? 'bg-red-500 scale-125 animate-pulse'
                          : 'bg-yellow-400 scale-110 animate-pulse'
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <p className="text-white/70 text-sm">
                Beat {currentBeat} of {selectedTimeSignature.beats}
              </p>
            </div>
          )}
          
          {/* BPM Control */}
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
          
          {/* Start/Stop Button */}
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
          
          {/* Status Display */}
          {isRunning && (
            <div className="text-center">
              <p className="text-white/70 text-sm">
                Playing {selectedTimeSignature.label} at {bpm} BPM
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;