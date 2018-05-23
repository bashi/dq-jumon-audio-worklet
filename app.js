import { Sequencer } from './sequencer.js';

let sequencer;

async function webAudioReady() {
  if (sequencer.isReady()) return;
  const audioContext = new AudioContext();
  return audioContext.resume()
    .then(() => {
      return audioContext.audioWorklet.addModule('pulse-node-processors.js');
    })
    .then(() => sequencer.setAudioContext(audioContext));
}

async function toggle() {
  await webAudioReady();
  sequencer.toggle();
}

function init() {
  sequencer = new Sequencer();
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      toggle();
      e.stopPropagation();
      e.preventDefault();
    }
  });

  document.querySelector('#play-button').addEventListener('click', () => {
    toggle();
  });

  const tempoInput = document.querySelector('#tempo');
  sequencer.setTempo(Number(tempoInput.value));
  tempoInput.addEventListener('change', () => {
    sequencer.setTempo(Number(tempoInput.value));
  });

  document.getElementsByName('pulse-type').forEach(el => {
    el.addEventListener('click', () => {
      sequencer.setPulseType(el.value);
    });
  });
  let container = document.querySelector('#grid-container');
  container.appendChild(sequencer.canvas);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
