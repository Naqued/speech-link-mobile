/**
 * Continuous Recording Service
 * 
 * Provides intelligent voice activity detection (VAD) for continuous speech recording.
 * Detects when user starts/stops speaking and processes audio chunks automatically.
 * 
 * Features:
 * - Silence detection with configurable thresholds
 * - Echo cancellation (ignores audio while TTS is playing)
 * - Minimum phrase duration filtering
 * - Asynchronous chunk processing
 * 
 * @module ContinuousRecordingService
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Configuration for Voice Activity Detection
 */
export interface VADConfig {
  /** Duration of silence (ms) that ends a phrase */
  silenceDuration: number;
  /** Minimum phrase length (ms) to be processed */
  minPhraseDuration: number;
  /** Audio energy threshold for voice detection (0.0-1.0) */
  energyThreshold: number;
  /** Update interval for audio metering (ms) */
  meteringInterval: number;
}

/**
 * Default VAD configuration optimized for speech impairment users
 */
const DEFAULT_VAD_CONFIG: VADConfig = {
  silenceDuration: 800,      // 800ms silence ends phrase
  minPhraseDuration: 500,    // Phrases must be 500ms minimum
  energyThreshold: 0.015,    // Lower threshold for weak voices
  meteringInterval: 100      // Check audio levels every 100ms
};

/**
 * Callback when a complete phrase is detected
 * @param audioUri - File URI of the recorded audio
 * @returns Promise that resolves when processing is complete
 */
export type PhraseDetectedCallback = (audioUri: string) => Promise<void>;

/**
 * Continuous Recording Service
 * 
 * Manages continuous audio recording with automatic phrase detection.
 * Processes audio chunks asynchronously without blocking new recordings.
 */
export class ContinuousRecordingService {
  private recording: Audio.Recording | null = null;
  private isListening = false;
  private isSpeaking = false;
  private isTTSPlaying = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private phraseStartTime: number = 0;
  private config: VADConfig;
  private onPhraseDetected: PhraseDetectedCallback | null = null;
  private recordingCounter = 0;

