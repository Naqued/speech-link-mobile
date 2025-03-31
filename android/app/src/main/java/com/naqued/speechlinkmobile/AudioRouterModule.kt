package com.naqued.speechlinkmobile

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.os.Process
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.FileInputStream
import java.io.IOException
import java.util.concurrent.atomic.AtomicBoolean

class AudioRouterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val TAG = "AudioRouterModule"
    
    private var audioTrack: AudioTrack? = null
    private var audioRecord: AudioRecord? = null
    private val isRouting = AtomicBoolean(false)
    private var routingThread: Thread? = null
    
    override fun getName(): String {
        return "AudioRouterModule"
    }
    
    @ReactMethod
    fun routeAudioToMicrophone(audioFilePath: String, promise: Promise) {
        try {
            if (isRouting.get()) {
                stopAudioRouting(null)
            }
            
            // Setup audio configuration
            val sampleRate = 44100
            val channelConfig = AudioFormat.CHANNEL_OUT_MONO
            val encoding = AudioFormat.ENCODING_PCM_16BIT
            
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
            val fileInputStream = FileInputStream(audioFilePath)
            val buffer = ByteArray(bufferSize)
            
            audioTrack?.play()
            
            isRouting.set(true)
            routingThread = Thread {
                try {
                    var bytesRead: Int
                    while (isRouting.get() && fileInputStream.read(buffer).also { bytesRead = it } > 0) {
                        audioTrack?.write(buffer, 0, bytesRead)
                    }
                    fileInputStream.close()
                } catch (e: IOException) {
                    Log.e(TAG, "Audio routing error: ${e.message}")
                }
            }
            
            routingThread?.start()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("AUDIO_ROUTING_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun stopAudioRouting(promise: Promise?) {
        try {
            isRouting.set(false)
            
            routingThread?.let {
                try {
                    it.join(1000)
                } catch (e: InterruptedException) {
                    Log.e(TAG, "Error interrupting routing thread: ${e.message}")
                }
                routingThread = null
            }
            
            audioTrack?.let {
                it.stop()
                it.release()
                audioTrack = null
            }
            
            audioRecord?.let {
                it.stop()
                it.release()
                audioRecord = null
            }
            
            promise?.resolve(null)
        } catch (e: Exception) {
            promise?.reject("AUDIO_ROUTING_ERROR", e.message, e)
        }
    }
} 