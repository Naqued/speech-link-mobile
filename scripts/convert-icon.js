/**
 * SVG to PNG Conversion Script
 * 
 * This script converts the mic-icon.svg to icon.png for use as the app icon.
 * 
 * Usage:
 * 1. npm install sharp
 * 2. node scripts/convert-icon.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Paths
const svgPath = path.join(__dirname, '../assets/mic-icon.svg');
const pngPath = path.join(__dirname, '../assets/icon.png');
const adaptiveIconPath = path.join(__dirname, '../assets/adaptive-icon.png');
const splashPath = path.join(__dirname, '../assets/splash.png');

console.log('Converting mic-icon.svg to icon.png...');

// Check if sharp is installed
exec('npm list sharp', (error, stdout, stderr) => {
  if (stdout.includes('(empty)')) {
    console.log('Sharp is not installed. Installing...');
    exec('npm install --no-save sharp', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing sharp: ${error}`);
        return;
      }
      convertSvgToPng();
    });
  } else {
    convertSvgToPng();
  }
});

function convertSvgToPng() {
  // Dynamic import since we might need to install sharp first
  import('sharp').then((sharp) => {
    // Create a 1024x1024 pixel icon (Expo recommended size)
    sharp.default(svgPath)
      .resize(1024, 1024)
      .png()
      .toFile(pngPath)
      .then(() => {
        console.log(`Icon successfully created at ${pngPath}`);
        
        // Also update the adaptive icon (for Android)
        sharp.default(svgPath)
          .resize(1024, 1024)
          .png()
          .toFile(adaptiveIconPath)
          .then(() => {
            console.log(`Adaptive icon successfully created at ${adaptiveIconPath}`);
            
            // Create splash screen with the icon centered on a background
            // Splash screen is 2048x2048 with the icon centered at 50% size
            createSplashScreen(sharp.default);
          })
          .catch(err => {
            console.error(`Error creating adaptive icon: ${err}`);
          });
      })
      .catch(err => {
        console.error(`Error creating icon: ${err}`);
      });
  }).catch(err => {
    console.error(`Error importing sharp: ${err}`);
    console.log('\nAlternative method: If you have Inkscape installed, you can use:');
    console.log('inkscape -w 1024 -h 1024 assets/mic-icon.svg -o assets/icon.png');
    console.log('\nOr if you have ImageMagick installed:');
    console.log('convert -background none -density 1024x1024 assets/mic-icon.svg assets/icon.png');
  });
}

function createSplashScreen(sharp) {
  // Create a 2048x2048 empty canvas with the app's primary color as background
  sharp({
    create: {
      width: 2048,
      height: 2048,
      channels: 4,
      background: { r: 74, g: 111, b: 234, alpha: 1 } // #4A6FEA
    }
  })
  .composite([
    {
      input: svgPath,
      gravity: 'center',
      // Make the icon 60% of the splash screen size
      width: 1229, // 60% of 2048
      height: 1229
    }
  ])
  .png()
  .toFile(splashPath)
  .then(() => {
    console.log(`Splash screen successfully created at ${splashPath}`);
  })
  .catch(err => {
    console.error(`Error creating splash screen: ${err}`);
  });
} 