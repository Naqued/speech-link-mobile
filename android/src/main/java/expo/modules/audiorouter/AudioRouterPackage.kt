package expo.modules.audiorouter

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleRegistryModule

class AudioRouterPackage : ModuleRegistryModule {
  override fun createModules(): List<Module> {
    return listOf(AudioRouterModule())
  }
} 