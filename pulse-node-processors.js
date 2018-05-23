const DUTIES = [ 0.125, 0.25, 0.5 ];

class SinglePulseNodeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 440 },
      { name: 'dutyIndex', defaultValue: 0 },
    ];
  }

  constructor(options) {
    super(options);
    this.volume = 1.0;
    this.samplesGenerated = 0;
    this.count = 0;

    this.startAt = -1;
    this.stopAt = -1;

    this.port.onmessage = (e) => this.handleMessage(e);
  }

  handleMessage(e) {
    if (e.data.name === 'start') {
      this.startAt = e.data.when;
    } else if (e.data.name === 'stop') {
      this.stopAt = e.data.when;
    }
  }

  process(inputs, outputs, parameters) {
    if (this.startAt < 0) return;
    let output = outputs[0][0];
    for (let i = 0; i < output.length; i++) {
      const freq = parameters.frequency[i];
      const dutyIndex = parameters.dutyIndex[i];
      const dutyRatio = DUTIES[dutyIndex];
      const samplesPerWave = Math.floor(sampleRate / freq);
      const numOnSamples = Math.floor(samplesPerWave * dutyRatio);
      if (this.samplesGenerated < numOnSamples) {
        output[i] = this.volume;
      } else {
        output[i] = 0;
      }

      this.samplesGenerated += 1;
      if (this.samplesGenerated > samplesPerWave) {
        this.samplesGenerated = 0;
      }
    }
    return this.stopAt > currentTime;
  }
}

registerProcessor('single-pulse-node-processor', SinglePulseNodeProcessor);

class ComposedPulseNodeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 440 },
    ];
  }

  constructor(options) {
    super(options);
    this.volume = 1.0;
    this.samplesGenerated = 0;
    this.dutyIndex = 0;
    this.numWavesPerDuty = 10;
    this.numWavesGenerated = 0;

    this.startAt = -1;
    this.stopAt = -1;

    this.port.onmessage = (e) => this.handleMessage(e);
  }

  handleMessage(e) {
    if (e.data.name === 'start') {
      this.startAt = e.data.when;
    } else if (e.data.name === 'stop') {
      this.stopAt = e.data.when;
    }
  }

  process(inputs, outputs, parameters) {
    if (this.startAt < 0) return;
    let output = outputs[0][0];
    for (let i = 0; i < output.length; i++) {
      const freq = parameters.frequency[i];
      const dutyRatio = DUTIES[this.dutyIndex];
      const samplesPerWave = Math.floor(sampleRate / freq);
      const numOnSamples = Math.floor(samplesPerWave * dutyRatio);
      if (this.samplesGenerated < numOnSamples) {
        output[i] = this.volume;
      } else {
        output[i] = 0;
      }

      this.samplesGenerated++;
      if (this.samplesGenerated > samplesPerWave) {
        this.samplesGenerated = 0;

        this.numWavesGenerated += 1;
        if (this.numWavesGenerated > this.numWavesPerDuty) {
          this.numWavesGenerated = 0;
          this.dutyIndex += 1;
          if (this.dutyIndex >= DUTIES.length) {
            this.dutyIndex = 0;
          }
        }
      }
    }
    return this.stopAt > currentTime;
  }
}

registerProcessor('composed-pulse-node-processor', ComposedPulseNodeProcessor);
