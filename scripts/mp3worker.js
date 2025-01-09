importScripts('https://cdn.jsdelivr.net/npm/lamejs/lame.min.js');

self.onmessage = function (event) {
  const { pcmData, sampleRate } = event.data;

  try {
    // Scale PCM data to 16-bit integers
    const scaledPCMData = scalePCMData(new Float32Array(pcmData));

    // Encode PCM data to MP3
    const mp3Blob = encodePCMToMP3(scaledPCMData, sampleRate);

    // Send MP3 Blob back to the main thread
    self.postMessage(mp3Blob);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};

// Helper: Scale PCM Data
function scalePCMData(pcmData) {
  const int16Array = new Int16Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    int16Array[i] = Math.max(-1, Math.min(1, pcmData[i])) * 0x7FFF;
  }
  return int16Array;
}

// Helper: Encode PCM to MP3
function encodePCMToMP3(pcmData, sampleRate) {
  const mp3Encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // Mono, 128kbps
  const mp3Data = [];
  let offset = 0;
  const samplesPerFrame = 1152;

  while (offset < pcmData.length) {
    const frame = mp3Encoder.encodeBuffer(pcmData.subarray(offset, offset + samplesPerFrame));
    if (frame.length > 0) {
      mp3Data.push(frame);
    }
    offset += samplesPerFrame;
  }

  const finalFrame = mp3Encoder.flush();
  if (finalFrame.length > 0) {
    mp3Data.push(finalFrame);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}
