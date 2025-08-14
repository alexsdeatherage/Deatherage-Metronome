import { useState, useEffect, useRef, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import * as Tone from 'tone';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Metronome Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="hero min-h-screen bg-gradient-to-br from-error to-error-content">
          <div className="hero-content text-center">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-error">Something went wrong</h2>
                <p>Please refresh the page to try again.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
      try {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Stop any ongoing audio
        if (synthRef.current) {
          synthRef.current.triggerRelease();
        }
        if (accentSynthRef.current) {
          accentSynthRef.current.triggerRelease();
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);

  const initializeAudio = async () => {
    try {
      // Check if audio context is already running
      if (Tone.context.state === 'running') {
        setIsInitialized(true);
        return;
      }
      
      // Start the audio context
      await Tone.start();
      
      // Ensure synths are properly connected
      if (synthRef.current) {
        synthRef.current.toDestination();
      }
      if (accentSynthRef.current) {
        accentSynthRef.current.toDestination();
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setIsInitialized(false);
    }
  };

  const playClick = (isAccent: boolean = false) => {
    try {
      if (isAccent && accentSynthRef.current) {
        accentSynthRef.current.triggerAttackRelease("C7", "8n");
      } else if (synthRef.current) {
        synthRef.current.triggerAttackRelease("C6", "8n");
      }
    } catch (error) {
      console.error('Error playing click:', error);
    }
  };

  const startMetronome = () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setCurrentBeat(1);
      const intervalMs = (60 / bpm) * 1000;
      
      // Ensure audio context is running
      if (Tone.context.state !== 'running') {
        Tone.context.resume();
      }
      
      // Play first beat after a small delay to ensure everything is ready
      setTimeout(() => {
        playClick(true);
      }, 50);
      
      intervalRef.current = window.setInterval(() => {
        try {
          setCurrentBeat(prevBeat => {
            const nextBeat = prevBeat === selectedTimeSignature.beats ? 1 : prevBeat + 1;
            const isAccent = nextBeat === 1;
            playClick(isAccent);
            return nextBeat;
          });
        } catch (error) {
          console.error('Error in metronome interval:', error);
          stopMetronome();
        }
      }, intervalMs);
    } catch (error) {
      console.error('Error starting metronome:', error);
      setIsRunning(false);
    }
  };

  const stopMetronome = () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentBeat(1);
    } catch (error) {
      console.error('Error stopping metronome:', error);
    }
  };

  const toggleMetronome = () => {
    try {
      if (!isInitialized) {
        initializeAudio();
        return;
      }
      
      if (!isRunning) {
        setIsRunning(true);
        // Small delay to ensure state is updated before starting
        setTimeout(() => {
          startMetronome();
        }, 10);
      } else {
        setIsRunning(false);
        stopMetronome();
      }
    } catch (error) {
      console.error('Error toggling metronome:', error);
      setIsRunning(false);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    try {
      const clampedBpm = Math.max(40, Math.min(240, newBpm));
      setBpm(clampedBpm);
      // If metronome is running, restart with new tempo
      if (isRunning) {
        stopMetronome();
        setTimeout(() => {
          if (isRunning) {
            startMetronome();
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error changing BPM:', error);
    }
  };

  const handleTimeSignatureChange = (timeSignature: TimeSignature) => {
    try {
      setSelectedTimeSignature(timeSignature);
      // If metronome is running, restart with new time signature
      if (isRunning) {
        stopMetronome();
        setTimeout(() => {
          if (isRunning) {
            startMetronome();
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error changing time signature:', error);
    }
  };

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;