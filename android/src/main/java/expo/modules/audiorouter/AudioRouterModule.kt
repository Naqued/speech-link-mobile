package expo.modules.audiorouter

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Process
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.FileInputStream
import java.util.concurrent.atomic.AtomicBoolean
import expo.modules.kotlin.Promise

class AudioRouterModule : Module() {
  private val TAG = "AudioRouterModule"
  private var audioTrack: AudioTrack? = null
  private val isRouting = AtomicBoolean(false)

  override fun definition() = ModuleDefinition {
    Name("AudioRouter")
    
    AsyncFunction("routeAudioToMicrophone") { audioFilePath: String, promise: Promise ->
      Log.d(TAG, "Expo Module: routeAudioToMicrophone called with path: $audioFilePath")
      try {
        if (isRouting.get()) {
          Log.d(TAG, "Already routing audio, stopping current routing")
          stopAudioRouting(null)
        }
        
        // Setup audio configuration
        val sampleRate = 44100
        val channelConfig = AudioFormat.CHANNEL_OUT_MONO
        val encoding = AudioFormat.ENCODING_PCM_16BIT
        
        Log.d(TAG, "Setting up audio configuration: sampleRate=$sampleRate, channelConfig=$channelConfig, encoding=$encoding")
        
        // Configure with communication focus
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()
            
        val audioFormat = AudioFormat.Builder()
            .setEncoding(encoding)
            .setSampleRate(sampleRate)
            .setChannelMask(channelConfig)
            .build()
            
        val bufferSize = AudioTrack.getMinBufferSize(sampleRate, channelConfig, encoding)
        Log.d(TAG, "Audio buffer size: $bufferSize")
        
        // Create AudioTrack with proper communication attributes
        audioTrack = AudioTrack.Builder()
            .setAudioAttributes(audioAttributes)
            .setAudioFormat(audioFormat)
            .setBufferSizeInBytes(bufferSize)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()
            
        // Set thread priority for better audio performance
        Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)
        
        // Load and play the file
        Log.d(TAG, "Creating FileInputStream for: $audioFilePath")
        val fileInputStream = FileInputStream(audioFilePath)
        val buffer = ByteArray(bufferSize)
        
        Log.d(TAG, "Starting audio playback")
        audioTrack?.play()
        
        isRouting.set(true)
        
        // Use a separate thread to play the audio
        Thread {
          try {
            var bytesRead: Int
            while (fileInputStream.read(buffer).also { bytesRead = it } != -1 && isRouting.get()) {
              if (bytesRead > 0) {
                audioTrack?.write(buffer, 0, bytesRead)
              }
            }
            fileInputStream.close()
            
            // Only stop if we're still routing (not if stopAudioRouting was called)
            if (isRouting.get()) {
              stopAudioRouting(null)
            }
          } catch (e: Exception) {
            Log.e(TAG, "Error playing audio file", e)
            promise.reject("ERROR_PLAYING_AUDIO", "Failed to play audio file: ${e.message}")
          }
        }.start()
        
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "Error in routeAudioToMicrophone", e)
        promise.reject("ERROR_ROUTING_AUDIO", "Failed to route audio: ${e.message}")
        return@AsyncFunction
      }
    }
    
    AsyncFunction("stopAudioRouting") { promise: Promise? ->
      Log.d(TAG, "stopAudioRouting called")
      try {
        isRouting.set(false)
        
        audioTrack?.let {
          try {
            it.pause()
            it.flush()
            it.stop()
            it.release()
          } catch (e: Exception) {
            Log.e(TAG, "Error stopping AudioTrack", e)
          }
        }
        
        audioTrack = null
        
        promise?.resolve(null)
      } catch (e: Exception) {
        Log.e(TAG, "Error in stopAudioRouting", e)
        promise?.reject("ERROR_STOPPING_AUDIO", "Failed to stop audio routing: ${e.message}")
      }
    }
  }
} 