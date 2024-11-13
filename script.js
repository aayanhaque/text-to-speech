const textarea = document.querySelector("textarea");
const button = document.querySelector("#convertBtn");
const loading = document.getElementById("loading");
const voiceSelect = document.getElementById("voice");
const speedInput = document.getElementById("speed");
const speedValue = document.getElementById("speed-value");
const saveButton = document.getElementById("saveButton");

let isSpeaking = false;
let synth = window.speechSynthesis;
let currentUtterance = null;
let mediaRecorder = null;
let audioChunks = [];

// Voice selection and settings
let voices = [];
const loadVoices = () => {
  voices = synth.getVoices();
  voiceSelect.innerHTML = voices
    .map((voice) => `<option value="${voice.lang}">${voice.name}</option>`)
    .join("");
};

const setDefaultVoice = () => {
  const defaultVoice = voices.find(voice => voice.lang === 'en-US');
  if (defaultVoice) {
    voiceSelect.value = defaultVoice.lang;
  }
};

voiceSelect.addEventListener('change', () => {
  if (currentUtterance) {
    currentUtterance.voice = voices.find(voice => voice.lang === voiceSelect.value);
  }
});

speedInput.addEventListener('input', () => {
  const speed = speedInput.value;
  speedValue.textContent = `${speed}x`;
  if (currentUtterance) {
    currentUtterance.rate = speed;
  }
});

// Started speaking and handle the media recorder
const textToSpeech = () => {
  const text = textarea.value.trim();
  if (!text) return;

  loading.style.display = 'flex';

  if (!synth.speaking && text) {
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.voice = voices.find(voice => voice.lang === voiceSelect.value) || voices[0];
    currentUtterance.rate = speedInput.value;

    // Created an AudioContext to record the speech
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioContext.createMediaStreamDestination();
    mediaRecorder = new MediaRecorder(dest.stream);

    // Handled recording audio chunks
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = audioUrl;
      downloadLink.download = 'speech.wav';
      downloadLink.click();
    };

    // Created a new audio buffer source to play the text-to-speech audio
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(dest);
    mediaRecorder.start();

    currentUtterance.onstart = () => {
      isSpeaking = true;
      button.innerText = "Pause";
    };

    currentUtterance.onend = () => {
      isSpeaking = false;
      loading.style.display = 'none';
      button.innerText = "Convert to Speech";
      mediaRecorder.stop(); 
    };

    currentUtterance.onerror = () => {
      loading.style.display = 'none';
      button.innerText = "Convert to Speech";
    };

    synth.speak(currentUtterance);
  }

  // Pause/resume speech
  if (isSpeaking) {
    synth.pause();
    button.innerText = "Resume";
    isSpeaking = false;
  } else {
    synth.resume();
    button.innerText = "Pause";
    isSpeaking = true;
  }
};

// Load voices once available
if (synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = loadVoices;
} else {
  loadVoices();
}

button.addEventListener("click", textToSpeech);

// Save audio as WAV file (additional functionality by myself)
saveButton.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
});
