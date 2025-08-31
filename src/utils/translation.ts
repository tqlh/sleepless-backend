export const translateText = async (text: string, sourceLanguage: string, targetLanguage: string = 'en'): Promise<string> => {
  // Don't translate if already in target language
  if (sourceLanguage === targetLanguage) {
    return text;
  }
  
  try {
    // Use proper language pair format: source|target
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Translation service error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.responseData?.translatedText && data.responseData.translatedText !== text) {
      return data.responseData.translatedText;
    } else {
      // Fallback: return original text with note if translation failed
      return `[Translation unavailable] ${text}`;
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text with note instead of throwing
    return `[Translation failed] ${text}`;
  }
};