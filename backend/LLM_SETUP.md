# LLM Service Setup Guide

## Overview
The LLM service integrates Groq's API to provide AI-powered analysis of journal entries, including mood determination and supportive responses.

## Setup Instructions

### 1. Get Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

### 2. Environment Variables
Add the following to your `.env` file:

```env
# Groq API Configuration
GROQ_API_KEY=your-groq-api-key-here
```

### 3. Install Dependencies
```bash
npm install groq-sdk
```

## Features

### Journal Entry Analysis
- **Mood Detection**: Automatically determines user's mood from 12 options
- **AI Response**: Generates supportive, empathetic responses
- **Sentiment Analysis**: Categorizes entries as positive, negative, or neutral

### Supported Moods
- calm, reflective, anxious, excited, sad, grateful, stressed, hopeful, confused, angry, peaceful, overwhelmed

### API Endpoints

#### Create Journal Entry (with LLM analysis)
```
POST /api/journal/entries
```
The LLM analysis is automatically triggered when a new journal entry is created.

#### Test LLM Service
```
POST /api/test/llm
Body: { "content": "Your journal entry here" }
```

#### Test LLM Connection
```
GET /api/test/llm/connection
```

## Architecture

### Files Structure
```
backend/
├── services/
│   └── llmService.js          # Main LLM service
├── routes/
│   ├── journal.js             # Updated with LLM integration
│   └── test.js                # Test routes for LLM
└── models/
    └── JournalEntry.js        # Updated with aiComment field
```

### LLM Service Methods
- `analyzeJournalEntry(content)` - Main analysis function
- `callGroqAPI(prompt)` - Makes API calls to Groq
- `parseLLMResponse(response)` - Parses LLM response
- `testConnection()` - Tests API connectivity

## Error Handling
- Graceful fallback if LLM service fails
- Detailed logging for debugging
- Rate limiting to prevent API abuse

## Customization

### Prompt Engineering
Edit the `buildAnalysisPrompt()` method in `llmService.js` to customize:
- Response tone and style
- Mood detection criteria
- Response length and format

### Model Selection
Change the model in `llmService.js`:
```javascript
this.model = 'llama3-8b-8192'; // Current model
// Other options: 'mixtral-8x7b-32768', 'gemma-7b-it'
```

## Testing
1. Start the backend server
2. Test connection: `GET /api/test/llm/connection`
3. Test analysis: `POST /api/test/llm` with sample content
4. Create a journal entry to see full integration

## Troubleshooting

### Common Issues
1. **API Key Invalid**: Check your Groq API key
2. **Rate Limiting**: Groq has rate limits, check your usage
3. **Network Issues**: Ensure stable internet connection
4. **Model Availability**: Some models may be temporarily unavailable

### Debug Logs
The service provides detailed console logs:
- 🤖 Starting analysis
- 📡 API calls
- ✅ Success responses
- ❌ Error messages

## Security Considerations
- API keys are stored in environment variables
- Rate limiting prevents abuse
- Input validation on all journal entries
- No sensitive data sent to LLM (only journal content) 