/**
 * Debug utility for testing Hindi API calls
 * Use this to diagnose issues with Hindi language data fetching
 */

import { apiService } from '../services/apiService';
import { API_CONFIG } from '../config/api';

interface DebugResult {
  language: string;
  endpoint: string;
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
  responseTime: number;
}

/**
 * Test API calls for different languages to compare responses
 */
export const debugLanguageAPIs = async (): Promise<{
  categories: DebugResult[];
  sentences: DebugResult[];
  summary: string;
}> => {
  console.log('🔍 Starting Hindi API Debug Session');
  console.log('📡 API Base URL:', API_CONFIG.BASE_URL);
  console.log('📱 Environment:', API_CONFIG.IS_DEV ? 'Development' : 'Production');
  
  const languagesToTest = ['hi', 'en', 'fr', 'de'];
  const categoryResults: DebugResult[] = [];
  const sentenceResults: DebugResult[] = [];
  
  // Test categories endpoint
  console.log('\n📂 Testing Categories Endpoint...');
  for (const lang of languagesToTest) {
    const startTime = Date.now();
    const endpoint = `/api/sentence-categories?language=${lang}`;
    
    try {
      console.log(`   Testing ${lang}: ${endpoint}`);
      const response = await apiService.get<{ categories: any[] }>(endpoint);
      const responseTime = Date.now() - startTime;
      
      const result: DebugResult = {
        language: lang,
        endpoint,
        success: true,
        data: response,
        responseTime
      };
      
      categoryResults.push(result);
      console.log(`   ✅ ${lang}: ${response?.categories?.length || 0} categories (${responseTime}ms)`);
      
      // Log sample category for Hindi
      if (lang === 'hi' && response?.categories?.length > 0) {
        console.log(`   📋 Sample Hindi category:`, response.categories[0]);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: DebugResult = {
        language: lang,
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      };
      
      categoryResults.push(result);
      console.log(`   ❌ ${lang}: Error - ${result.error} (${responseTime}ms)`);
    }
  }
  
  // Test sentences endpoint
  console.log('\n📄 Testing Sentences Endpoint...');
  for (const lang of languagesToTest) {
    const startTime = Date.now();
    const endpoint = `/api/sample-sentences?language=${lang}`;
    
    try {
      console.log(`   Testing ${lang}: ${endpoint}`);
      const response = await apiService.get<{ sentences: any[] }>(endpoint);
      const responseTime = Date.now() - startTime;
      
      const result: DebugResult = {
        language: lang,
        endpoint,
        success: true,
        data: response,
        responseTime
      };
      
      sentenceResults.push(result);
      console.log(`   ✅ ${lang}: ${response?.sentences?.length || 0} sentences (${responseTime}ms)`);
      
      // Log sample sentence for Hindi
      if (lang === 'hi' && response?.sentences?.length > 0) {
        console.log(`   📝 Sample Hindi sentence:`, response.sentences[0]);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: DebugResult = {
        language: lang,
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      };
      
      sentenceResults.push(result);
      console.log(`   ❌ ${lang}: Error - ${result.error} (${responseTime}ms)`);
    }
  }
  
  // Generate summary
  const hindiCategoryResult = categoryResults.find(r => r.language === 'hi');
  const hindiSentenceResult = sentenceResults.find(r => r.language === 'hi');
  const englishCategoryResult = categoryResults.find(r => r.language === 'en');
  const englishSentenceResult = sentenceResults.find(r => r.language === 'en');
  
  let summary = '📊 HINDI API DIAGNOSIS SUMMARY:\n';
  
  // Categories analysis
  if (hindiCategoryResult?.success) {
    const hindiCount = hindiCategoryResult.data?.categories?.length || 0;
    const englishCount = englishCategoryResult?.data?.categories?.length || 0;
    
    if (hindiCount === 0) {
      summary += '❌ Categories: No Hindi categories found\n';
    } else if (hindiCount === englishCount) {
      summary += `⚠️  Categories: Same count as English (${hindiCount}) - possible fallback\n`;
    } else {
      summary += `✅ Categories: Hindi has ${hindiCount} categories\n`;
    }
  } else {
    summary += `❌ Categories: API call failed - ${hindiCategoryResult?.error}\n`;
  }
  
  // Sentences analysis
  if (hindiSentenceResult?.success) {
    const hindiCount = hindiSentenceResult.data?.sentences?.length || 0;
    const englishCount = englishSentenceResult?.data?.sentences?.length || 0;
    
    if (hindiCount === 0) {
      summary += '❌ Sentences: No Hindi sentences found\n';
    } else if (hindiCount === englishCount) {
      summary += `⚠️  Sentences: Same count as English (${hindiCount}) - possible fallback\n`;
    } else {
      summary += `✅ Sentences: Hindi has ${hindiCount} sentences\n`;
    }
    
    // Check if any sentences are actually in Hindi
    const hindiSentences = hindiSentenceResult.data?.sentences || [];
    const actuallyHindi = hindiSentences.some((s: any) => s.language === 'hi');
    if (!actuallyHindi && hindiSentences.length > 0) {
      summary += '⚠️  Warning: Sentences found but none have language="hi"\n';
    }
  } else {
    summary += `❌ Sentences: API call failed - ${hindiSentenceResult?.error}\n`;
  }
  
  console.log('\n' + summary);
  
  return {
    categories: categoryResults,
    sentences: sentenceResults,
    summary
  };
};

/**
 * Quick test for Hindi API - call this from console or component
 */
export const quickHindiTest = async (): Promise<void> => {
  console.log('🚀 Quick Hindi API Test');
  
  try {
    const results = await debugLanguageAPIs();
    
    console.log('\n📋 Quick Results:');
    const hindiCategories = results.categories.find(r => r.language === 'hi');
    const hindiSentences = results.sentences.find(r => r.language === 'hi');
    
    console.log(`Categories (hi): ${hindiCategories?.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Sentences (hi): ${hindiSentences?.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (hindiCategories?.success) {
      console.log(`   - Found ${hindiCategories.data?.categories?.length || 0} categories`);
    }
    
    if (hindiSentences?.success) {
      console.log(`   - Found ${hindiSentences.data?.sentences?.length || 0} sentences`);
    }
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
};

// Export for window access in development
if (__DEV__) {
  (global as any).debugHindiAPI = {
    full: debugLanguageAPIs,
    quick: quickHindiTest
  };
  
  console.log('🛠️  Hindi Debug Tools Available:');
  console.log('   - debugHindiAPI.quick() - Quick test');
  console.log('   - debugHindiAPI.full() - Full analysis');
} 