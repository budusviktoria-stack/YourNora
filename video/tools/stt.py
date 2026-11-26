"""Распознавание озвучки с таймингами слов (faster-whisper, модель small).

  python tools/stt.py audio/ep03-voice.wav words.json

Нужен пакет faster-whisper; модель скачивается с huggingface.co при первом запуске.
"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32)
model = WhisperModel('small', device='cpu', compute_type='int8')
segs, _ = model.transcribe(audio, language='ru', word_timestamps=True, beam_size=5)
words = []
for s in segs:
    print(f'[{s.start:6.2f}-{s.end:6.2f}] {s.text}')
    words += [{'w': w.word.strip(), 's': round(w.start, 2), 'e': round(w.end, 2)} for w in s.words]
json.dump(words, open(sys.argv[2], 'w', encoding='utf8'), ensure_ascii=False)
