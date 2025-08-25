// models-config.js - Конфигурация AI моделей для Copilot

class ModelsConfig {
    constructor() {
        this.models = {
            // OpenAI модели
            'openai-gpt-3.5': {
                id: 'openai-gpt-3.5',
                name: 'OpenAI GPT-3.5 Turbo',
                provider: 'openai',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo',
                maxTokens: 4096,
                temperature: 0.3,
                requiresApiKey: true,
                icon: '🤖',
                description: 'Быстрая и эффективная модель для анализа кода',
                features: ['code-analysis', 'recommendations', 'security-check']
            },
            'openai-gpt-4': {
                id: 'openai-gpt-4',
                name: 'OpenAI GPT-4',
                provider: 'openai',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-4',
                maxTokens: 8192,
                temperature: 0.3,
                requiresApiKey: true,
                icon: '🧠',
                description: 'Продвинутая модель для глубокого анализа',
                features: ['code-analysis', 'recommendations', 'security-check', 'architecture-review']
            },
            
            // Claude модели
            'claude-3-haiku': {
                id: 'claude-3-haiku',
                name: 'Claude 3 Haiku',
                provider: 'anthropic',
                endpoint: 'https://api.anthropic.com/v1/messages',
                model: 'claude-3-haiku-20240307',
                maxTokens: 4096,
                temperature: 0.3,
                requiresApiKey: true,
                icon: '🎭',
                description: 'Быстрая модель Claude для базового анализа',
                features: ['code-analysis', 'recommendations']
            },
            'claude-3-sonnet': {
                id: 'claude-3-sonnet',
                name: 'Claude 3 Sonnet',
                provider: 'anthropic',
                endpoint: 'https://api.anthropic.com/v1/messages',
                model: 'claude-3-sonnet-20240229',
                maxTokens: 4096,
                temperature: 0.3,
                requiresApiKey: true,
                icon: '🎼',
                description: 'Сбалансированная модель для качественного анализа',
                features: ['code-analysis', 'recommendations', 'security-check']
            },
            
            // Локальные модели
            'ollama-codellama': {
                id: 'ollama-codellama',
                name: 'Ollama CodeLlama',
                provider: 'ollama',
                endpoint: 'http://localhost:11434/api/generate',
                model: 'codellama:7b',
                maxTokens: 2048,
                temperature: 0.2,
                requiresApiKey: false,
                icon: '🦙',
                description: 'Локальная модель для анализа кода',
                features: ['code-analysis', 'recommendations']
            },
            'ollama-llama2': {
                id: 'ollama-llama2',
                name: 'Ollama Llama2',
                provider: 'ollama',
                endpoint: 'http://localhost:11434/api/generate',
                model: 'llama2:7b',
                maxTokens: 2048,
                temperature: 0.3,
                requiresApiKey: false,
                icon: '🦙',
                description: 'Универсальная локальная модель',
                features: ['code-analysis', 'recommendations']
            },
            
            // LM Studio
            'lmstudio-local': {
                id: 'lmstudio-local',
                name: 'LM Studio Local',
                provider: 'lmstudio',
                endpoint: 'http://localhost:1234/v1/chat/completions',
                model: 'local-model',
                maxTokens: 4096,
                temperature: 0.3,
                requiresApiKey: false,
                icon: '🏠',
                description: 'Локальная модель через LM Studio',
                features: ['code-analysis', 'recommendations']
            },
            
            // Встроенный анализатор (fallback)
            'builtin-analyzer': {
                id: 'builtin-analyzer',
                name: 'Встроенный анализатор',
                provider: 'builtin',
                endpoint: null,
                model: null,
                maxTokens: null,
                temperature: null,
                requiresApiKey: false,
                icon: '⚙️',
                description: 'Базовый анализ без AI (всегда доступен)',
                features: ['basic-analysis', 'pattern-detection']
            }
        };

        this.defaultModel = 'builtin-analyzer';
        this.currentModel = this.defaultModel;
        this.apiKeys = {};
        this.customEndpoints = {};
    }

    // Получить все доступные модели
    getAllModels() {
        return Object.values(this.models);
    }

    // Получить модель по ID
    getModel(modelId) {
        return this.models[modelId] || null;
    }

    // Получить текущую модель
    getCurrentModel() {
        return this.getModel(this.currentModel);
    }

    // Установить текущую модель
    setCurrentModel(modelId) {
        if (this.models[modelId]) {
            this.currentModel = modelId;
            return true;
        }
        return false;
    }

    // Получить модели по провайдеру
    getModelsByProvider(provider) {
        return Object.values(this.models).filter(model => model.provider === provider);
    }

