
let audioContext = null;
let nextNoteTime = 0.0;
let timerID = null;
let bpm = 120;
let isPlaying = false;
let beatCount = 0;
let beatsPerMeasure = 4;

// Tap Tempo state
let tapTimes = [];

const pulseEl = document.getElementById('pulse');
const bpmEl = document.getElementById('bpm-value');
const btnStart = document.getElementById('btn-start');
const btnPlus = document.getElementById('btn-plus');
const btnMinus = document.getElementById('btn-minus');
const btnTap = document.getElementById('btn-tap');

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function scheduleNote(time) {
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    osc.type = 'sine';
    
    // Accent on the first beat of every measure
    const isFirstBeat = beatCount % beatsPerMeasure === 0;
    osc.frequency.setValueAtTime(isFirstBeat ? 880 : 440, time);

    envelope.gain.setValueAtTime(1, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    setTimeout(() => {
        pulseEl.classList.add('active');
        setTimeout(() => pulseEl.classList.remove('active'), 100);
    }, (time - audioContext.currentTime) * 1000);
}

function scheduler() {
    while (nextNoteTime < audioContext.currentTime + 0.1) {
        scheduleNote(nextNoteTime);
        nextNoteTime += 60.0 / bpm;
        beatCount++;
    }
    timerID = setTimeout(scheduler, 25);
}

btnStart.onclick = () => {
    initAudio();
    if (isPlaying) {
        isPlaying = false;
        btnStart.textContent = 'START';
        btnStart.style.backgroundColor = 'var(--primary-color)';
        clearTimeout(timerID);
    } else {
        isPlaying = true;
        btnStart.textContent = 'STOP';
        btnStart.style.backgroundColor = 'var(--accent-color)';
        nextNoteTime = audioContext.currentTime;
        scheduler();
    }
};

btnPlus.onclick = () => {
    bpm = Math.min(bpm + 1, 250);
    bpmEl.textContent = bpm;
};

btnMinus.onclick = () => {
    bpm = Math.max(bpm - 1, 40);
    bpmEl.textContent = bpm;
};

// Time Signature buttons
document.querySelectorAll('.btn-sec').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.btn-sec').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        beatsPerMeasure = parseInt(btn.dataset.beats);
        beatCount = 0; // Reset measure
    };
});

// Tap Tempo logic
btnTap.onclick = () => {
    const now = performance.now();
    tapTimes.push(now);
    if (tapTimes.length > 4) tapTimes.shift();
    
    if (tapTimes.length > 1) {
        const intervals = [];
        for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i-1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        bpm = Math.round(60000 / avgInterval);
        bpm = Math.max(40, Math.min(250, bpm));
        bpmEl.textContent = bpm;
    }
};
