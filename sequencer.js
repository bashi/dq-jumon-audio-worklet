import { NoteGenerator } from './note.js';

class Beat {
  constructor(tempo) {
    this.tempo = tempo || 60;
    this.resolution = 8;
    this.timer = null;
    this.listeners = new Set();
  }

  setTempo(tempo) {
    this.tempo = tempo;
    if (this.timer) {
      this.start();
    }
  }

  start() {
    this.stop();
    const intervalMs = (60.0 / this.tempo / this.resolution) * 1000;
    this.timer = setInterval(() => {
      for (let listener of this.listeners) listener();
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isStarted() {
    return this.timer !== null;
  }

  add(listener) {
    this.listeners.add(listener);
  }

  remove(listener) {
    this.listeners.remove(listener);
  }
}

export class Sequencer {
  constructor() {
    const NUM_NOTES = 14;
    const NUM_STEPS = 16;
    const WIDTH = 400;
    const HEIGHT = 300;
    const r = window.devicePixelRatio;

    this.numNotes = NUM_NOTES;
    this.numSteps = NUM_STEPS;
    this.canvas = document.createElement('canvas');
    this.canvas.width = WIDTH * r;
    this.canvas.height = HEIGHT * r;
    this.canvas.style.width = `{this.canvas.width / r}px`;
    this.canvas.style.height = `{this.canvas.height / r}px`;
    this.ctx = this.canvas.getContext('2d');

    this.notes = [];
    for (let i = 0; i < this.numSteps; i++) {
      this.notes[i] = [];
      for (let j = 0; j < this.numNotes; j++) {
        this.notes[i][j] = false;
      }
    }

    this.currentStep = -1;

    // Set when setAudioContext() is called.
    this.generator = null;

    this.beat = new Beat();
    this.beat.add(() => {
      this.advance();
      const notes = this.getCurrentNotes();
      if (this.generator) {
        this.generator.generate(notes);
      }
    });

    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.draw();
  }

  isReady() {
    return this.generator !== null;
  }

  setAudioContext(audioContext) {
    this.generator = new NoteGenerator(audioContext);
  }

  setPulseType(pulseType) {
    if (this.generator) {
      this.generator.setPulseType(pulseType);
    }
  }

  start() {
    this.currentStep = -1;
    this.beat.start();
  }

  stop() {
    this.currentStep = -1;
    this.beat.stop();
    this.draw();
  }

  toggle() {
    if (this.beat.isStarted()) {
      this.stop();
    } else {
      this.start();
    }
  }

  setTempo(tempo) {
    this.beat.setTempo(tempo);
  }

  advance() {
    this.currentStep += 1;
    if (this.currentStep >= this.numSteps) {
      this.currentStep = 0;
    }
    this.draw();
  }

  getCurrentNotes() {
    if (this.currentStep === -1) return [];
    const notes = [];
    for (let i = 0; i < this.numNotes; i++) {
      if (this.notes[this.currentStep][i]) notes.push(i);
    }
    return notes;
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const xadv = w / this.numSteps;
    const yadv = h / this.numNotes;
    let x = 0;
    let y = 0;
    
    ctx.clearRect(0, 0, w, h);

    if (this.currentStep >= 0) {
      ctx.fillStyle = 'rgb(240, 240, 240)';
      x = this.currentStep * xadv;
      ctx.fillRect(x, 0, xadv, h);
    }

    // Grid
    ctx.strokeStyle = 'rgb(200, 180, 200)';
    y = 0;
    for (let i = 0; i <= this.numNotes; i++) {
      ctx.lineWidth = ((i + 1) % 8 == 0) ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      y += yadv;
    }

    x = 0;
    for (let i = 0; i <= this.numSteps; i++) {
      ctx.lineWidth = (i % 4 == 0) ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      x += xadv;
    }

    // Notes
    x = 0;
    y = 0;
    ctx.fillStyle = 'rgb(210, 190, 210)';
    for (let i = 0; i < this.numSteps; i++) {
      y = 0;
      for (let j = 0; j < this.numNotes; j++) {
        if (this.notes[i][j]) {
          ctx.fillRect(x, y, xadv, yadv);
        }
        y += yadv;
      }
      x += xadv;
    }
  }

  onClick(e) {
    const x = e.clientX + document.documentElement.scrollLeft - this.canvas.offsetLeft;
    const y = e.clientY + document.documentElement.scrollTop - this.canvas.offsetTop;
    const row = Math.floor(y / (this.canvas.height / this.numNotes));
    const col = Math.floor(x / (this.canvas.width / this.numSteps));
    this.notes[col][row] = !this.notes[col][row];
    this.draw();
  }
}
