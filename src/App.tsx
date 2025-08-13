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
    <div className="hero min-h-screen bg-gradient-to-br from-primary to-secondary">
      <div className="hero-content text-center">
        <div className="card bg-base-100/10 backdrop-blur-lg shadow-2xl border border-base-100/20">
          <div className="card-body">
            <h1 className="card-title text-4xl font-bold text-base-100 justify-center mb-8">
              Metronome
            </h1>
            
            <div className="space-y-6">
              {/* Time Signature Selection */}
              <div className="text-center">
                <label className="label">
                  <span className="label-text text-base-100 text-lg">Time Signature</span>
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {TIME_SIGNATURES.map((timeSig) => (
                    <button
                      key={timeSig.label}
                      onClick={() => handleTimeSignatureChange(timeSig)}
                      className={`btn btn-sm ${
                        selectedTimeSignature.label === timeSig.label
                          ? 'btn-primary'
                          : 'btn-outline btn-primary'
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
                        className={`badge badge-lg ${
                          currentBeat === i + 1
                            ? i === 0
                              ? 'badge-error animate-pulse'
                              : 'badge-warning animate-pulse'
                            : 'badge-neutral'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-base-100/70 text-sm">
                    Beat {currentBeat} of {selectedTimeSignature.beats}
                  </p>
                </div>
              )}
              
              {/* BPM Control */}
              <div className="text-center">
                <label className="label">
                  <span className="label-text text-base-100 text-lg">Tempo (BPM)</span>
                </label>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => handleBpmChange(Math.max(40, bpm - 1))}
                    className="btn btn-circle btn-outline btn-primary"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => handleBpmChange(Number(e.target.value))}
                    min="40"
                    max="240"
                    className="input input-bordered text-center text-2xl font-bold w-24 bg-base-100/20 text-base-100 border-base-100/20"
                  />
                  <button
                    onClick={() => handleBpmChange(Math.min(240, bpm + 1))}
                    className="btn btn-circle btn-outline btn-primary"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Start/Stop Button */}
              <div className="text-center">
                <button
                  onClick={toggleMetronome}
                  className={`btn btn-lg ${
                    isRunning
                      ? 'btn-error'
                      : isInitialized
                      ? 'btn-success'
                      : 'btn-primary'
                  }`}
                >
                  {!isInitialized ? 'Initialize Audio' : isRunning ? 'Stop' : 'Start'}
                </button>
              </div>
              
              {/* Status Display */}
              {isRunning && (
                <div className="text-center">
                  <p className="text-base-100/70 text-sm">
                    Playing {selectedTimeSignature.label} at {bpm} BPM
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;