// Model fallback utility for handling rate limits
export class ModelFallback {
  constructor(openaiClient) {
    this.openai = openaiClient;
    
    // List of free models to try in order with their typical reset intervals
    // Updated with currently working models as of December 2024
    this.models = [
      { 
        name: 'google/gemini-2.0-flash-exp:free',
        resetInterval: 60 * 1000, // 1 minute
        provider: 'Google'
      },
      { 
        name: 'meta-llama/llama-3.2-3b-instruct:free',
        resetInterval: 60 * 1000, // 1 minute
        provider: 'Meta'
      },
      { 
        name: 'qwen/qwen-2.5-7b-instruct:free',
        resetInterval: 60 * 1000, // 1 minute
        provider: 'Qwen'
      },
      { 
        name: 'mistralai/mistral-7b-instruct:free',
        resetInterval: 120 * 1000, // 2 minutes
        provider: 'Mistral'
      },
      { 
        name: 'nousresearch/hermes-3-llama-3.1-405b:free',
        resetInterval: 180 * 1000, // 3 minutes
        provider: 'Nous Research'
      }
    ];
    
    this.currentModelIndex = 0;
    this.rateLimitedModels = new Map(); // Track when models were rate limited
    this.lastSuccessfulModel = null;
  }

  async makeRequest(messages, options = {}) {
    // First, check if any previously rate-limited models are now available
    this.checkRateLimitResets();
    
    const maxRetries = this.models.length;
    let lastError = null;
    let availableModels = this.getAvailableModels();

    // If we have a last successful model that's available, try it first
    if (this.lastSuccessfulModel && availableModels.includes(this.lastSuccessfulModel)) {
      const modelIndex = this.models.findIndex(m => m.name === this.lastSuccessfulModel);
      if (modelIndex !== -1) {
        this.currentModelIndex = modelIndex;
      }
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const currentModel = this.models[this.currentModelIndex];
      
      // Skip if this model is currently rate limited
      if (this.isModelRateLimited(currentModel.name)) {
        const resetTime = this.getRateLimitResetTime(currentModel.name);
        console.log(`⏰ Skipping ${currentModel.name} - rate limited until ${resetTime.toLocaleTimeString()}`);
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
        continue;
      }
      
      try {
        console.log(`🤖 Trying model: ${currentModel.name} (${currentModel.provider}) - attempt ${attempt + 1}/${maxRetries}`);
        
        const completion = await this.openai.chat.completions.create({
          model: currentModel.name,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 500,
          ...options
        });

        const response = completion.choices[0]?.message?.content;
        
        if (response) {
          console.log(`✅ Success with model: ${currentModel.name} (${currentModel.provider})`);
          this.lastSuccessfulModel = currentModel.name;
          // Clear any previous rate limit for this model
          this.rateLimitedModels.delete(currentModel.name);
          return response;
        } else {
          throw new Error('Empty response from model');
        }

      } catch (error) {
        console.log(`❌ Model ${currentModel.name} failed:`, error.message);
        lastError = error;

        // If it's a rate limit error, record it and try next model
        if (error.status === 429) {
          this.recordRateLimit(currentModel.name, currentModel.resetInterval);
          console.log(`🔄 Rate limited on ${currentModel.name}, trying next model...`);
          this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
          continue;
        }

        // If it's not a rate limit, try next model anyway
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
      }
    }

    // If all models failed, provide helpful information
    console.error('🚨 All models failed!');
    this.logRateLimitStatus();
    throw lastError || new Error('All AI models are currently unavailable');
  }

  getCurrentModel() {
    return this.models[this.currentModelIndex].name;
  }

  resetToFirstModel() {
    this.currentModelIndex = 0;
  }

  // Record when a model gets rate limited
  recordRateLimit(modelName, resetInterval) {
    const resetTime = new Date(Date.now() + resetInterval);
    this.rateLimitedModels.set(modelName, resetTime);
    console.log(`📝 Recorded rate limit for ${modelName} - reset expected at ${resetTime.toLocaleTimeString()}`);
  }

  // Check if a model is currently rate limited
  isModelRateLimited(modelName) {
    const resetTime = this.rateLimitedModels.get(modelName);
    if (!resetTime) return false;
    
    return Date.now() < resetTime.getTime();
  }

  // Get the reset time for a rate limited model
  getRateLimitResetTime(modelName) {
    return this.rateLimitedModels.get(modelName);
  }

  // Check and clear expired rate limits
  checkRateLimitResets() {
    const now = Date.now();
    const resetModels = [];
    
    for (const [modelName, resetTime] of this.rateLimitedModels.entries()) {
      if (now >= resetTime.getTime()) {
        this.rateLimitedModels.delete(modelName);
        resetModels.push(modelName);
      }
    }
    
    if (resetModels.length > 0) {
      console.log(`🔄 Rate limits reset for: ${resetModels.join(', ')}`);
    }
  }

  // Get list of currently available (non-rate-limited) models
  getAvailableModels() {
    return this.models
      .filter(model => !this.isModelRateLimited(model.name))
      .map(model => model.name);
  }

  // Log current rate limit status
  logRateLimitStatus() {
    console.log('📊 Current Rate Limit Status:');
    
    for (const model of this.models) {
      if (this.isModelRateLimited(model.name)) {
        const resetTime = this.getRateLimitResetTime(model.name);
        const minutesLeft = Math.ceil((resetTime.getTime() - Date.now()) / (60 * 1000));
        console.log(`├─ ❌ ${model.name} (${model.provider}) - Reset in ${minutesLeft} minutes`);
      } else {
        console.log(`├─ ✅ ${model.name} (${model.provider}) - Available`);
      }
    }
    
    const availableCount = this.getAvailableModels().length;
    console.log(`└─ 📈 ${availableCount}/${this.models.length} models currently available`);
  }

  // Get next available reset time
  getNextResetTime() {
    let nextReset = null;
    
    for (const resetTime of this.rateLimitedModels.values()) {
      if (!nextReset || resetTime < nextReset) {
        nextReset = resetTime;
      }
    }
    
    return nextReset;
  }

  // Get status summary for API responses
  getStatusSummary() {
    const availableModels = this.getAvailableModels();
    const nextReset = this.getNextResetTime();
    
    return {
      availableModels: availableModels.length,
      totalModels: this.models.length,
      nextResetTime: nextReset,
      nextResetMinutes: nextReset ? Math.ceil((nextReset.getTime() - Date.now()) / (60 * 1000)) : null,
      lastSuccessfulModel: this.lastSuccessfulModel
    };
  }
}