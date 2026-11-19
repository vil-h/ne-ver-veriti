import numpy as np, wave, subprocess, imageio_ffmpeg
from pathlib import Path
root=Path(__file__).resolve().parent.parent;out=root/'public/audio/effects';out.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(606)
for name,duration in [('transform',2.6),('attack',.85)]:
 sr=22050;t=np.arange(int(sr*duration))/sr;u=t/duration
 frequency=180*(1-u)+42*u
 tone=np.sin(2*np.pi*np.cumsum(frequency)/sr)
 noise=rng.standard_normal(len(t));noise=np.convolve(noise,np.ones(7)/7,mode='same')
 sound=(.6*tone+.25*np.sin(2*np.pi*71*t)+.35*noise)*np.sin(np.pi*u)**.65
 sound=np.tanh(sound*1.3);sound*=.5/max(abs(sound))
 wav=out/(name+'.wav')
 with wave.open(str(wav),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes((sound*32767).astype('<i2').tobytes())
 subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-y','-i',str(wav),'-b:a','80k',str(out/(name+'.mp3'))],check=True);wav.unlink()
