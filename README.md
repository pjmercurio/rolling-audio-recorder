## Usage
Simply use the top slider to set the max length of the audio file, and hit record! Audio can be played back in-browser or downloaded as an mp3 file.

## How it Works
The start button creates a new MediaRecorder object which begins recording 5-second chunks of audio and storing them in an array. Once the array is full (enough chunks have been added to exceed the user-defined time limit), it will begin removing the oldest chunk for each newly added one.

When stop is pressed, the webm audio file is sent to a WebWorker to convert it to an mp3 using the lamejs library, which is then set as the source of the audio player and link for the download button.

## Screenshots
![IMG_3080](https://github.com/user-attachments/assets/38d88b1e-a997-450f-b6a8-4017921a6bd6) ![Screenshot 2025-01-08 at 2 55 28 PM](https://github.com/user-attachments/assets/e88ea6b1-4d62-400b-baf4-a0a8ea8a0eb1)
