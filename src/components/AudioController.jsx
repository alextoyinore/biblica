import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import './AudioController.css';
import { BOOK_TO_ID, API_BIBLE_ID_MAP } from '../constants/bible';

// --- Procedural Ambient Sound Engine (Web Audio API) ---
class AmbientEngine {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.masterGain = null;
  }

  _getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }

  setVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  _createMaster(vol) {
    const ctx = this._getCtx();
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);
    this.masterGain = master;
    return master;
  }

  startRain(vol = 0.4) {
    this.stop();
    const ctx = this._getCtx();
    const master = this._createMaster(vol);

    // White noise buffer
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 1800;

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 300;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    noise.connect(lpf);
    lpf.connect(hpf);
    hpf.connect(gain);
    gain.connect(master);
    noise.start();

    this.nodes = [noise, lpf, hpf, gain];
  }

  startForest(vol = 0.4) {
    this.stop();
    const ctx = this._getCtx();
    const master = this._createMaster(vol);

    // Brown noise for wind
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const wind = ctx.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 600;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.18;

    wind.connect(lpf);
    lpf.connect(windGain);
    windGain.connect(master);
    wind.start();

    // Subtle cricket oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 3800;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.015;
    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start();

    this.nodes = [wind, lpf, windGain, osc, oscGain];
  }

  stop() {
    this.nodes.forEach(n => {
      try { n.stop?.(); n.disconnect?.(); } catch (e) { /* already stopped */ }
    });
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch (e) {}
      this.masterGain = null;
    }
    this.nodes = [];
  }
}

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'Silent' },
  { id: 'rain', name: 'Rain' },
  { id: 'forest', name: 'Forest' },
];

const AudioController = forwardRef(({ scripture, ambientVolume = 0.4, audioVolume = 1.0, apiKey, onAudioEnd, onPlayStateChange }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [ambientSound, setAmbientSound] = useState(AMBIENT_SOUNDS[0]);
  const [speed, setSpeed] = useState(0.9);
  const [isBuffering, setIsBuffering] = useState(false);
  const engineRef = useRef(new AmbientEngine());
  const isCancellingRef = useRef(false);

  // Notify parent of play state changes
  useEffect(() => {
    if (onPlayStateChange) onPlayStateChange(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    togglePlay: () => {
      handleTogglePlay();
    },
    play: () => {
      if (!isPlaying) handleTogglePlay();
    },
    playFromVerse: (verseNum) => {
      isCancellingRef.current = true;
      window.speechSynthesis.cancel();
      isCancellingRef.current = false;
      setIsPlaying(false);
      setTimeout(() => {
        handleTogglePlay(verseNum);
      }, 50);
    }
  }));

  // Cancel speech if scripture changes
  useEffect(() => {
    isCancellingRef.current = true;
    window.speechSynthesis.cancel();
    isCancellingRef.current = false;
    setIsPlaying(false);
  }, [scripture]);

  // Sync volume changes to the running engine
  useEffect(() => {
    if (isAmbientPlaying) {
      engineRef.current.setVolume(ambientVolume);
    }
  }, [ambientVolume, isAmbientPlaying]);



  const handleTogglePlay = async (startVerse = 1) => {
    if (isPlaying && startVerse === 1) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }
    
    if (window.speechSynthesis.paused && window.speechSynthesis.speaking && startVerse === 1) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    if (!scripture || !scripture.verses || scripture.verses.length === 0) return;
    
    setIsBuffering(false);
    
    const versesToPlay = scripture.verses.filter(v => parseInt(v.verse) >= startVerse);
    const fullText = versesToPlay.map(v => v.text.replace(/\{[^}]+\}/g, '').trim()).join(' ');
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = speed;
    utterance.volume = audioVolume;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google UK English Male')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = (e) => {
      if (isCancellingRef.current) return;
      setIsPlaying(false);
      if (onAudioEnd) onAudioEnd();
    };
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error', e);
      setIsPlaying(false);
    };

    isCancellingRef.current = true;
    window.speechSynthesis.cancel();
    isCancellingRef.current = false;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleToggleAmbient = () => {
    if (isAmbientPlaying) {
      engineRef.current.stop();
      setIsAmbientPlaying(false);
    } else if (ambientSound.id !== 'none') {
      if (ambientSound.id === 'rain') engineRef.current.startRain(ambientVolume);
      if (ambientSound.id === 'forest') engineRef.current.startForest(ambientVolume);
      setIsAmbientPlaying(true);
    }
  };

  const handleAmbientChange = (e) => {
    const sound = AMBIENT_SOUNDS.find(s => s.id === e.target.value);
    setAmbientSound(sound);
    if (isAmbientPlaying) {
      engineRef.current.stop();
      setIsAmbientPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      isCancellingRef.current = true;
      window.speechSynthesis.cancel();
      engineRef.current.stop();
    };
  }, []);

  return (
    <div className="audio-controller">
      <div className="player-main">
        <button
          className={`play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={() => handleTogglePlay(1)}
          title={isPlaying ? 'Pause Reading' : 'Read Chapter'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="player-info">
          <span className={`player-label ${isBuffering ? 'buffering' : ''}`}>
            {isBuffering ? 'BUFFERING...' : (isPlaying ? 'READING WORD' : 'AUDIO OFF')}
          </span>
          <div className="speed-control">
            <button onClick={() => setSpeed(s => Math.max(0.5, parseFloat((s - 0.1).toFixed(1))))}>−</button>
            <span>{speed.toFixed(1)}x</span>
            <button onClick={() => setSpeed(s => Math.min(2, parseFloat((s + 0.1).toFixed(1))))}>+</button>
          </div>
        </div>
      </div>

      <div className="ambient-control">
        <select value={ambientSound.id} onChange={handleAmbientChange}>
          {AMBIENT_SOUNDS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button
          className={`ambient-toggle ${isAmbientPlaying ? 'active' : ''}`}
          onClick={handleToggleAmbient}
          disabled={ambientSound.id === 'none'}
        >
          {isAmbientPlaying ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  );
});

export default AudioController;
