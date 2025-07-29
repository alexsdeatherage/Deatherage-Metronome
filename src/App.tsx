import { useState } from 'react';
import * as Tone from 'tone';
import './App.css';

function App() {
  const [bpm, setBpm] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const synth = new Tone.Synth().toDestination();

  const toggleMetronome = () => {
    setIsRunning(!isRunning);
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