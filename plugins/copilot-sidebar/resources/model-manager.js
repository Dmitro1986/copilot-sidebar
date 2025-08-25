// model-manager.js - Менеджер AI моделей для Copilot

class ModelManager {
    constructor(modelsConfig) {
        this.config = modelsConfig;
        this.requestTimeout = 30000; // 30 секунд
        this.retryAttempts = 2;
        this.requestHistory = [];
        this.maxHistorySize = 100;
    }

    // Основной метод для анализа с использованием AI
    async analyzeWithAI(flowData, analysisType = 'codeAnalysis') {
        const currentModel = this.config.getCurrentModel();
        
        if (!currentModel) {
            throw new Error('Модель не выбрана');
        }

        // Если это встроенный анализатор, используем локальную логику
        if (currentModel.provider === 'builtin') {
            return this.performBuiltinAnalysis(flowData, analysisType);
        }

        // Проверяем доступность модели
        const isAvailable = await this.config.isModelAvailable(currentModel.id);
        if (!isAvailable) {
            console.warn(`Модель ${currentModel.name} недоступна, используем встроенный анализатор`);
            return this.performBuiltinAnalysis(flowData, analysisType);
        }

        try {
            const startTime = Date.now();
            const result = await this.callAIModel(currentModel, flowData, analysisType);
            const responseTime = Date.now() - startTime;
            
            // Сохраняем в историю
            this.addToHistory({
                timestamp: new Date().toISOString(),
                modelId: currentModel.id,
                analysisType,
                success: true,
                responseTime,
                tokensUsed: result.tokensUsed || 0
            });

            return result;
        } catch (error) {
            console.error(`Ошибка анализа с моделью ${currentModel.name}:`, error);
            
            // Сохраняем ошибку в историю
            this.addToHistory({
                timestamp: new Date().toISOString(),
                modelId: currentModel.id,
                analysisType,
                success: false,
                error: error.message
            });

            // Fallback на встроенный анализатор
            console.log('Переключаемся на встроенный анализатор...');
            return this.performBuiltinAnalysis(flowData, analysisType);
        }
    }

    // Вызов AI модели
    async callAIModel(model, flowData, analysisType) {
        const prompt = this.buildPrompt(flowData, analysisType);
        
        switch (model.provider) {
            case 'openai':
                return await this.callOpenAI(model, prompt);
            case 'anthropic':
                return await this.callClaude(model, prompt);
            case 'ollama':
                return await this.callOllama(model, prompt);
            case 'lmstudio':
                return await this.callLMStudio(model, prompt);
            default:
                throw new Error(`Неподдерживаемый провайдер: ${model.provider}`);
        }
    }

    // OpenAI API
    async callOpenAI(model, prompt) {
        const apiKey = this.config.getApiKey('openai');
        if (!apiKey) {
            throw new Error('OpenAI API ключ не настроен');
        }

        const endpoint = this.config.getEndpoint(model.id);
        const response = await this.makeRequest(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model.model,
                messages: [
                    {
                        role: 'system',
                        content: 'Ты эксперт по анализу Node-RED потоков. Отвечай только в формате JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: model.maxTokens,
                temperature: model.temperature
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`OpenAI API ошибка: ${data.error.message}`);
        }

        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage?.total_tokens || 0,
            model: model.model
        };
    }

    // Claude API
    async callClaude(model, prompt) {
        const apiKey = this.config.getApiKey('anthropic');
        if (!apiKey) {
            throw new Error('Anthropic API ключ не настроен');
        }

        const endpoint = this.config.getEndpoint(model.id);
        const response = await this.makeRequest(endpoint, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model.model,
                max_tokens: model.maxTokens,
                temperature: model.temperature,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Claude API ошибка: ${data.error.message}`);
        }

        return {
            content: data.content[0].text,
            tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
            model: model.model
        };
    }

    // Ollama API
    async callOllama(model, prompt) {
        const endpoint = this.config.getEndpoint(model.id);
        const response = await this.makeRequest(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: model.temperature,
                    num_predict: model.maxTokens
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Ollama ошибка: ${data.error}`);
        }