    // Проверить доступность модели
    async isModelAvailable(modelId) {
        const model = this.getModel(modelId);
        if (!model) return false;

        // Встроенный анализатор всегда доступен
        if (model.provider === 'builtin') return true;

        // Проверяем API ключ если требуется
        if (model.requiresApiKey && !this.getApiKey(model.provider)) {
            return false;
        }

        // Для локальных моделей проверяем доступность endpoint
        if (['ollama', 'lmstudio'].includes(model.provider)) {
            return await this.checkLocalEndpoint(model.endpoint);
        }

        return true;
    }

    // Проверить локальный endpoint
    async checkLocalEndpoint(endpoint) {
        try {
            const response = await fetch(endpoint.replace('/api/generate', '/api/tags').replace('/v1/chat/completions', '/v1/models'), {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Управление API ключами
    setApiKey(provider, apiKey) {
        this.apiKeys[provider] = apiKey;
        this.saveConfig();
    }

    getApiKey(provider) {
        return this.apiKeys[provider] || process.env[`${provider.toUpperCase()}_API_KEY`] || null;
    }

    removeApiKey(provider) {
        delete this.apiKeys[provider];
        this.saveConfig();
    }

    // Управление кастомными endpoints
    setCustomEndpoint(modelId, endpoint) {
        this.customEndpoints[modelId] = endpoint;
        this.saveConfig();
    }

    getEndpoint(modelId) {
        const model = this.getModel(modelId);
        if (!model) return null;
        
        return this.customEndpoints[modelId] || model.endpoint;
    }

    // Сохранение/загрузка конфигурации
    saveConfig() {
        const config = {
            currentModel: this.currentModel,
            apiKeys: this.apiKeys,
            customEndpoints: this.customEndpoints
        };
        
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('copilot-models-config', JSON.stringify(config));
        }
    }

    loadConfig() {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('copilot-models-config');
                if (saved) {
                    const config = JSON.parse(saved);
                    this.currentModel = config.currentModel || this.defaultModel;
                    this.apiKeys = config.apiKeys || {};
                    this.customEndpoints = config.customEndpoints || {};
                }
            }
        } catch (error) {
            console.warn('Не удалось загрузить конфигурацию моделей:', error);
        }
    }

    // Получить промпты для разных типов анализа
    getPrompts() {
        return {
            codeAnalysis: `Ты эксперт по анализу Node-RED потоков. Проанализируй предоставленный поток и найди:
1. Потенциальные проблемы и ошибки
2. Возможности для оптимизации
3. Проблемы безопасности
4. Рекомендации по улучшению

Отвечай на русском языке в формате JSON:
{
  "issues": [{"type": "тип", "severity": "high/warning/info", "title": "заголовок", "message": "описание", "action": "рекомендация"}],
  "patterns": [{"name": "название", "confidence": число, "description": "описание"}],
  "recommendations": ["рекомендация1", "рекомендация2"]
}`,

            securityCheck: `Проведи анализ безопасности Node-RED потока. Найди:
1. Уязвимости безопасности
2. Небезопасные практики
3. Проблемы с аутентификацией
4. Утечки данных

Отвечай на русском языке в формате JSON с детальным описанием найденных проблем.`,

            performanceAnalysis: `Проанализируй производительность Node-RED потока:
1. Узкие места
2. Неэффективные операции
3. Проблемы с памятью
4. Рекомендации по оптимизации

Отвечай на русском языке с конкретными рекомендациями.`
        };
    }

    // Валидация конфигурации модели
    validateModelConfig(config) {
        const required = ['id', 'name', 'provider'];
        return required.every(field => config[field]);
    }

    // Добавить кастомную модель
    addCustomModel(config) {
        if (!this.validateModelConfig(config)) {
            throw new Error('Неверная конфигурация модели');
        }

        this.models[config.id] = {
            ...config,
            icon: config.icon || '🔧',
            features: config.features || ['code-analysis']
        };

        this.saveConfig();
        return true;
    }

    // Удалить кастомную модель
    removeCustomModel(modelId) {
        if (this.models[modelId] && !this.isBuiltinModel(modelId)) {
            delete this.models[modelId];
            
            // Если удаляемая модель была текущей, переключаемся на default
            if (this.currentModel === modelId) {
                this.currentModel = this.defaultModel;
            }
            
            this.saveConfig();
            return true;
        }
        return false;
    }

    // Проверить, является ли модель встроенной
    isBuiltinModel(modelId) {
        const builtinModels = [
            'openai-gpt-3.5', 'openai-gpt-4',
            'claude-3-haiku', 'claude-3-sonnet',
            'ollama-codellama', 'ollama-llama2',
            'lmstudio-local', 'builtin-analyzer'
        ];
        return builtinModels.includes(modelId);
    }

    // Получить статистику использования
    getUsageStats() {
        // Здесь можно добавить логику для отслеживания использования моделей
        return {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0
        };
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelsConfig;
} else {
    window.ModelsConfig = ModelsConfig;
}
