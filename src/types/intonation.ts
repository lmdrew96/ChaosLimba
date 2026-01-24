export interface StressVariant {
  meaning: string;           // English translation
  category: string;          // Semantic category (food, violence, furniture, etc.)
  ipa: string;              // IPA notation with stress marker
  severity?: 'low' | 'medium' | 'high';  // Importance of getting it right
  example_sentence?: string; // Example usage
}

export interface MinimalPair {
  [stressPattern: string]: StressVariant;
}

export interface IntonationWarning {
  word: string;
  position: number;              // Word index in sentence
  expected_stress: string;       // Context-appropriate stress
  user_stress: string;           // What user actually said
  expected_meaning: string;      // What they meant to say
  actual_meaning: string;        // What they actually said
  severity: 'low' | 'medium' | 'high';
  explanation: string;           // User-friendly explanation
}

export interface StressPattern {
  word: string;
  stress: string;
}
