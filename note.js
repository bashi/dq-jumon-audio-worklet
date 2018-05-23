class PulseNode extends AudioWorkletNode {
  constructor(context, processorName) {
    super(context, processorName);
  }

  start(when) {
    this.port.postMessage({
      name: 'start',
      when: when
    });
  }

  stop(when) {
    this.port.postMessage({
      name: 'stop',
      when: when
    });
  }
}

export class NoteGenerator {
  constructor(audioContext) {
    this.baseNoteNo = 69; // A4, 440Hz
    this.audioContext = audioContext;
    this.noteLength = 0.1;
    this.freqs = [];
    for (let i = 0; i < 128; i++) {
      this.freqs[i] = 440 * Math.pow(2, (i - 69) / 12);
    }

    this.gainNode = audioContext.createGain();
    this.gainNode.connect(audioContext.destination);
    this.gainNode.gain.value = 0.20;

    this.pulseType = '0';
  }

  setPulseType(pulseType) {
    this.pulseType = pulseType;
  }

  generate(notes) {
    for (let note of notes) {
      const noteNo = note + this.baseNoteNo;
      if (noteNo <= 0 || noteNo >= this.freqs.length) continue;
      const freq = this.freqs[noteNo];
      if (this.pulseType === '0') {
        this.generateSinglePulseNote(freq, 0, this.noteLength, 0);
      } else if (this.pulseType === '1') {
        this.generateSinglePulseNote(freq, 0, this.noteLength, 1);
      } else if (this.pulseType === '2') {
        this.generateSinglePulseNote(freq, 0, this.noteLength, 2);
      } else if (this.pulseType === 'composed') {
        this.generateComposedPulseNote(freq, 0, this.noteLength);
      }
    }
  }

  generateSinglePulseNote(freq, start, noteLength, dutyIndex) {
    const node = new PulseNode(this.audioContext, 'single-pulse-node-processor');
    node.connect(this.gainNode);
    node.parameters.get('frequency').value = freq;
    node.parameters.get('dutyIndex').value = dutyIndex;
    node.start();
    node.stop(this.audioContext.currentTime + noteLength);
  }

  generateComposedPulseNote(freq, start, noteLength) {
    const node = new PulseNode(this.audioContext, 'composed-pulse-node-processor');
    node.connect(this.gainNode);
    node.parameters.get('frequency').value = freq;
    node.start();
    node.stop(this.audioContext.currentTime + noteLength);
  }

  generateNote(freq, start, noteLength) {
    const osc = this.audioContext.createOscillator();
    osc.connect(this.gainNode);
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.start();
    osc.stop(this.audioContext.currentTime + noteLength);
  }
}
