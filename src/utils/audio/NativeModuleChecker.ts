import { NativeModules } from 'react-native';

export class NativeModuleChecker {
  /**
   * Checks if a specific native module is available
   */
  static isModuleAvailable(moduleName: string): boolean {
    const modules = Object.keys(NativeModules);
    const isAvailable = modules.includes(moduleName);
    console.log(`Is ${moduleName} available:`, isAvailable);
    return isAvailable;
  }
  
  /**
   * Lists all available native modules
   */
  static listAvailableModules(): string[] {
    const modules = Object.keys(NativeModules);
    console.log('Available Native Modules:', modules.join(', '));
    return modules;
  }
  
  /**
   * Specifically checks for the AudioRouterModule availability
   */
  static isAudioRouterModuleAvailable(): boolean {
    const isAvailable = this.isModuleAvailable('AudioRouterModule');
    
    if (!isAvailable) {
      console.error('AudioRouterModule is not available');
      // Log all available modules for debugging
      this.listAvailableModules();
    }
    
    return isAvailable;
  }
} 