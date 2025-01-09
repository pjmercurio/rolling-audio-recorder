// HTML Elements
const customAudioElement = document.getElementById('custom-audio-player');
const audioElement = document.getElementById('audioElement');
const playPauseButton = document.getElementById('playPauseButton');
const progressBar = document.getElementById('progressBar');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const bufferTimeSlider = document.getElementById('bufferTime');
const bufferValueDisplay = document.getElementById('bufferValue');
const downloadLink = document.getElementById('downloadLink');
const elapsedTimeDisplay = document.getElementById('elapsedTime');
const maxTimeDisplay = document.getElementById('maxTime');

const mp3Worker = new Worker('scripts/mp3worker.js');
const chunkSize = 5; // Default chunk size size: 5 seconds
let chunksPerMin = Math.ceil(60 / chunkSize);
let chunkLimit = chunksPerMin * parseInt(bufferTimeSlider.value, 10);
let mediaRecorder;
let audioChunks = [];
let elapsedSeconds = 0;
let timerInterval;

// Update buffer size dynamically
bufferTimeSlider.addEventListener('input', () => {
  const bufferTime = parseInt(bufferTimeSlider.value, 10);
  chunkLimit = chunksPerMin * parseInt(bufferTimeSlider.value, 10);
  maxTimeDisplay.textContent = `${bufferTime}:00`;
});

startButton.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  // Start elapsed time counter
  elapsedSeconds = 0;
  updateElapsedTime();
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    if (elapsedSeconds <= bufferTimeSlider.value * 60) {
        updateElapsedTime();
    }
  }, 1000);

  // Rolling buffer logic
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
    if (audioChunks.length > chunkLimit) {
      audioChunks.shift(); // Remove the oldest chunk
    }
  };

  mediaRecorder.start(chunkSize * 1000);
  startButton.disabled = true;
  startButton.textContent = "Recording...";
  startButton.classList.add("recording");
  stopButton.disabled = false;
};

stopButton.onclick = () => {
  mediaRecorder.stop();
  clearInterval(timerInterval);

  mediaRecorder.onstop = async () => {
    const fullBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const mp3Blob = await convertWebMToMP3InWorker(fullBlob);
    const audioURL = URL.createObjectURL(mp3Blob);
    audioElement.src = audioURL;

    // Generate timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const downloadFilename = `recording-${timestamp}.mp3`;

    // Reset buttons and timer
    startButton.disabled = false;
    startButton.textContent = "Start Recording";
    startButton.classList.remove("recording");
    stopButton.disabled = true;
    elapsedSeconds = 0;
    updateElapsedTime();
    audioChunks = [];

    // Update and show the styled download link
    downloadLink.download = downloadFilename;
    downloadLink.href = audioURL;
    downloadLink.style.display = 'inline-block';
    
    // Show the audio player
    customAudioElement.style.display = 'flex';
  };
};

// Function to update elapsed time display
function updateElapsedTime() {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  elapsedTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format time in minutes:seconds
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Update progress bar and current time
function updateProgress() {
  progressBar.value = (audioElement.currentTime / audioElement.duration) * 100 || 0;
  currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
}

// Play/pause toggle
playPauseButton.addEventListener('click', () => {
  if (audioElement.paused) {
    audioElement.play();
    playPauseButton.textContent = '⏸️'; // Pause icon
  } else {
    audioElement.pause();
    playPauseButton.textContent = '▶️'; // Play icon
  }
});

// Update duration when audio metadata is loaded
audioElement.addEventListener('loadedmetadata', () => {
  const duration = audioElement.duration == Infinity ? 0 : audioElement.duration;
  durationDisplay.textContent = formatTime(duration);
  progressBar.max = 100;
});

// Seek audio on progress bar input
progressBar.addEventListener('input', () => {
  const seekTime = (progressBar.value / 100) * audioElement.duration;
  audioElement.currentTime = seekTime;
});

// Update progress bar and current time every second
audioElement.addEventListener('timeupdate', updateProgress);

// Reset player when audio ends
audioElement.addEventListener('ended', () => {
  playPauseButton.textContent = '▶️';
  progressBar.value = 0;
  currentTimeDisplay.textContent = '0:00';
  durationDisplay.textContent = formatTime(audioElement.duration);
});

async function convertWebMToMP3InWorker(webmBlob) {
    return new Promise(async (resolve, reject) => {
      const audioContext = new AudioContext();
  
      try {
        // Decode WebM Blob into PCM data in the main thread
        const arrayBuffer = await webmBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
        // Extract PCM data and sample rate
        const pcmData = audioBuffer.getChannelData(0); // Mono
        const sampleRate = audioBuffer.sampleRate;
  
        // Pass PCM data and sample rate to the worker
        mp3Worker.postMessage({ pcmData, sampleRate }, [pcmData.buffer]);
  
        // Handle worker response
        mp3Worker.onmessage = (event) => {
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data); // MP3 Blob
          }
        };
  
        mp3Worker.onerror = (error) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
}
