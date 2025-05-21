// This plugin helps Expo find and register our custom native module
module.exports = (config) => {
  console.log('Running app configuration plugin...');
  
  // Check if we need to add Google authentication support
  if (!config.android) {
    config.android = {};
  }
  
  if (!config.android.intentFilters) {
    config.android.intentFilters = [];
  }

  // Add an intent filter to handle Google auth redirect
  config.android.intentFilters.push({
    action: "VIEW",
    autoVerify: true,
    data: [
      {
        scheme: "com.naqued.speechlinkmobile",
      },
    ],
    category: ["BROWSABLE", "DEFAULT"],
  });
  
  return config;
}; 