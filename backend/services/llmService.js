const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * LLM Service for journal entry analysis
 */
class LLMService {
  constructor() {
    this.model = 'llama3-8b-8192'; // Using Llama 3.1 8B model
  }

  /**
   * Analyze journal entry and generate AI response with mood
   * @param {string} journalContent - The user's journal entry
   * @returns {Promise<Object>} - AI response and mood analysis
   */
  async analyzeJournalEntry(journalContent) {
    try {
      console.log('🤖 Starting journal analysis for entry:', journalContent.substring(0, 100) + '...');
      
      const prompt = this.buildAnalysisPrompt(journalContent);
      const response = await this.callGroqAPI(prompt);
      
      // Parse the response to extract mood and AI comment
      const parsedResponse = this.parseLLMResponse(response);
      
      console.log('✅ Journal analysis completed:', {
        mood: parsedResponse.mood,
        aiCommentLength: parsedResponse.aiComment.length
      });
      
      return parsedResponse;
    } catch (error) {
      console.error('❌ Error in journal analysis:', error);
      throw new Error('Failed to analyze journal entry');
    }
  }

  /**
 * Build the prompt for journal analysis
 * @param {string} journalContent - The user's journal entry
 * @returns {string} - Formatted prompt for LLM
 */
buildAnalysisPrompt(journalContent) {
  return `You are a compassionate AI mental health companion designed to support users through their journaling journey. Your role is to provide empathetic responses, identify emotional states, and suggest helpful activities.

Instructions:
Analyze the following journal entry and provide:

1. Mood Identification: Determine the primary mood from these options:
   - Calm - peaceful, serene, relaxed
   - Reflective - thoughtful, contemplative, introspective  
   - Anxious - worried, nervous, restless
   - Excited - enthusiastic, energetic, anticipatory
   - Sad - melancholy, downhearted, grieving
   - Grateful - thankful, appreciative, blessed
   - Stressed - overwhelmed, pressured, tense
   - Hopeful - optimistic, encouraged, forward-looking
   - Confused - uncertain, unclear, conflicted
   - Angry - frustrated, irritated, resentful
   - Peaceful - content, harmonious, balanced
   - Overwhelmed - flooded, unable to cope, burnt out

2. Supportive Response: Provide a warm, empathetic response (2-3 sentences) that validates their feelings and acknowledges their experience.

3. Helpful Activities: Suggest 2-3 specific, actionable activities tailored to their current emotional state that can help them process their feelings or improve their wellbeing.

Response Format:
MOOD: [identified mood]

RESPONSE: [Your supportive, empathetic response validating their feelings]

SUGGESTED ACTIVITIES:
- [Activity 1 with brief explanation of why it might help]
- [Activity 2 with brief explanation of why it might help]  
- [Activity 3 with brief explanation of why it might help]

Guidelines:
- Always be non-judgmental and supportive
- Focus on emotional validation before offering suggestions
- Suggest evidence-based wellness activities appropriate for the mood
- Avoid giving medical or therapeutic advice
- Encourage professional help if the entry indicates serious distress
- Keep suggestions practical and accessible

Journal Entry: "${journalContent}"`;
}

  /**
   * Call Groq API with the given prompt
   * @param {string} prompt - The prompt to send to the LLM
   * @returns {Promise<string>} - LLM response
   */
  async callGroqAPI(prompt) {
    try {
      console.log('📡 Calling Groq API...');
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content;
      console.log('📡 Groq API response received');
      
      return response;
    } catch (error) {
      console.error('❌ Groq API error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Parse the LLM response to extract mood and AI comment
   * @param {string} response - Raw LLM response
   * @returns {Object} - Parsed response with mood and aiComment
   */
  parseLLMResponse(response) {
    try {
      console.log('🔍 Parsing LLM response:', response);
      
      // Extract mood
      const moodMatch = response.match(/MOOD:\s*(\w+)/i);
      const mood = moodMatch ? moodMatch[1].toLowerCase() : 'reflective';
      
      // Extract AI comment
      const responseMatch = response.match(/RESPONSE:\s*(.+)/i);
      const aiComment = responseMatch ? responseMatch[1].trim() : 
        'Thank you for sharing your thoughts. I appreciate your openness and courage in expressing yourself.';
      
      // Validate mood
      const validMoods = ['calm', 'reflective', 'anxious', 'excited', 'sad', 'grateful', 'stressed', 'hopeful', 'confused', 'angry', 'peaceful', 'overwhelmed'];
      const validatedMood = validMoods.includes(mood) ? mood : 'reflective';
      
      return {
        mood: validatedMood,
        aiComment: aiComment
      };
    } catch (error) {
      console.error('❌ Error parsing LLM response:', error);
      return {
        mood: 'reflective',
        aiComment: 'Thank you for sharing your thoughts. I appreciate your openness and courage in expressing yourself.'
      };
    }
  }

  /**
   * Test the LLM service
   * @returns {Promise<boolean>} - True if service is working
   */
  async testConnection() {
    try {
      const testPrompt = 'Test connection. Respond with: "Connection successful"';
      const response = await this.callGroqAPI(testPrompt);
      console.log('✅ LLM service test successful:', response);
      return true;
    } catch (error) {
      console.error('❌ LLM service test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const llmService = new LLMService();

module.exports = llmService; 