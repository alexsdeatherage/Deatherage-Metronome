import { useState } from 'react';
import * as Tone from 'tone';
import './App.css';

function App() {
  const [bpm, setBpm] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const synth = new Tone.Synth().toDestination();

  const playNote = () => {
    synth.triggerAttackRelease("C4", "8n");
  };

  const startMetronome = () => {
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.scheduleRepeat((time) => {
      playNote();
    }, "4n");
    Tone.Transport.start();
  };

  const toggleMetronome = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      startMetronome();
    } else {
      Tone.Transport.stop();
    }
  };

  return (
    <div>
      <h1>Metronome</h1>
      <div>
        <label htmlFor="bpm">Tempo (BPM): </label>
        <input
          id="bpm"
          type="number"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          min="40"
          max="240"
        />
      </div>
      <button onClick={toggleMetronome}>
        {isRunning ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}

export default App;