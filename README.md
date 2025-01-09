## Usage
Simply use the top slider to set the max length of the audio file, and hit record! Audio can be played back in-browser or downloaded as an mp3 file.

## How it Works
The start button creates a new MediaRecorder object which begins recording 5-second chunks of audio and storing them in an array. Once the array is full (enough chunks have been added to exceed the user-defined time limit), it will begin removing the oldest chunk for each newly added one.

When stop is pressed, the webm audio file is sent to a WebWorker to convert it to an mp3 using the lamejs library, which is then set as the source of the audio player and link for the download button.

## Screenshots
![Screenshot 2025-01-08 at 2 55 28 PM](https://github.com/user-attachments/assets/246ce25e-5d26-43c1-abb8-2bebbaa8df9f) ![IMG_3080](https://github.com/user-attachments/assets/bb098d8e-6b56-405f-bcc0-fd846975fd7c)
