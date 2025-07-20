const express = require('express');
const llmService = require('../services/llmService');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/test/llm
// @desc    Test LLM service with a sample journal entry
// @access  Private
router.post('/llm', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Journal content is required'
      });
    }

    console.log('🧪 Testing LLM service with content:', content.substring(0, 100) + '...');
    
    // Test the LLM service
    const analysis = await llmService.analyzeJournalEntry(content);
    
    res.json({
      success: true,
      message: 'LLM test completed successfully',
      data: {
        originalContent: content,
        analysis: analysis
      }
    });
    
  } catch (error) {
    console.error('❌ LLM test failed:', error);
    res.status(500).json({
      success: false,
      message: 'LLM test failed',
      error: error.message
    });
  }
});

// @route   GET /api/test/llm/connection
// @desc    Test LLM service connection
// @access  Private
router.get('/llm/connection', auth, async (req, res) => {
  try {
    console.log('🔗 Testing LLM service connection...');
    
    const isConnected = await llmService.testConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'LLM service connection successful'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'LLM service connection failed'
      });
    }
    
  } catch (error) {
    console.error('❌ LLM connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'LLM connection test failed',
      error: error.message
    });
  }
});

module.exports = router; 