  constructor(config: Partial<VADConfig> = {}) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...config };
  }

  /**
   * Start continuous recording mode
   * @param callback - Called when a complete phrase is detected
   */
  async startContinuousMode(callback: PhraseDetectedCallback): Promise<void> {
    if (this.isListening) {
      console.warn('[ContinuousRecording] Already listening');
      return;
    }

    this.onPhraseDetected = callback;
    this.isListening = true;
    this.isSpeaking = false;
    this.recordingCounter = 0;

    console.log('[ContinuousRecording] Starting continuous mode with config:', this.config);

    // Request audio permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission not granted');
    }

    // Setup audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 2, // DUCK_OTHERS
      interruptionModeAndroid: 2,
    });

    // Start first recording session
    await this.startRecordingSession();
  }

  /**
   * Start a new recording session with metering enabled
   */
  private async startRecordingSession(): Promise<void> {
    try {
      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          isMeteringEnabled: true, // Enable audio level monitoring
        },
        // Status update callback for VAD
        (status) => this.onRecordingStatusUpdate(status),
        this.config.meteringInterval
      );

      this.recording = recording;
      console.log('[ContinuousRecording] Recording session started');
    } catch (error) {
      console.error('[ContinuousRecording] Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Handle recording status updates for voice activity detection
   */
  private onRecordingStatusUpdate(status: Audio.RecordingStatus): void {
    if (!status.isRecording || !this.isListening) return;

    // Skip if TTS is playing (echo cancellation)
    if (this.isTTSPlaying) {
      if (this.isSpeaking) {
        console.log('[ContinuousRecording] 🔇 TTS playing, pausing speech detection');
        this.isSpeaking = false;
      }
      return;
    }

    // Get audio level from metering
    const audioLevel = status.metering || -160;
    // Normalize to 0.0-1.0 range
    const normalizedLevel = Math.max(0, (audioLevel + 160) / 160);
    
    const isSpeechDetected = normalizedLevel > this.config.energyThreshold;

    if (isSpeechDetected) {
      // Speech detected
      if (!this.isSpeaking) {
        console.log('[ContinuousRecording] 🎤 Speech started');
        this.isSpeaking = true;
        this.phraseStartTime = Date.now();
      }
      
      // Clear any pending silence timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
    } else if (this.isSpeaking) {
      // Silence detected while user was speaking
      if (!this.silenceTimer) {
        // Start silence timer
        this.silenceTimer = setTimeout(() => {
          this.endPhrase();
        }, this.config.silenceDuration);
      }
    }
  }

  /**
   * End current phrase and process audio
   */
  private async endPhrase(): Promise<void> {
    const phraseDuration = Date.now() - this.phraseStartTime;
    
    // Check minimum duration
    if (phraseDuration < this.config.minPhraseDuration) {
      console.log(`[ContinuousRecording] ⏭️ Phrase too short (${phraseDuration}ms), ignoring`);
      this.isSpeaking = false;
      this.silenceTimer = null;
      return;
    }

    console.log(`[ContinuousRecording] ✅ Phrase ended (${phraseDuration}ms)`);
    this.isSpeaking = false;
    this.silenceTimer = null;

    if (!this.recording) {
      console.warn('[ContinuousRecording] No active recording');
      return;
    }

    try {
      // Get current recording URI
      const uri = this.recording.getURI();
      
      // Stop current recording
      await this.recording.stopAndUnloadAsync();
      this.recording = null;

      // Process chunk asynchronously (don't wait)
      if (uri && this.onPhraseDetected) {
        this.recordingCounter++;
        const chunkId = this.recordingCounter;
        console.log(`[ContinuousRecording] 📦 Processing chunk #${chunkId}`);
        
        this.processChunkAsync(uri, chunkId).catch(error => {
          console.error(`[ContinuousRecording] Error processing chunk #${chunkId}:`, error);
        });
      }

      // Immediately start new recording session (continuous)
      if (this.isListening) {
        await this.startRecordingSession();
      }
    } catch (error) {
      console.error('[ContinuousRecording] Error in endPhrase:', error);
      
      // Try to recover by starting a new session
      if (this.isListening) {
        try {
          await this.startRecordingSession();
        } catch (recoveryError) {
          console.error('[ContinuousRecording] Failed to recover:', recoveryError);
        }
      }
    }
  }

  /**
   * Process audio chunk asynchronously
   * Runs in background without blocking new recordings
   */
  private async processChunkAsync(audioUri: string, chunkId: number): Promise<void> {
    try {
      console.log(`[ContinuousRecording] ⏳ Processing chunk #${chunkId}...`);
      
      if (this.onPhraseDetected) {
        await this.onPhraseDetected(audioUri);
      }
      
      console.log(`[ContinuousRecording] ✅ Chunk #${chunkId} processed successfully`);
      
      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn(`[ContinuousRecording] Failed to cleanup chunk #${chunkId}:`, cleanupError);
      }
    } catch (error) {
      console.error(`[ContinuousRecording] ❌ Failed to process chunk #${chunkId}:`, error);
    }
  }

  /**
   * Notify service that TTS is playing
   * Used for echo cancellation
   * @param playing - true if TTS started, false if stopped
   */
  setTTSPlaying(playing: boolean): void {
    this.isTTSPlaying = playing;
    console.log(`[ContinuousRecording] 🔊 TTS ${playing ? 'started' : 'stopped'}`);
  }

  /**
   * Update VAD configuration
   * @param config - Partial config to update
   */
  updateConfig(config: Partial<VADConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[ContinuousRecording] Config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): VADConfig {
    return { ...this.config };
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Check if currently detecting speech
   */
  isDetectingSpeech(): boolean {
    return this.isSpeaking;
  }

  /**
   * Stop continuous recording
   */
  async stop(): Promise<void> {
    console.log('[ContinuousRecording] Stopping continuous mode');
    
    this.isListening = false;
    this.onPhraseDetected = null;

    // Clear silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    // Stop recording
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('[ContinuousRecording] Error stopping recording:', error);
      }
      this.recording = null;
    }

    // Reset audio mode
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('[ContinuousRecording] Error resetting audio mode:', error);
    }

    this.isSpeaking = false;
    this.isTTSPlaying = false;
    console.log('[ContinuousRecording] Stopped');
  }
}

