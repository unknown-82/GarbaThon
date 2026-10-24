/**
 * AudioStreamer manages:
 * 1. AudioContext playback to user speakers (audioContext.destination)
 * 2. Real-time downsampling from hardware sample rate to 16 kHz Mono 16-bit PCM
 * 3. Slicing into ~100 ms frames (1600 samples)
 * 4. Firing callbacks for ~5-second evaluation chunks with activityStart/activityEnd signals
 * 5. Providing real-time waveform data for UI visualizer
 */

export interface AudioStreamerCallbacks {
  onPcmFrame: (base64Pcm: string, rawBytes: Uint8Array) => void;
  onChunkStart: (chunkIndex: number) => void;
  onChunkEnd: (chunkIndex: number, cumulativeDuration: number) => void;
  onPlaybackProgress: (currentTime: number, totalDuration: number) => void;
  onPlaybackEnded: () => void;
}

export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;

  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private currentBuffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private totalDuration: number = 0;

  // Downsampling and chunk state
  private targetSampleRate: number = 16000;
  private frameSizeSamples: number = 1600; // 100 ms at 16 kHz
  private chunkDurationSeconds: number = 5.0; // ~5 seconds per chunk
  private currentChunkIndex: number = 0;
  private pcmSampleAccumulator: Int16Array = new Int16Array(1600 * 10);
  private accumulatorCount: number = 0;
  private chunkElapsedSamples: number = 0;
  private samplesPerChunk: number = 16000 * 5;

  private progressInterval: number | null = null;
  private callbacks: AudioStreamerCallbacks | null = null;

  constructor() {
    this.samplesPerChunk = this.targetSampleRate * this.chunkDurationSeconds;
  }

  public setCallbacks(callbacks: AudioStreamerCallbacks): void {
    this.callbacks = callbacks;
  }

  private initAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Loads an audio file from a URL or ArrayBuffer and prepares for playback
   */
  public async loadAudio(source: string | ArrayBuffer): Promise<number> {
    const ctx = this.initAudioContext();
    this.stop();

    let arrayBuffer: ArrayBuffer;
    if (typeof source === 'string') {
      const resp = await fetch(source);
      if (!resp.ok) {
        throw new Error(`Failed to load audio from ${source}: ${resp.statusText}`);
      }
      arrayBuffer = await resp.arrayBuffer();
    } else {
      arrayBuffer = source;
    }

    this.currentBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.totalDuration = this.currentBuffer.duration;
    this.pauseOffset = 0;
    return this.totalDuration;
  }

  /**
   * Starts or resumes playback through speakers and streams 16kHz PCM to callbacks
   */
  public play(startOffsetSeconds: number = 0): void {
    const ctx = this.initAudioContext();
    if (!this.currentBuffer) {
      throw new Error('No audio buffer loaded. Call loadAudio first.');
    }

    this.stopPlaybackNodes();

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.currentBuffer;

    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 1.0;

    // Buffer size of 4096 gives ~85ms buffer at 48kHz
    const bufferSize = 4096;
    this.processorNode = ctx.createScriptProcessor(bufferSize, 1, 1);

    // Downsampling logic inside script processor
    const sourceSampleRate = ctx.sampleRate;
    const resampleRatio = this.targetSampleRate / sourceSampleRate;

    this.processorNode.onaudioprocess = (e) => {
      // Ensure processor never leaks or generates any sound to speakers
      for (let ch = 0; ch < e.outputBuffer.numberOfChannels; ch++) {
        e.outputBuffer.getChannelData(ch).fill(0);
      }

      if (!this.isPlaying) return;

      const inputChannelData = e.inputBuffer.getChannelData(0);
      const inputLength = inputChannelData.length;
      const resampledLength = Math.floor(inputLength * resampleRatio);

      // Downsample to 16kHz Linear PCM
      for (let i = 0; i < resampledLength; i++) {
        const sourceIndex = i / resampleRatio;
        const indexFloor = Math.floor(sourceIndex);
        const indexCeil = Math.min(inputLength - 1, indexFloor + 1);
        const fraction = sourceIndex - indexFloor;

        // Linear interpolation
        const sampleF32 =
          inputChannelData[indexFloor] * (1 - fraction) +
          inputChannelData[indexCeil] * fraction;

        // Convert Float32 [-1.0, 1.0] to 16-bit signed integer [-32768, 32767]
        const clamped = Math.max(-1, Math.min(1, sampleF32));
        const s16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;

        if (this.accumulatorCount < this.pcmSampleAccumulator.length) {
          this.pcmSampleAccumulator[this.accumulatorCount++] = Math.floor(s16);
        }

        this.chunkElapsedSamples++;

        // When we accumulate a full ~100 ms frame (1600 samples)
        if (this.accumulatorCount >= this.frameSizeSamples) {
          const frameBytes = new Uint8Array(this.frameSizeSamples * 2);
          for (let f = 0; f < this.frameSizeSamples; f++) {
            const val = this.pcmSampleAccumulator[f];
            frameBytes[f * 2] = val & 0xff;
            frameBytes[f * 2 + 1] = (val >> 8) & 0xff;
          }

          const base64Pcm = this.uint8ArrayToBase64(frameBytes);
          this.callbacks?.onPcmFrame(base64Pcm, frameBytes);

          // Shift any remaining samples down
          const remaining = this.accumulatorCount - this.frameSizeSamples;
          if (remaining > 0) {
            this.pcmSampleAccumulator.copyWithin(0, this.frameSizeSamples, this.accumulatorCount);
          }
          this.accumulatorCount = remaining;
        }

        // When we reach ~5-second chunk boundary
        if (this.chunkElapsedSamples >= this.samplesPerChunk) {
          const finishedChunk = this.currentChunkIndex++;
          this.chunkElapsedSamples = 0;
          const cumulativeSec = (this.currentChunkIndex * this.chunkDurationSeconds);
          this.callbacks?.onChunkEnd(finishedChunk, cumulativeSec);
          this.callbacks?.onChunkStart(this.currentChunkIndex);
        }
      }
    };

    // Connect graph:
    // source -> analyser -> gain -> speakers (Pure uploaded audio playback)
    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);

    // Muted processor pass-through to capture PCM without any audio leak
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0.0;
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(silentGain);
    silentGain.connect(ctx.destination);

    const offset = startOffsetSeconds || this.pauseOffset;
    this.sourceNode.start(0, offset);
    this.startTime = ctx.currentTime - offset;
    this.isPlaying = true;
    this.isPaused = false;

    // Trigger initial chunk start
    if (this.currentChunkIndex === 0) {
      this.callbacks?.onChunkStart(0);
    }

    this.sourceNode.onended = () => {
      if (this.isPlaying && !this.isPaused) {
        this.isPlaying = false;
        this.stopProgressTimer();
        this.callbacks?.onPlaybackEnded();
      }
    };

    this.startProgressTimer();
  }

  public pause(): void {
    if (!this.isPlaying || this.isPaused || !this.audioCtx) return;
    this.pauseOffset = this.audioCtx.currentTime - this.startTime;
    this.isPaused = true;
    this.isPlaying = false;
    this.stopPlaybackNodes();
    this.stopProgressTimer();
  }

  public resume(): void {
    if (this.isPaused) {
      this.play(this.pauseOffset);
    }
  }

  public stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.pauseOffset = 0;
    this.currentChunkIndex = 0;
    this.chunkElapsedSamples = 0;
    this.accumulatorCount = 0;
    this.stopPlaybackNodes();
    this.stopProgressTimer();
  }

  private stopPlaybackNodes(): void {
    if (this.sourceNode) {
      try {
        if ('stop' in this.sourceNode) {
          (this.sourceNode as AudioBufferSourceNode).stop();
        }
        this.sourceNode.disconnect();
      } catch {
        // Ignore if already stopped
      }
      this.sourceNode = null;
    }
    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {
        // Ignore
      }
      this.processorNode = null;
    }
    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {
        // Ignore
      }
      this.analyserNode = null;
    }
  }

  private startProgressTimer(): void {
    this.stopProgressTimer();
    this.progressInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.audioCtx) return;
      const current = Math.min(this.totalDuration, this.audioCtx.currentTime - this.startTime);
      this.callbacks?.onPlaybackProgress(current, this.totalDuration);
      if (current >= this.totalDuration) {
        this.stop();
        this.callbacks?.onPlaybackEnded();
      }
    }, 100);
  }

  private stopProgressTimer(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Retrieves live frequency data for rendering waveform visualizer
   */
  public getVisualizerData(frequencyArray: Uint8Array<any>): void {
    if (this.analyserNode && this.isPlaying) {
      this.analyserNode.getByteFrequencyData(frequencyArray);
    } else {
      frequencyArray.fill(0);
    }
  }

  public getCurrentTime(): number {
    if (!this.audioCtx || !this.isPlaying) return this.pauseOffset;
    return Math.min(this.totalDuration, this.audioCtx.currentTime - this.startTime);
  }

  public getTotalDuration(): number {
    return this.totalDuration;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setVolume(val: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1.5, val));
    }
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
