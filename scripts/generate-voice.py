"""Offline asset build. Usage: python generate-voice.py MODEL WORKDIR [--all].
Requires piper-tts==1.8.0 and imageio-ffmpeg==0.6.0; neither ships with game.
"""
import json,sys,wave,subprocess,re,hashlib
from pathlib import Path
import numpy as np
from piper import PiperVoice, SynthesisConfig
import imageio_ffmpeg
root=Path(__file__).resolve().parent.parent
model=Path(sys.argv[1]);work=Path(sys.argv[2]);work.mkdir(parents=True,exist_ok=True)
out=root/'public/audio/voice';out.mkdir(parents=True,exist_ok=True)
voice=PiperVoice.load(str(model));ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
profiles={'friendly':(1.02,1.13,1.0,6500),'suspicious':(1.12,1.05,.94,4200),'angry':(.95,.79,1.06,3200)}
def generate(name,text,emotion):
 length,pitch,tempo,cutoff=profiles[emotion]
 wav=work/(name+'.wav')
 with wave.open(str(wav),'wb') as f:voice.synthesize_wav(text,f,syn_config=SynthesisConfig(length_scale=length,noise_scale=.5,noise_w_scale=.333))
 target=out/(name+'.mp3')
 filters=f'asetrate={22050*pitch},aresample=22050,atempo={tempo/pitch},highpass=f=85,lowpass=f={cutoff}'
 if emotion=='angry':filters+=',asoftclip=type=tanh:threshold=0.6:output=0.8'
 filters+=',loudnorm=I=-20:TP=-3:LRA=7,afade=t=in:d=0.018'
 subprocess.run([ffmpeg,'-v','error','-y','-i',str(wav),'-af',filters,'-ar','22050','-ac','1','-b:a','80k',str(target)],check=True)
 raw=subprocess.check_output([ffmpeg,'-v','error','-i',str(target),'-f','f32le','-ac','1','-ar','22050','-'])
 samples=np.frombuffer(raw,dtype=np.float32)
 return {'file':str(target.relative_to(root/'public')),'text':text,'emotion':emotion,'seconds':round(len(samples)/22050,3),'rms':round(float(np.sqrt(np.mean(samples**2))),4),'peak':round(float(np.max(np.abs(samples))),4),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
demos=[('demo-friendly','Привет! Я Верити. Не бойся, я помогу тебе.','friendly'),('demo-suspicious','Там опасно. Ты же мне доверяешь?','suspicious'),('demo-angry','Я же просил тебя не нажимать!','angry')]
entries=[]
for row in demos:entries.append(generate(*row));print(entries[-1],flush=True)
if '--all' in sys.argv:
 lines=re.findall(r"voice\('([^']+)','([^']+)'(?:,'([^']+)')?\)", (root/'src/story.js').read_text())
 for name,text,emotion in lines:entries.append(generate(name,text,emotion or 'friendly'));print(entries[-1],flush=True)
 files={'audio/voice/'+Path(e['file']).stem+'.ogg':e['file'] for e in entries if not Path(e['file']).stem.startswith('demo-')}
 (out/'manifest.json').write_text(json.dumps({'generator':'Piper 1.8.0 / ru_RU-denis-medium (rdh CC0 base)','files':files,'recordings':entries},ensure_ascii=False,indent=2))
(work/'voice-measurements.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2))
