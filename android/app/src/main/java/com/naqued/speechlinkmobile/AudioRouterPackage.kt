package com.naqued.speechlinkmobile

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class AudioRouterPackage : ReactPackage {
    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<View, ReactShadowNode<*>>> {
        return emptyList()
    }

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> {
        val modules = ArrayList<NativeModule>()
        modules.add(AudioRouterModule(reactContext))
        return modules
    }
} 