        return {
            content: data.response,
            tokensUsed: 0, // Ollama не возвращает информацию о токенах
            model: model.model
        };
    }

    // LM Studio API
    async callLMStudio(model, prompt) {
        const endpoint = this.config.getEndpoint(model.id);
        const response = await this.makeRequest(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: model.maxTokens,
                temperature: model.temperature
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`LM Studio ошибка: ${data.error.message}`);
        }

        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage?.total_tokens || 0,
            model: model.model
        };
    }

    // Универсальный метод для HTTP запросов
    async makeRequest(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Превышено время ожидания запроса');
            }
            
            throw error;
        }
    }

    // Построение промпта для анализа
    buildPrompt(flowData, analysisType) {
        const prompts = this.config.getPrompts();
        const basePrompt = prompts[analysisType] || prompts.codeAnalysis;
        
        // Подготавливаем данные потока для анализа
        const flowInfo = this.prepareFlowData(flowData);
        
        return `${basePrompt}

Данные потока для анализа:
${JSON.stringify(flowInfo, null, 2)}`;
    }

    // Подготовка данных потока для отправки в AI
    prepareFlowData(flowData) {
        // Убираем чувствительные данные и оставляем только структуру
        const sanitized = {
            id: flowData.id,
            label: flowData.label,
            type: flowData.type,
            nodeCount: flowData.nodes ? flowData.nodes.length : 0,
            nodes: []
        };

        if (flowData.nodes) {
            sanitized.nodes = flowData.nodes.map(node => ({
                id: node.id,
                type: node.type,
                name: node.name || '',
                // Убираем пароли, токены и другие чувствительные данные
                config: this.sanitizeNodeConfig(node),
                wires: node.wires || []
            }));
        }

        return sanitized;
    }

    // Очистка конфигурации узла от чувствительных данных
    sanitizeNodeConfig(node) {
        const sensitiveFields = [
            'password', 'token', 'apikey', 'secret', 'key',
            'credentials', 'auth', 'cert', 'private'
        ];

        const config = { ...node };
        
        // Удаляем системные поля
        delete config.id;
        delete config.type;
        delete config.wires;
        delete config.x;
        delete config.y;
        delete config.z;

        // Маскируем чувствительные поля
        Object.keys(config).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                config[key] = '[СКРЫТО]';
            }
        });

        return config;
    }

    // Встроенный анализ (fallback)
    performBuiltinAnalysis(flowData, analysisType) {
        // Базовый анализ без AI
        const analysis = {
            issues: [],
            patterns: [],
            recommendations: [],
            source: 'builtin-analyzer'
        };

        if (!flowData.nodes) {
            return analysis;
        }

        // Простые проверки
        const nodeTypes = flowData.nodes.map(n => n.type);
        const nodeCount = flowData.nodes.length;

        // Проверка на отключенные узлы
        const disconnectedNodes = this.findDisconnectedNodes(flowData);
        if (disconnectedNodes.length > 0) {
            analysis.issues.push({
                type: 'disconnected',
                severity: 'warning',
                title: 'Отключенные узлы',
                message: `Найдено ${disconnectedNodes.length} отключенных узлов`,
                action: 'Подключите или удалите неиспользуемые узлы'
            });
        }

        // Проверка сложности
        if (nodeCount > 20) {
            analysis.issues.push({
                type: 'complexity',
                severity: 'info',
                title: 'Высокая сложность',
                message: `Поток содержит ${nodeCount} узлов`,
                action: 'Рассмотрите разбиение на подпотоки'
            });
        }

        // Определение паттернов
        if (nodeTypes.includes('http in') && nodeTypes.includes('http response')) {
            analysis.patterns.push({
                name: 'HTTP API',
                confidence: 90,
                description: 'REST API endpoint'
            });
        }

        if (nodeTypes.includes('mqtt in')) {
            analysis.patterns.push({
                name: 'IoT Sensor',
                confidence: 85,
                description: 'Обработка данных сенсоров'
            });
        }

        // Базовые рекомендации
        analysis.recommendations = [
            'Добавьте обработку ошибок с помощью catch узлов',
            'Используйте комментарии для документирования логики',
            'Группируйте связанные узлы для лучшей читаемости'
        ];

        return {
            content: JSON.stringify(analysis),
            tokensUsed: 0,
            model: 'builtin-analyzer'
        };
    }

    // Поиск отключенных узлов
    findDisconnectedNodes(flowData) {
        return flowData.nodes.filter(node => {
            if (['comment', 'tab', 'group'].includes(node.type)) return false;

            const hasOutput = node.wires && node.wires.length > 0 && 
                             node.wires.some(wire => wire.length > 0);
            const hasInput = flowData.nodes.some(other => 
                other.wires && other.wires.some(wire => wire.includes(node.id))
            );

            if (node.type === 'inject') return !hasOutput;
            if (['debug', 'http response'].includes(node.type)) return !hasInput;

            return !hasOutput && !hasInput;
        });
    }

    // Парсинг ответа AI
    parseAIResponse(content) {
        try {
            // Пытаемся извлечь JSON из ответа
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Если JSON не найден, возвращаем базовую структуру
            return {
                issues: [],
                patterns: [],
                recommendations: [content.substring(0, 200) + '...']
            };
        } catch (error) {
            console.warn('Не удалось распарсить ответ AI:', error);
            return {
                issues: [],
                patterns: [],
                recommendations: ['Получен некорректный ответ от AI модели']
            };
        }
    }

    // Управление историей запросов
    addToHistory(entry) {
        this.requestHistory.unshift(entry);
        if (this.requestHistory.length > this.maxHistorySize) {
            this.requestHistory = this.requestHistory.slice(0, this.maxHistorySize);
        }
    }

    getHistory() {
        return this.requestHistory;
    }

    // Статистика использования
    getUsageStats() {
        const total = this.requestHistory.length;
        const successful = this.requestHistory.filter(r => r.success).length;
        const failed = total - successful;
        
        const avgResponseTime = this.requestHistory
            .filter(r => r.responseTime)
            .reduce((sum, r) => sum + r.responseTime, 0) / 
            Math.max(1, this.requestHistory.filter(r => r.responseTime).length);

        const totalTokens = this.requestHistory
            .reduce((sum, r) => sum + (r.tokensUsed || 0), 0);

        return {
            totalRequests: total,
            successfulRequests: successful,
            failedRequests: failed,
            averageResponseTime: Math.round(avgResponseTime),
            totalTokensUsed: totalTokens
        };
    }

    // Тестирование подключения к модели
    async testModelConnection(modelId) {
        const model = this.config.getModel(modelId);
        if (!model) {
            return { success: false, error: 'Модель не найдена' };
        }

        if (model.provider === 'builtin') {
            return { success: true, message: 'Встроенный анализатор всегда доступен' };
        }

        try {
            const testPrompt = 'Тест подключения. Ответь "OK"';
            const result = await this.callAIModel(model, { nodes: [] }, 'codeAnalysis');
            
            return { 
                success: true, 
                message: 'Подключение успешно',
                responseTime: result.responseTime,
                model: result.model
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Очистка истории
    clearHistory() {
        this.requestHistory = [];
    }

    // Экспорт статистики
    exportStats() {
        return {
            config: {
                currentModel: this.config.currentModel,
                availableModels: this.config.getAllModels().length
            },
            usage: this.getUsageStats(),
            history: this.requestHistory
        };
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelManager;
} else {
    window.ModelManager = ModelManager;
}
