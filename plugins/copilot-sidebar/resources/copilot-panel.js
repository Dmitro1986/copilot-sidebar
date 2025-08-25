// Оптимизированная версия CopilotPanel
class CopilotPanel {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = $('#' + containerId);
        this.currentAnalysis = null;
        this.config = this.initializeConfig();
        this.cache = new Map();
        this.eventListeners = [];
        
        // Debounced методы
        this.debouncedAnalysis = this.debounce(this.performAnalysis.bind(this), 2000);
        this.debouncedRefresh = this.debounce(this.updateDisplay.bind(this), 100);
        
        // Инициализация AI компонентов
        this.initializeAIComponents();
        
        // Состояние
        this.state = {
            activeTab: 'overview',
            isAnalyzing: false,
            lastUpdateTime: null
        };
    }

    // 🔧 Конфигурация по умолчанию
    initializeConfig() {
        return {
            autoRefresh: true,
            refreshInterval: 30000,
            useAI: false,
            maxRetries: 3,
            analysisTimeout: 10000
        };
    }

    // 🤖 Инициализация AI компонентов с проверками
    initializeAIComponents() {
        try {
            this.modelsConfig = this.safeCreateComponent('ModelsConfig');
            this.modelManager = this.safeCreateComponent('ModelManager', this.modelsConfig);
            
            if (this.modelsConfig) {
                this.modelsConfig.loadConfig();
                console.log('✅ AI компоненты инициализированы');
            }
        } catch (error) {
            console.warn('⚠️ AI функции недоступны:', error.message);
            this.modelsConfig = null;
            this.modelManager = null;
        }
    }

    // 🛡️ Безопасное создание компонентов
    safeCreateComponent(className, ...args) {
        if (typeof window[className] === 'undefined') {
            console.warn(`⚠️ Класс ${className} недоступен`);
            return null;
        }
        return new window[className](...args);
    }

    // 🚀 Основная инициализация
    async initialize() {
        try {
            console.log('🚀 Инициализация CopilotPanel...');
            
            await this.createPanelStructure();
            this.bindEvents();
            this.startAutoRefresh();
            await this.performInitialAnalysis();
            
            console.log('✅ CopilotPanel инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка инициализации панели');
        }
    }

    // 🎨 Создание структуры с template literals
    async createPanelStructure() {
        const template = `
            <div class="copilot-panel">
                ${this.renderHeader()}
                ${this.renderStatus()}
                ${this.renderSummary()}
                ${this.renderTabs()}
                ${this.renderContent()}
            </div>
        `;
        
        this.container.html(template);
    }

    // 📋 Template методы
    renderHeader() {
        return `
            <div class="copilot-header">
                <div class="copilot-title">
                    <span class="copilot-icon">🤖</span>
                    <span>Node-RED Copilot!!!</span>
                </div>
                <div class="copilot-controls">
                    <button id="copilot-refresh" class="copilot-btn" title="Обновить">
                        <i class="fa fa-refresh"></i>
                    </button>
                    <button id="copilot-settings" class="copilot-btn" title="Настройки">
                        <i class="fa fa-cog"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderStatus() {
        return `
            <div class="copilot-status" id="copilot-status">
                <div class="status-indicator" id="status-indicator">
                    <div class="status-dot"></div>
                    <span id="status-text">Готов к анализу</span>
                </div>
                <div class="last-update" id="last-update"></div>
            </div>
        `;
    }

    renderSummary() {
        return `
            <div class="copilot-summary" id="copilot-summary" style="display: none;">
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value" id="total-flows">0</span>
                        <span class="stat-label">Потоков</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="total-nodes">0</span>
                        <span class="stat-label">Узлов</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="total-issues">0</span>
                        <span class="stat-label">Проблем</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderTabs() {
        const tabs = [
            { id: 'overview', label: 'Обзор', icon: '📊' },
            { id: 'flows', label: 'Потоки', icon: '📄' },
            { id: 'issues', label: 'Проблемы', icon: '⚠️' },
            { id: 'patterns', label: 'Паттерны', icon: '🎯' }
        ];

        return `
            <div class="copilot-tabs">
                ${tabs.map(tab => `
                    <button class="tab-btn ${tab.id === 'overview' ? 'active' : ''}" 
                            data-tab="${tab.id}">
                        ${tab.icon} ${tab.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderContent() {
        return `
            <div class="copilot-content">
                <div class="tab-content active" data-tab="overview">
                    <div id="overview-content">${this.renderLoader()}</div>
                </div>
                <div class="tab-content" data-tab="flows">
                    <div id="flows-content"></div>
                </div>
                <div class="tab-content" data-tab="issues">
                    <div id="issues-content"></div>
                </div>
                <div class="tab-content" data-tab="patterns">
                    <div id="patterns-content"></div>
                </div>
            </div>
        `;
    }

    renderLoader() {
        return `
            <div class="loading">
                <div class="spinner"></div>
                <p>Анализирую потоки...</p>
            </div>
        `;
    }

    // 🎯 Оптимизированная привязка событий
    bindEvents() {
        this.unbindEvents(); // Очищаем старые события
        
        // Локальные события
        const events = [
            { selector: '#copilot-refresh', event: 'click', handler: () => this.performAnalysis() },
            { selector: '#copilot-settings', event: 'click', handler: () => this.showSettings() },
            { selector: '.tab-btn', event: 'click', handler: (e) => this.switchTab($(e.target).data('tab')) }
        ];

        events.forEach(({ selector, event, handler }) => {
            const elements = $(selector);
            elements.on(event, handler);
            this.eventListeners.push({ elements, event, handler });
        });

        // События Node-RED
        this.bindNodeREDEvents();
    }

    bindNodeREDEvents() {
        // Используем namespace для легкой очистки
        const namespace = '.copilot-panel';
        
        RED.events.off(namespace); // Очищаем старые события
        
        RED.events.on(`flows:change${namespace}`, () => {
            if (this.config.autoRefresh && !this.state.isAnalyzing) {
                this.debouncedAnalysis();
            }
        });

        RED.events.on(`runtime-event${namespace}`, (event) => {
            if (event.id === "flows-deployed") {
                setTimeout(() => this.performAnalysis(), 1000);
            }
        });
    }

    unbindEvents() {
        // Очищаем локальные события
        this.eventListeners.forEach(({ elements, event, handler }) => {
            elements.off(event, handler);
        });
        this.eventListeners = [];
        
        // Очищаем события Node-RED
        RED.events.off('.copilot-panel');
    }

    // 📊 Оптимизированный анализ
    async performAnalysis() {
        if (this.state.isAnalyzing) {
            console.log('⏳ Анализ уже выполняется');
            return;
        }

        this.state.isAnalyzing = true;
        this.updateStatus('analyzing', this.config.useAI ? 'AI анализ...' : 'Анализирую...');

        try {
            const flows = this.getFlows();
            if (!flows) {
                throw new Error('Не удалось получить потоки');
            }

            const cacheKey = this.generateCacheKey(flows);
            let analysis = this.cache.get(cacheKey);

            if (!analysis || this.isCacheExpired(cacheKey)) {
                console.log('🔄 Выполняем новый анализ');
                analysis = await this.analyzeFlows(flows);
                this.cache.set(cacheKey, { data: analysis, timestamp: Date.now() });
            } else {
                console.log('📦 Используем кешированный анализ');
            }

            await this.processAnalysisResults(analysis);

        } catch (error) {
            console.error('❌ Ошибка анализа:', error);
            this.updateStatus('error', 'Ошибка анализа');
            this.showError(error.message);
        } finally {
            this.state.isAnalyzing = false;
        }
    }

    async performInitialAnalysis() {
        await this.performAnalysis();
    }

    // 🔍 Получение потоков с проверками
    getFlows() {
        try {
            return RED?.nodes?.getFlows?.();
        } catch (error) {
            console.error('❌ Ошибка получения потоков:', error);
            return null;
        }
    }

    // 🔑 Кеширование
    generateCacheKey(flows) {
        const flowsString = JSON.stringify(flows);
        return this.hashCode(flowsString).toString();
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32-bit integer
        }
        return hash;
    }

    isCacheExpired(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (!cached) return true;
        
        const maxAge = this.config.refreshInterval * 2; // Кеш живет в 2 раза дольше
        return (Date.now() - cached.timestamp) > maxAge;
    }

    // 🧠 Основной анализ
    async analyzeFlows(flows) {
        const startTime = Date.now();
        
        const analysis = {
            timestamp: new Date().toISOString(),
            totalFlows: 0,
            totalNodes: 0,
            flowAnalyses: [],
            globalIssues: [],
            summary: {},
            aiEnhanced: this.config.useAI
        };

        if (!flows?.flows) return analysis;

        // Параллельный анализ потоков
        const flowTabs = flows.flows.filter(flow => flow.type === 'tab');
        analysis.totalFlows = flowTabs.length;

        const flowAnalysisPromises = flowTabs.map(async (flowTab) => {
            const flowNodes = flows.flows.filter(node => node.z === flowTab.id && node.type !== 'tab');
            if (flowNodes.length === 0) return null;
            
            return this.analyzeFlow(flowTab, flowNodes);
        });

        const flowResults = await Promise.all(flowAnalysisPromises);
        analysis.flowAnalyses = flowResults.filter(result => result !== null);
        analysis.totalNodes = analysis.flowAnalyses.reduce((sum, flow) => sum + flow.nodeCount, 0);

        // Глобальный анализ
        analysis.globalIssues = this.findGlobalIssues(flows);
        analysis.summary = this.generateSummary(analysis);

        const duration = Date.now() - startTime;
        console.log(`✅ Анализ завершен за ${duration}мс`);
        
        return analysis;
    }

    // 📊 Анализ отдельного потока
    analyzeFlow(flowTab, flowNodes) {
        return {
            id: flowTab.id,
            label: flowTab.label || `Поток ${flowTab.id}`,
            type: 'tab',
            nodeCount: flowNodes.length,
            issues: this.findFlowIssues(flowNodes),
            patterns: this.detectFlowPatterns(flowNodes),
            complexity: this.calculateComplexity(flowNodes),
            metrics: this.calculateMetrics(flowNodes)
        };
    }

    // 📏 Метрики потока
    calculateMetrics(nodes) {
        return {
            connections: this.countConnections(nodes),
            depth: this.calculateDepth(nodes),
            branches: this.countBranches(nodes),
            cycles: this.detectCycles(nodes)
        };
    }

    // 🔄 Обнаружение циклов
    detectCycles(nodes) {
        const visited = new Set();
        const recursionStack = new Set();
        let cycleCount = 0;

        const dfs = (nodeId) => {
            if (recursionStack.has(nodeId)) {
                cycleCount++;
                return true;
            }
            if (visited.has(nodeId)) return false;

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const node = nodes.find(n => n.id === nodeId);
            if (node?.wires) {
                for (const wireArray of node.wires) {
                    for (const targetId of wireArray) {
                        if (dfs(targetId)) return true;
                    }
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        nodes.forEach(node => {
            if (!visited.has(node.id)) {
                dfs(node.id);
            }
        });

        return cycleCount;
    }

    // 🎯 Оптимизированное обнаружение паттернов
    detectFlowPatterns(nodes) {
        const patterns = [];
        const nodeTypes = new Set(nodes.map(n => n.type));
        
        // Используем Map для быстрой проверки
        const patternChecks = [
            {
                check: () => nodeTypes.has('http in') && nodeTypes.has('http response'),
                pattern: {
                    name: 'HTTP API',
                    confidence: 90,
                    icon: '🌐',
                    description: 'REST API endpoints',
                    recommendations: ['Добавьте rate limiting', 'Используйте валидацию']
                }
            },
            {
                check: () => nodeTypes.has('mqtt in') && (nodeTypes.has('function') || nodeTypes.has('switch')),
                pattern: {
                    name: 'IoT Sensor',
                    confidence: 85,
                    icon: '📡',
                    description: 'Обработка данных сенсоров',
                    recommendations: ['Фильтруйте аномалии', 'Проверяйте качество сигнала']
                }
            },
            {
                check: () => Array.from(nodeTypes).some(type => type.startsWith('ui_')),
                pattern: {
                    name: 'Dashboard',
                    confidence: 95,
                    icon: '📊',
                    description: 'Панель мониторинга',
                    recommendations: ['Ограничьте частоту обновлений', 'Группируйте элементы']
                }
            }
        ];

        patternChecks.forEach(({ check, pattern }) => {
            if (check()) {
                patterns.push(pattern);
            }
        });

        return patterns;
    }

    // ⚡ Оптимизированный поиск проблем
    findFlowIssues(nodes) {
        const issues = [];
        const nodeMap = new Map(nodes.map(node => [node.id, node]));

        // Параллельная проверка различных типов проблем
        const checks = [
            () => this.checkDisconnectedNodes(nodes, nodeMap),
            () => this.checkErrorHandling(nodes),
            () => this.checkPerformanceIssues(nodes)
        ];

        checks.forEach(check => {
            try {
                const foundIssues = check();
                if (foundIssues.length > 0) {
                    issues.push(...foundIssues);
                }
            } catch (error) {
                console.warn('⚠️ Ошибка проверки:', error);
            }
        });

        return issues;
    }

    // 🔧 Оптимизированная проверка отключенных узлов
    checkDisconnectedNodes(nodes, nodeMap) {
        const excludeTypes = new Set(['comment', 'tab', 'group']);
        const hasInput = new Set();
        const hasOutput = new Set();

        // Один проход для определения входов и выходов
        nodes.forEach(node => {
            if (excludeTypes.has(node.type)) return;

            if (node.wires?.some(wire => wire.length > 0)) {
                hasOutput.add(node.id);
                node.wires.forEach(wire => {
                    wire.forEach(targetId => hasInput.add(targetId));
                });
            }
        });

        const disconnected = nodes.filter(node => {
            if (excludeTypes.has(node.type)) return false;
            if (node.type === 'inject') return !hasOutput.has(node.id);
            if (['debug', 'http response'].includes(node.type)) return !hasInput.has(node.id);
            return !hasInput.has(node.id) && !hasOutput.has(node.id);
        });

        return disconnected.length > 0 ? [{
            type: 'disconnected',
            severity: 'warning',
            title: 'Отключенные узлы',
            message: `${disconnected.length} узлов не подключены`,
            nodeIds: disconnected.map(n => n.id),
            action: 'Подключите или удалите неиспользуемые узлы'
        }] : [];
    }

    // 📈 Обработка результатов анализа
    async processAnalysisResults(analysis) {
        this.currentAnalysis = analysis;
        this.state.lastUpdateTime = Date.now();
        
        await this.updateDisplay();
        this.updateStatus('completed', analysis.aiEnhanced ? 'AI анализ завершен' : 'Анализ завершен');
        this.updateLastUpdateTime();
    }

    // 🎨 Обновление отображения
    async updateDisplay() {
        if (!this.currentAnalysis) return;

        await Promise.all([
            this.updateSummary(),
            this.updateActiveTab()
        ]);

        $('#copilot-summary').show();
    }

    // 📊 Обновление сводки
    updateSummary() {
        const analysis = this.currentAnalysis;
        
        $('#total-flows').text(analysis.totalFlows);
        $('#total-nodes').text(analysis.totalNodes);
        
        const totalIssues = analysis.globalIssues.length + 
                           analysis.flowAnalyses.reduce((sum, flow) => sum + flow.issues.length, 0);
        $('#total-issues').text(totalIssues);
    }

    // 🔄 Переключение вкладок
    switchTab(tabName) {
        if (this.state.activeTab === tabName) return;
        
        this.state.activeTab = tabName;
        
        // Обновляем UI
        $('.tab-btn').removeClass('active');
        $(`.tab-btn[data-tab="${tabName}"]`).addClass('active');
        
        $('.tab-content').removeClass('active');
        $(`.tab-content[data-tab="${tabName}"]`).addClass('active');
        
        // Обновляем содержимое
        this.updateActiveTab();
    }

    // 🎯 Обновление активной вкладки
    async updateActiveTab() {
        if (!this.currentAnalysis) return;

        const updaters = {
            overview: () => this.updateOverview(),
            flows: () => this.renderFlowsList(),
            issues: () => this.renderIssuesList(),
            patterns: () => this.renderPatternsList()
        };

        const updater = updaters[this.state.activeTab];
        if (updater) {
            await updater();
        }
    }

    // 🛡️ Обработка ошибок
    showError(message) {
        const errorHtml = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <div class="error-text">${message}</div>
                <button class="retry-btn" onclick="this.closest('.error-message').remove(); copilotPanel.performAnalysis()">
                    Повторить
                </button>
            </div>
        `;
        $('#overview-content').html(errorHtml);
    }

    // ⏱️ Debounce utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 🧹 Очистка ресурсов
    destroy() {
        console.log('🧹 Уничтожаем CopilotPanel...');
        
        this.unbindEvents();
        this.stopAutoRefresh();
        this.cache.clear();
        
        if (this.container) {
            this.container.empty();
        }
        
        console.log('✅ CopilotPanel уничтожен');
    }

    // 🔄 Автообновление
    startAutoRefresh() {
        this.stopAutoRefresh();
        if (this.config.autoRefresh) {
            this.refreshTimer = setInterval(() => {
                if (!this.state.isAnalyzing) {
                    this.performAnalysis();
                }
            }, this.config.refreshInterval);
        }
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // 🔧 Обновление статуса
    updateStatus(status, text) {
        const indicator = $('#status-indicator');
        const statusText = $('#status-text');
        
        indicator.removeClass('status-good status-warning status-error status-analyzing');
        
        switch (status) {
            case 'analyzing':
                indicator.addClass('status-analyzing');
                break;
            case 'completed':
                const issueCount = this.currentAnalysis ? 
                    this.currentAnalysis.globalIssues.length + 
                    this.currentAnalysis.flowAnalyses.reduce((sum, flow) => sum + flow.issues.length, 0) : 0;
                
                if (issueCount === 0) {
                    indicator.addClass('status-good');
                } else if (issueCount < 5) {
                    indicator.addClass('status-warning');
                } else {
                    indicator.addClass('status-error');
                }
                break;
            case 'error':
                indicator.addClass('status-error');
                break;
        }
        
        statusText.text(text);
    }

    // 📊 Обновление обзора
    updateOverview() {
        if (!this.currentAnalysis) return;

        const overviewContent = $('#overview-content');
        const summary = this.currentAnalysis.summary;
        
        const statusClass = summary.status === 'excellent' ? 'excellent' :
                           summary.status === 'good' ? 'good' : 'warning';
        
        const html = `
            <div class="overview-section">
                <h3>📊 Общий статус</h3>
                <div class="status-card ${statusClass}">
                    <div class="status-icon">${this.getStatusIcon(summary.status)}</div>
                    <div class="status-info">
                        <div class="status-title">${this.getStatusTitle(summary.status)}</div>
                        <div class="status-details">
                            ${summary.totalIssues} проблем, ${summary.patternsDetected} паттернов
                        </div>
                    </div>
                </div>
            </div>
        `;

        overviewContent.html(html);
    }

    // 📋 Рендеринг списков
    renderFlowsList() {
        // Базовая реализация
        $('#flows-content').html('<p>Список потоков</p>');
    }

    renderIssuesList() {
        // Базовая реализация
        $('#issues-content').html('<p>Список проблем</p>');
    }

    renderPatternsList() {
        // Базовая реализация
        $('#patterns-content').html('<p>Список паттернов</p>');
    }

    // 🎯 Вспомогательные методы
    getStatusIcon(status) {
        switch (status) {
            case 'excellent': return '🌟';
            case 'good': return '✅';
            case 'needs-attention': return '⚠️';
            default: return '❓';
        }
    }

    getStatusTitle(status) {
        switch (status) {
            case 'excellent': return 'Отлично!';
            case 'good': return 'Хорошо';
            case 'needs-attention': return 'Требует внимания';
            default: return 'Неизвестно';
        }
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        $('#last-update').text(`Обновлено: ${timeString}`);
    }

    // 🔧 Настройки
    showSettings() {
        console.log('🔧 Открываем настройки...');
        
        if (!this.modelsConfig) {
            console.warn('⚠️ ModelsConfig недоступен, показываем упрощенные настройки');
            this.showSimpleSettings();
            return;
        }

        try {
            const models = this.modelsConfig.getAllModels();
            const currentModel = this.modelsConfig.getCurrentModel();
            
            this.displaySettingsDialog({ models, currentModel });
        } catch (error) {
            console.error('❌ Ошибка загрузки настроек:', error);
            this.showSimpleSettings();
        }
    }

    displaySettingsDialog(modelsData) {
        const dialog = $(`
            <div class="copilot-settings-dialog">
                <h3>🤖 Настройки Copilot</h3>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="use-ai-analysis" ${this.config.useAI ? 'checked' : ''}>
                        Использовать AI анализ
                    </label>
                </div>
                
                <div class="models-selection" id="models-selection">
                    <h4>Выберите модель:</h4>
                    ${modelsData.models.map(model => `
                        <div class="model-option">
                            <label>
                                <input type="radio" name="selected-model" value="${model.id}" 
                                       ${modelsData.currentModel && modelsData.currentModel.id === model.id ? 'checked' : ''}>
                                ${model.icon} ${model.name}
                            </label>
                        </div>
                    `).join('')}
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="auto-refresh-setting" ${this.config.autoRefresh ? 'checked' : ''}>
                        Автоматическое обновление
                    </label>
                </div>
            </div>
        `);

        dialog.dialog({
            title: "Настройки Copilot",
            width: 500,
            height: 400,
            modal: true,
            resizable: true,
            buttons: {
                "Сохранить": () => {
                    this.saveSettings(dialog);
                },
                "Отмена": () => {
                    dialog.dialog("close");
                }
            }
        });
    }

    saveSettings(dialog) {
        try {
            console.log('💾 Сохраняем настройки...');
            
            // Сохраняем настройки
            this.config.useAI = dialog.find('#use-ai-analysis').is(':checked');
            this.config.autoRefresh = dialog.find('#auto-refresh-setting').is(':checked');
            
            // Сохраняем выбранную модель
            const selectedModelId = dialog.find('input[name="selected-model"]:checked').val();
            if (selectedModelId && this.modelsConfig) {
                this.modelsConfig.setCurrentModel(selectedModelId);
                this.modelsConfig.saveConfig();
                console.log('✅ Модель сохранена:', selectedModelId);
            }
            
            dialog.dialog("close");
            console.log('✅ Настройки сохранены');
            
            // Обновляем анализ
            this.performAnalysis();
            
        } catch (error) {
            console.error('❌ Ошибка сохранения настроек:', error);
        }
    }

    showSimpleSettings() {
        const dialog = $(`
            <div class="copilot-settings-dialog">
                <h3>⚙️ Настройки Copilot</h3>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="auto-refresh-setting" ${this.config.autoRefresh ? 'checked' : ''}>
                        Автоматическое обновление
                    </label>
                </div>
                
                <div class="setting-item">
                    <p><strong>Информация:</strong></p>
                    <p>AI модели недоступны. Используется базовый анализ.</p>
                </div>
            </div>
        `);

        dialog.dialog({
            title: "Настройки Copilot",
            width: 400,
            height: 250,
            modal: true,
            buttons: {
                "Сохранить": () => {
                    this.config.autoRefresh = dialog.find('#auto-refresh-setting').is(':checked');
                    dialog.dialog("close");
                    console.log('✅ Упрощенные настройки сохранены');
                },
                "Отмена": () => {
                    dialog.dialog("close");
                }
            }
        });
    }

    // 🔧 Дополнительные методы для анализа
    calculateComplexity(nodes) {
        return {
            level: 'simple',
            score: nodes.length,
            nodeCount: nodes.length,
            connections: 0,
            depth: 1,
            branches: 0
        };
    }

    countConnections(nodes) {
        return 0;
    }

    calculateDepth(nodes) {
        return 1;
    }

    countBranches(nodes) {
        return 0;
    }

    checkErrorHandling(nodes) {
        return [];
    }

    checkPerformanceIssues(nodes) {
        return [];
    }

    findGlobalIssues(flows) {
        return [];
    }

    generateSummary(analysis) {
        return {
            status: 'good',
            totalIssues: 0,
            highSeverityIssues: 0,
            patternsDetected: 0,
            averageComplexity: 0,
            recommendations: []
        };
    }
}

// // resources/copilot-panel.js

// class CopilotPanel {
//     constructor(containerId) {
//         this.containerId = containerId;
//         this.container = $('#' + containerId);
//         this.currentAnalysis = null;
//         this.autoRefresh = true;
//         this.refreshInterval = 30000; // 30 секунд
//         this.refreshTimer = null;
        
//         // Инициализируем AI компоненты
//         this.modelsConfig = new ModelsConfig();
//         this.modelsConfig.loadConfig();
//         this.modelManager = new ModelManager(this.modelsConfig);
//         this.useAI = false; // По умолчанию используем базовый анализ
        
//         console.log('🤖 CopilotPanel: AI компоненты инициализированы');
//         console.log('🤖 Текущая модель при инициализации:', this.modelsConfig.getCurrentModel());
//         console.log('🤖 Все доступные модели:', this.modelsConfig.getAllModels().map(m => m.id));
//     }

//     initialize() {
//         console.log('🚀 Initializing Copilot Panel...');
//         this.createPanelStructure();
//         this.bindEvents();
//         this.startAutoRefresh();
//         this.performAnalysis();
//     }

//     createPanelStructure() {
//         const html = `
//             <div class="copilot-panel">
//                 <!-- Заголовок -->
//                 <div class="copilot-header">
//                     <div class="copilot-title">
//                         <span class="copilot-icon">🤖</span>
//                         <span>Node-RED Copilot</span>
//                     </div>
//                     <div class="copilot-controls">
//                         <button id="copilot-refresh" class="copilot-btn" title="Обновить анализ">
//                             <i class="fa fa-refresh"></i>
//                         </button>
//                         <button id="copilot-settings" class="copilot-btn" title="Настройки">
//                             <i class="fa fa-cog"></i>
//                         </button>
//                     </div>
//                 </div>

//                 <!-- Статус -->
//                 <div class="copilot-status" id="copilot-status">
//                     <div class="status-indicator" id="status-indicator">
//                         <div class="status-dot"></div>
//                         <span id="status-text">Инициализация...</span>
//                     </div>
//                     <div class="last-update" id="last-update"></div>
//                 </div>

//                 <!-- Сводка -->
//                 <div class="copilot-summary" id="copilot-summary" style="display: none;">
//                     <div class="summary-stats">
//                         <div class="stat-item">
//                             <span class="stat-value" id="total-flows">0</span>
//                             <span class="stat-label">Потоков</span>
//                         </div>
//                         <div class="stat-item">
//                             <span class="stat-value" id="total-nodes">0</span>
//                             <span class="stat-label">Узлов</span>
//                         </div>
//                         <div class="stat-item">
//                             <span class="stat-value" id="total-issues">0</span>
//                             <span class="stat-label">Проблем</span>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- Вкладки -->
//                 <div class="copilot-tabs">
//                     <button class="tab-btn active" data-tab="overview">Обзор</button>
//                     <button class="tab-btn" data-tab="flows">Потоки</button>
//                     <button class="tab-btn" data-tab="issues">Проблемы</button>
//                     <button class="tab-btn" data-tab="patterns">Паттерны</button>
//                 </div>

//                 <!-- Содержимое вкладок -->
//                 <div class="copilot-content">
//                     <!-- Вкладка: Обзор -->
//                     <div class="tab-content active" data-tab="overview">
//                         <div id="overview-content">
//                             <div class="loading">
//                                 <div class="spinner"></div>
//                                 <p>Анализирую ваши потоки...</p>
//                             </div>
//                         </div>
//                     </div>

//                     <!-- Вкладка: Потоки -->
//                     <div class="tab-content" data-tab="flows">
//                         <div id="flows-content">
//                             <div class="flows-list"></div>
//                         </div>
//                     </div>

//                     <!-- Вкладка: Проблемы -->
//                     <div class="tab-content" data-tab="issues">
//                         <div id="issues-content">
//                             <div class="issues-list"></div>
//                         </div>
//                     </div>

//                     <!-- Вкладка: Паттерны -->
//                     <div class="tab-content" data-tab="patterns">
//                         <div id="patterns-content">
//                             <div class="patterns-list"></div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         this.container.html(html);
//     }

//     bindEvents() {
//         // Обновление анализа
//         $('#copilot-refresh').click(() => {
//             this.performAnalysis();
//         });

//         // Настройки
//         $('#copilot-settings').click(() => {
//             this.showSettings();
//         });

//         // Переключение вкладок
//         $('.tab-btn').click((e) => {
//             const tabName = $(e.target).data('tab');
//             this.switchTab(tabName);
//         });

//         // Слушаем события изменений в редакторе
//         RED.events.on("flows:change", () => {
//             if (this.autoRefresh) {
//                 clearTimeout(this.refreshTimer);
//                 this.refreshTimer = setTimeout(() => {
//                     this.performAnalysis();
//                 }, 2000); // Задержка 2 секунды
//             }
//         });

//         // Обновляем при развертывании
//         RED.events.on("runtime-event", (event) => {
//             if (event.id === "flows-deployed") {
//                 setTimeout(() => {
//                     this.performAnalysis();
//                 }, 1000);
//             }
//         });
//     }

//     switchTab(tabName) {
//         // Обновляем кнопки
//         $('.tab-btn').removeClass('active');
//         $(`.tab-btn[data-tab="${tabName}"]`).addClass('active');

//         // Обновляем содержимое
//         $('.tab-content').removeClass('active');
//         $(`.tab-content[data-tab="${tabName}"]`).addClass('active');

//         // Обновляем содержимое если нужно
//         this.updateTabContent(tabName);
//     }

//     updateTabContent(tabName) {
//         if (!this.currentAnalysis) return;

//         switch (tabName) {
//             case 'flows':
//                 this.renderFlowsList();
//                 break;
//             case 'issues':
//                 this.renderIssuesList();
//                 break;
//             case 'patterns':
//                 this.renderPatternsList();
//                 break;
//         }
//     }

//     // Локальный анализ потоков (без серверной части)
//     performAnalysis() {
//         this.updateStatus('analyzing', this.useAI ? 'AI анализ...' : 'Анализирую...');
        
//         try {
//             // Получаем потоки напрямую из Node-RED
//             const flows = RED.nodes.getFlows();
//             const analysis = this.analyzeFlowsLocally(flows);
            
//             this.currentAnalysis = analysis;
//             const statusText = analysis.aiEnhanced ? 'AI анализ завершен' : 'Анализ завершен';
//             this.updateStatus('completed', statusText);
//             this.updateSummary(analysis);
//             this.updateOverview(analysis);
//             this.updateLastUpdateTime();
            
//             console.log('✅ Локальный анализ завершен');
//         } catch (error) {
//             console.error('Ошибка анализа:', error);
//             this.updateStatus('error', 'Ошибка анализа');
//         }
//     }

//     // Локальный анализ потоков
//     analyzeFlowsLocally(flows) {
//         const analysis = {
//             timestamp: new Date().toISOString(),
//             totalFlows: 0,
//             totalNodes: 0,
//             flowAnalyses: [],
//             globalIssues: [],
//             summary: {},
//             aiEnhanced: false
//         };

//         if (!flows || !flows.flows) {
//             return analysis;
//         }

//         const flowTabs = flows.flows.filter(flow => flow.type === 'tab');
//         analysis.totalFlows = flowTabs.length;

//         // Анализируем каждый поток
//         flowTabs.forEach(flowTab => {
//             const flowNodes = flows.flows.filter(node => node.z === flowTab.id && node.type !== 'tab');
            
//             if (flowNodes.length > 0) {
//                 const flowAnalysis = this.analyzeFlowLocally(flowTab, flowNodes);
//                 analysis.flowAnalyses.push(flowAnalysis);
//                 analysis.totalNodes += flowAnalysis.nodeCount;
//             }
//         });

//         // Глобальные проблемы
//         analysis.globalIssues = this.findGlobalIssuesLocally(flows);
//         analysis.summary = this.generateSummaryLocally(analysis);

//         return analysis;
//     }

//     // Анализ отдельного потока
//     analyzeFlowLocally(flowTab, flowNodes) {
//         const analysis = {
//             id: flowTab.id,
//             label: flowTab.label || `Поток ${flowTab.id}`,
//             type: 'tab',
//             nodeCount: flowNodes.length,
//             issues: [],
//             patterns: [],
//             complexity: this.calculateComplexityLocally(flowNodes)
//         };

//         // Анализируем проблемы
//         analysis.issues = this.findFlowIssuesLocally(flowNodes);
//         analysis.patterns = this.detectFlowPatternsLocally(flowNodes);

//         return analysis;
//     }

//     // Вычисляем сложность потока
//     calculateComplexityLocally(nodes) {
//         const nodeCount = nodes.length;
//         const connections = this.countConnectionsLocally(nodes);
//         const depth = this.calculateFlowDepthLocally(nodes);
//         const branches = this.countBranchesLocally(nodes);

//         const complexityScore = nodeCount + (connections * 0.5) + (depth * 2) + (branches * 1.5);

//         let level = 'simple';
//         if (complexityScore > 50) level = 'complex';
//         else if (complexityScore > 20) level = 'medium';

//         return {
//             level,
//             score: Math.round(complexityScore),
//             nodeCount,
//             connections,
//             depth,
//             branches
//         };
//     }

//     countConnectionsLocally(nodes) {
//         let connections = 0;
//         nodes.forEach(node => {
//             if (node.wires) {
//                 node.wires.forEach(wireArray => {
//                     connections += wireArray.length;
//                 });
//             }
//         });
//         return connections;
//     }

//     calculateFlowDepthLocally(nodes) {
//         // Простой алгоритм: найти самую длинную цепочку узлов
//         let maxDepth = 0;
//         const visited = new Set();

//         const findDepth = (nodeId, depth = 0) => {
//             if (visited.has(nodeId)) return depth;
//             visited.add(nodeId);

//             const node = nodes.find(n => n.id === nodeId);
//             if (!node || !node.wires) return depth;

//             let localMaxDepth = depth;
//             node.wires.forEach(wireArray => {
//                 wireArray.forEach(targetId => {
//                     const targetDepth = findDepth(targetId, depth + 1);
//                     localMaxDepth = Math.max(localMaxDepth, targetDepth);
//                 });
//             });

//             return localMaxDepth;
//         };

//         // Ищем начальные узлы
//         const startNodes = nodes.filter(node => 
//             ['inject', 'http in', 'mqtt in', 'websocket in'].includes(node.type)
//         );

//         startNodes.forEach(startNode => {
//             visited.clear();
//             const depth = findDepth(startNode.id);
//             maxDepth = Math.max(maxDepth, depth);
//         });

//         return maxDepth;
//     }

//     countBranchesLocally(nodes) {
//         let branches = 0;
//         nodes.forEach(node => {
//             if (node.wires && node.wires.length > 0) {
//                 const totalOutputs = node.wires.reduce((sum, wireArray) => sum + wireArray.length, 0);
//                 if (totalOutputs > 1) branches += totalOutputs - 1;
//             }
//         });
//         return branches;
//     }

//     // Ищем проблемы в потоке
//     findFlowIssuesLocally(nodes) {
//         const issues = [];

//         // Отключенные узлы
//         const disconnected = this.findDisconnectedNodesLocally(nodes);
//         if (disconnected.length > 0) {
//             issues.push({
//                 type: 'disconnected',
//                 severity: 'warning',
//                 title: 'Отключенные узлы',
//                 message: `${disconnected.length} узлов не подключены`,
//                 nodeIds: disconnected.map(n => n.id),
//                 action: 'Подключите или удалите неиспользуемые узлы'
//             });
//         }

//         // Отсутствие обработки ошибок
//         const needsErrorHandling = this.checkErrorHandlingLocally(nodes);
//         if (needsErrorHandling.length > 0) {
//             issues.push({
//                 type: 'no-error-handling',
//                 severity: 'high',
//                 title: 'Нет обработки ошибок',
//                 message: `${needsErrorHandling.length} узлов могут генерировать ошибки`,
//                 nodeIds: needsErrorHandling,
//                 action: 'Добавьте catch узлы для обработки ошибок'
//             });
//         }

//         // Много HTTP запросов
//         const httpNodes = nodes.filter(n => n.type === 'http request');
//         if (httpNodes.length > 5) {
//             issues.push({
//                 type: 'too-many-http',
//                 severity: 'warning',
//                 title: 'Много HTTP запросов',
//                 message: `${httpNodes.length} HTTP запросов могут перегрузить сервер`,
//                 nodeIds: httpNodes.map(n => n.id),
//                 action: 'Добавьте delay узлы или группируйте запросы'
//             });
//         }

//         return issues;
//     }

//     findDisconnectedNodesLocally(nodes) {
//         return nodes.filter(node => {
//             // Пропускаем определенные типы узлов
//             if (['comment', 'tab', 'group'].includes(node.type)) return false;

//             const hasOutput = node.wires && node.wires.length > 0 && 
//                              node.wires.some(wire => wire.length > 0);
//             const hasInput = nodes.some(other => 
//                 other.wires && other.wires.some(wire => wire.includes(node.id))
//             );

//             // inject узлы могут не иметь входов
//             if (node.type === 'inject') return !hasOutput;
            
//             // debug узлы могут не иметь выходов
//             if (['debug', 'http response'].includes(node.type)) return !hasInput;

//             return !hasOutput && !hasInput;
//         });
//     }

//     checkErrorHandlingLocally(nodes) {
//         const vulnerableNodes = nodes.filter(node => 
//             ['function', 'http request', 'exec', 'file', 'tcp'].includes(node.type)
//         ).map(n => n.id);

//         const catchNodes = nodes.filter(n => n.type === 'catch');
        
//         if (vulnerableNodes.length > 0 && catchNodes.length === 0) {
//             return vulnerableNodes;
//         }

//         return [];
//     }

//     // Обнаружение паттернов
//     detectFlowPatternsLocally(nodes) {
//         const patterns = [];
//         const nodeTypes = nodes.map(n => n.type);

//         // HTTP API
//         if (nodeTypes.includes('http in') && nodeTypes.includes('http response')) {
//             patterns.push({
//                 name: 'HTTP API',
//                 confidence: 90,
//                 icon: '🌐',
//                 description: 'REST API endpoints',
//                 recommendations: [
//                     'Добавьте rate limiting',
//                     'Используйте валидацию данных',
//                     'Логируйте запросы'
//                 ]
//             });
//         }

//         // IoT сенсор
//         if (nodeTypes.includes('mqtt in') && (nodeTypes.includes('function') || nodeTypes.includes('switch'))) {
//             patterns.push({
//                 name: 'IoT Sensor',
//                 confidence: 85,
//                 icon: '📡',
//                 description: 'Обработка данных сенсоров',
//                 recommendations: [
//                     'Фильтруйте аномальные значения',
//                     'Добавьте проверку качества сигнала'
//                 ]
//             });
//         }

//         // Dashboard
//         if (nodeTypes.some(type => type.startsWith('ui_'))) {
//             patterns.push({
//                 name: 'Dashboard',
//                 confidence: 95,
//                 icon: '📊',
//                 description: 'Панель мониторинга',
//                 recommendations: [
//                     'Ограничьте частоту обновлений',
//                     'Группируйте связанные элементы'
//                 ]
//             });
//         }

//         return patterns;
//     }

//     // Глобальные проблемы
//     findGlobalIssuesLocally(flows) {
//         const issues = [];
//         const flowTabs = flows.flows.filter(flow => flow.type === 'tab');

//         // Слишком много потоков
//         if (flowTabs.length > 10) {
//             issues.push({
//                 type: 'too-many-flows',
//                 severity: 'warning',
//                 title: 'Много потоков',
//                 message: `${flowTabs.length} потоков может усложнить управление`,
//                 action: 'Рассмотрите группировку связанной логики'
//             });
//         }

//         return issues;
//     }

//     // Генерация сводки
//     generateSummaryLocally(analysis) {
//         const totalIssues = analysis.globalIssues.length + 
//                            analysis.flowAnalyses.reduce((sum, flow) => sum + flow.issues.length, 0);
        
//         const highSeverityIssues = analysis.flowAnalyses
//             .flatMap(flow => flow.issues)
//             .filter(issue => issue.severity === 'high').length;

//         const patterns = analysis.flowAnalyses
//             .flatMap(flow => flow.patterns);

//         return {
//             status: totalIssues === 0 ? 'excellent' : 
//                    highSeverityIssues === 0 ? 'good' : 'needs-attention',
//             totalIssues,
//             highSeverityIssues,
//             patternsDetected: patterns.length,
//             averageComplexity: this.calculateAverageComplexity(analysis.flowAnalyses),
//             recommendations: this.getTopRecommendations(analysis)
//         };
//     }

//     calculateAverageComplexity(flowAnalyses) {
//         if (flowAnalyses.length === 0) return 0;
        
//         const totalScore = flowAnalyses.reduce((sum, flow) => sum + (flow.complexity?.score || 0), 0);
//         return Math.round(totalScore / flowAnalyses.length);
//     }

//     getTopRecommendations(analysis) {
//         const allRecommendations = [];
        
//         // Из глобальных проблем
//         analysis.globalIssues.forEach(issue => {
//             if (issue.action) allRecommendations.push(issue.action);
//         });

//         // Из паттернов
//         analysis.flowAnalyses.forEach(flow => {
//             flow.patterns.forEach(pattern => {
//                 if (pattern.recommendations) {
//                     allRecommendations.push(...pattern.recommendations);
//                 }
//             });
//         });

//         // Возвращаем уникальные топ-3
//         return [...new Set(allRecommendations)].slice(0, 3);
//     }

//     updateStatus(status, text) {
//         const indicator = $('#status-indicator');
//         const statusText = $('#status-text');
        
//         indicator.removeClass('status-good status-warning status-error status-analyzing');
        
//         switch (status) {
//             case 'analyzing':
//                 indicator.addClass('status-analyzing');
//                 break;
//             case 'completed':
//                 const issueCount = this.currentAnalysis ? 
//                     this.currentAnalysis.globalIssues.length + 
//                     this.currentAnalysis.flowAnalyses.reduce((sum, flow) => sum + flow.issues.length, 0) : 0;
                
//                 if (issueCount === 0) {
//                     indicator.addClass('status-good');
//                 } else if (issueCount < 5) {
//                     indicator.addClass('status-warning');
//                 } else {
//                     indicator.addClass('status-error');
//                 }
//                 break;
//             case 'error':
//                 indicator.addClass('status-error');
//                 break;
//         }
        
//         statusText.text(text);
//     }

//     updateSummary(analysis) {
//         $('#total-flows').text(analysis.totalFlows);
//         $('#total-nodes').text(analysis.totalNodes);
        
//         const totalIssues = analysis.globalIssues.length + 
//                            analysis.flowAnalyses.reduce((sum, flow) => sum + flow.issues.length, 0);
//         $('#total-issues').text(totalIssues);
        
//         $('#copilot-summary').show();
//     }

//     updateOverview(analysis) {
//         const overviewContent = $('#overview-content');
        
//         let html = '';
        
//         // Общий статус
//         const summary = analysis.summary;
//         const statusClass = summary.status === 'excellent' ? 'excellent' :
//                            summary.status === 'good' ? 'good' : 'warning';
        
//         html += `
//             <div class="overview-section">
//                 <h3>📊 Общий статус</h3>
//                 <div class="status-card ${statusClass}">
//                     <div class="status-icon">${this.getStatusIcon(summary.status)}</div>
//                     <div class="status-info">
//                         <div class="status-title">${this.getStatusTitle(summary.status)}</div>
//                         <div class="status-details">
//                             ${summary.totalIssues} проблем, ${summary.patternsDetected} паттернов
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         // Топ рекомендации
//         if (summary.recommendations && summary.recommendations.length > 0) {
//             html += `
//                 <div class="overview-section">
//                     <h3>💡 Главные рекомендации</h3>
//                     <div class="recommendations-list">
//                         ${summary.recommendations.map(rec => `
//                             <div class="recommendation-item">
//                                 <i class="fa fa-lightbulb-o"></i>
//                                 <span>${rec}</span>
//                             </div>
//                         `).join('')}
//                     </div>
//                 </div>
//             `;
//         }

//         // Последние проблемы
//         const recentIssues = analysis.flowAnalyses
//             .flatMap(flow => flow.issues)
//             .filter(issue => issue.severity === 'high')
//             .slice(0, 3);

//         if (recentIssues.length > 0) {
//             html += `
//                 <div class="overview-section">
//                     <h3>⚠️ Критические проблемы</h3>
//                     <div class="critical-issues">
//                         ${recentIssues.map(issue => `
//                             <div class="issue-item critical">
//                                 <div class="issue-title">${issue.title}</div>
//                                 <div class="issue-message">${issue.message}</div>
//                             </div>
//                         `).join('')}
//                     </div>
//                 </div>
//             `;
//         }

//         overviewContent.html(html);
//     }

//     renderFlowsList() {
//         if (!this.currentAnalysis) return;

//         const flowsContent = $('.flows-list');
        
//         const html = this.currentAnalysis.flowAnalyses.map(flow => {
//             const issueCount = flow.issues.length;
//             const complexityClass = flow.complexity.level;
            
//             return `
//                 <div class="flow-item ${issueCount > 0 ? 'has-issues' : ''}" data-flow-id="${flow.id}">
//                     <div class="flow-header">
//                         <div class="flow-title">
//                             <span class="flow-icon">📄</span>
//                             <span class="flow-name">${flow.label}</span>
//                         </div>
//                         <div class="flow-badges">
//                             <span class="complexity-badge ${complexityClass}">${flow.complexity.level}</span>
//                             ${issueCount > 0 ? `<span class="issues-badge">${issueCount}</span>` : ''}
//                         </div>
//                     </div>
//                     <div class="flow-stats">
//                         <span>${flow.nodeCount} узлов</span>
//                         <span>${flow.complexity.connections} связей</span>
//                         <span>Глубина: ${flow.complexity.depth}</span>
//                     </div>
//                     ${flow.patterns.length > 0 ? `
//                         <div class="flow-patterns">
//                             ${flow.patterns.map(pattern => `
//                                 <span class="pattern-tag">${pattern.icon} ${pattern.name}</span>
//                             `).join('')}
//                         </div>
//                     ` : ''}
//                 </div>
//             `;
//         }).join('');

//         flowsContent.html(html);

//         // Обработчик клика по потоку
//         $('.flow-item').click((e) => {
//             const flowId = $(e.currentTarget).data('flow-id');
//             this.showFlowDetails(flowId);
//         });
//     }

//     renderIssuesList() {
//         if (!this.currentAnalysis) return;

//         const issuesContent = $('.issues-list');
        
//         const allIssues = [
//             ...this.currentAnalysis.globalIssues.map(issue => ({...issue, scope: 'global'})),
//             ...this.currentAnalysis.flowAnalyses.flatMap(flow => 
//                 flow.issues.map(issue => ({...issue, scope: 'flow', flowLabel: flow.label}))
//             )
//         ];

//         if (allIssues.length === 0) {
//             issuesContent.html(`
//                 <div class="no-issues">
//                     <div class="no-issues-icon">✅</div>
//                     <div class="no-issues-text">Проблем не найдено!</div>
//                     <div class="no-issues-subtext">Ваши потоки выглядят отлично</div>
//                 </div>
//             `);
//             return;
//         }

//         const issuesByPriority = {
//             high: allIssues.filter(i => i.severity === 'high'),
//             warning: allIssues.filter(i => i.severity === 'warning'),
//             info: allIssues.filter(i => i.severity === 'info')
//         };

//         let html = '';

//         Object.entries(issuesByPriority).forEach(([priority, issues]) => {
//             if (issues.length === 0) return;

//             const priorityIcon = priority === 'high' ? '🚨' : priority === 'warning' ? '⚠️' : 'ℹ️';
//             const priorityTitle = priority === 'high' ? 'Критические' : priority === 'warning' ? 'Предупреждения' : 'Информация';

//             html += `
//                 <div class="issues-group">
//                     <h4 class="issues-group-title">
//                         ${priorityIcon} ${priorityTitle} (${issues.length})
//                     </h4>
//                     <div class="issues-group-content">
//                         ${issues.map(issue => `
//                             <div class="issue-card ${priority}">
//                                 <div class="issue-header">
//                                     <span class="issue-title">${issue.title}</span>
//                                     <span class="issue-scope">${issue.scope === 'global' ? 'Глобально' : issue.flowLabel}</span>
//                                 </div>
//                                 <div class="issue-message">${issue.message}</div>
//                                 ${issue.action ? `<div class="issue-action">💡 ${issue.action}</div>` : ''}
//                                 ${issue.nodeIds && issue.nodeIds.length > 0 ? `
//                                     <div class="issue-nodes">
//                                         Узлы: ${issue.nodeIds.slice(0, 3).join(', ')}
//                                         ${issue.nodeIds.length > 3 ? ` и еще ${issue.nodeIds.length - 3}` : ''}
//                                     </div>
//                                 ` : ''}
//                             </div>
//                         `).join('')}
//                     </div>
//                 </div>
//             `;
//         });

//         issuesContent.html(html);
//     }

//     renderPatternsList() {
//         if (!this.currentAnalysis) return;

//         const patternsContent = $('.patterns-list');
        
//         const allPatterns = this.currentAnalysis.flowAnalyses.flatMap(flow => 
//             flow.patterns.map(pattern => ({...pattern, flowLabel: flow.label}))
//         );

//         if (allPatterns.length === 0) {
//             patternsContent.html(`
//                 <div class="no-patterns">
//                     <div class="no-patterns-icon">🔍</div>
//                     <div class="no-patterns-text">Паттерны не обнаружены</div>
//                     <div class="no-patterns-subtext">Попробуйте создать больше узлов</div>
//                 </div>
//             `);
//             return;
//         }

//         const html = allPatterns.map(pattern => `
//             <div class="pattern-card">
//                 <div class="pattern-header">
//                     <span class="pattern-icon">${pattern.icon}</span>
//                     <span class="pattern-name">${pattern.name}</span>
//                     <span class="pattern-confidence">${pattern.confidence}%</span>
//                 </div>
//                 <div class="pattern-flow">В потоке: ${pattern.flowLabel}</div>
//                 <div class="pattern-description">${pattern.description}</div>
//                 ${pattern.recommendations && pattern.recommendations.length > 0 ? `
//                     <div class="pattern-recommendations">
//                         <strong>Рекомендации:</strong>
//                         <ul>
//                             ${pattern.recommendations.map(rec => `<li>${rec}</li>`).join('')}
//                         </ul>
//                     </div>
//                 ` : ''}
//             </div>
//         `).join('');

//         patternsContent.html(html);
//     }

//     getStatusIcon(status) {
//         switch (status) {
//             case 'excellent': return '🌟';
//             case 'good': return '✅';
//             case 'needs-attention': return '⚠️';
//             default: return '❓';
//         }
//     }

//     getStatusTitle(status) {
//         switch (status) {
//             case 'excellent': return 'Отлично!';
//             case 'good': return 'Хорошо';
//             case 'needs-attention': return 'Требует внимания';
//             default: return 'Неизвестно';
//         }
//     }

//     updateLastUpdateTime() {
//         const now = new Date();
//         const timeString = now.toLocaleTimeString();
//         $('#last-update').text(`Обновлено: ${timeString}`);
//     }

//     startAutoRefresh() {
//         if (this.autoRefresh && !this.refreshTimer) {
//             this.refreshTimer = setInterval(() => {
//                 this.performAnalysis();
//             }, this.refreshInterval);
//         }
//     }

//     stopAutoRefresh() {
//         if (this.refreshTimer) {
//             clearInterval(this.refreshTimer);
//             this.refreshTimer = null;
//         }
//     }

//     showSettings() {
//         this.loadModelsData().then((modelsData) => {
//             this.displaySettingsDialog(modelsData);
//         }).catch((error) => {
//             console.error('Ошибка загрузки моделей:', error);
//             // Fallback к упрощенным настройкам
//             this.showSimpleSettings();
//         });
//     }

//     async loadModelsData() {
//         // Эмулируем загрузку моделей из локальной конфигурации
//         const models = this.modelsConfig.getAllModels();
//         const currentModel = this.modelsConfig.getCurrentModel();
        
//         return {
//             models,
//             currentModel,
//             stats: this.modelManager.getUsageStats()
//         };
//     }

//     displaySettingsDialog(modelsData) {
//         const currentModel = modelsData.currentModel;
//         const models = modelsData.models;
        
//         // Группируем модели по провайдерам
//         const modelsByProvider = {};
//         models.forEach(model => {
//             if (!modelsByProvider[model.provider]) {
//                 modelsByProvider[model.provider] = [];
//             }
//             modelsByProvider[model.provider].push(model);
//         });

//         let modelsHtml = '';
//         Object.entries(modelsByProvider).forEach(([provider, providerModels]) => {
//             const providerName = this.getProviderDisplayName(provider);
//             modelsHtml += `
//                 <div class="models-group">
//                     <h4 class="models-group-title">${providerName}</h4>
//                     ${providerModels.map(model => `
//                         <div class="model-option">
//                             <label class="model-label">
//                                 <input type="radio" name="selected-model" value="${model.id}" 
//                                        ${currentModel && currentModel.id === model.id ? 'checked' : ''}>
//                                 <span class="model-info">
//                                     <span class="model-icon">${model.icon}</span>
//                                     <span class="model-name">${model.name}</span>
//                                     <span class="model-description">${model.description}</span>
//                                 </span>
//                             </label>
//                             ${model.requiresApiKey ? `
//                                 <div class="api-key-section" data-provider="${model.provider}">
//                                     <input type="password" class="api-key-input" 
//                                            placeholder="API ключ для ${providerName}"
//                                            data-provider="${model.provider}"
//                                            value="${this.modelsConfig.getApiKey(model.provider) || ''}">
//                                     <button class="test-connection-btn" data-model-id="${model.id}">
//                                         <i class="fa fa-plug"></i> Тест
//                                     </button>
//                                 </div>
//                             ` : ''}
//                         </div>
//                     `).join('')}
//                 </div>
//             `;
//         });

//         const dialog = $(`
//             <div class="copilot-settings-dialog">
//                 <div class="settings-tabs">
//                     <button class="settings-tab-btn active" data-tab="models">🤖 Модели</button>
//                     <button class="settings-tab-btn" data-tab="general">⚙️ Общие</button>
//                 </div>

//                 <div class="settings-content">
//                     <!-- Вкладка: Модели -->
//                     <div class="settings-tab-content active" data-tab="models">
//                         <h3>Выбор AI модели</h3>
//                         <div class="ai-toggle">
//                             <label>
//                                 <input type="checkbox" id="use-ai-analysis" ${this.useAI ? 'checked' : ''}>
//                                 Использовать AI анализ
//                             </label>
//                             <p class="ai-toggle-description">
//                                 AI анализ обеспечивает более глубокое понимание кода и персонализированные рекомендации
//                             </p>
//                         </div>
                        
//                         <div class="models-selection" id="models-selection" ${!this.useAI ? 'style="display: none;"' : ''}>
//                             ${modelsHtml}
//                         </div>
//                     </div>

//                     <!-- Вкладка: Общие настройки -->
//                     <div class="settings-tab-content" data-tab="general">
//                         <h3>Общие настройки</h3>
//                         <div class="setting-item">
//                             <label>
//                                 <input type="checkbox" id="auto-refresh-setting" ${this.autoRefresh ? 'checked' : ''}>
//                                 Автоматическое обновление
//                             </label>
//                         </div>
//                         <div class="setting-item">
//                             <label>
//                                 Интервал обновления (сек):
//                                 <input type="number" id="refresh-interval-setting" 
//                                        value="${this.refreshInterval / 1000}" min="5" max="300">
//                             </label>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `);

//         // Обработчики событий для диалога
//         this.bindSettingsEvents(dialog, modelsData);

//         dialog.dialog({
//             title: "Настройки Copilot",
//             width: 600,
//             height: 500,
//             modal: true,
//             resizable: true,
//             buttons: {
//                 "Сохранить": () => {
//                     this.saveSettings(dialog);
//                 },
//                 "Отмена": () => {
//                     dialog.dialog("close");
//                 }
//             }
//         });
//     }

//     bindSettingsEvents(dialog, modelsData) {
//         // Переключение вкладок настроек
//         dialog.find('.settings-tab-btn').click(function() {
//             const tabName = $(this).data('tab');
//             dialog.find('.settings-tab-btn').removeClass('active');
//             dialog.find('.settings-tab-content').removeClass('active');
//             $(this).addClass('active');
//             dialog.find(`.settings-tab-content[data-tab="${tabName}"]`).addClass('active');
//         });

//         // Переключение AI анализа
//         dialog.find('#use-ai-analysis').change(function() {
//             const useAI = $(this).is(':checked');
//             dialog.find('#models-selection').toggle(useAI);
//         });

//         // Тестирование подключения к модели
//         dialog.find('.test-connection-btn').click(async (e) => {
//             const btn = $(e.target).closest('.test-connection-btn');
//             const modelId = btn.data('model-id');
//             const originalText = btn.html();
            
//             btn.html('<i class="fa fa-spinner fa-spin"></i> Тест...').prop('disabled', true);
            
//             try {
//                 const result = await this.testModelConnection(modelId);
                
//                 if (result.success) {
//                     btn.html('<i class="fa fa-check"></i> OK').removeClass('btn-error').addClass('btn-success');
//                     console.log(`Подключение к модели успешно`);
//                 } else {
//                     btn.html('<i class="fa fa-times"></i> Ошибка').removeClass('btn-success').addClass('btn-error');
//                     console.error(`Ошибка подключения: ${result.error}`);
//                 }
//             } catch (error) {
//                 btn.html('<i class="fa fa-times"></i> Ошибка').removeClass('btn-success').addClass('btn-error');
//                 console.error(`Ошибка тестирования: ${error.message}`);
//             }
            
//             setTimeout(() => {
//                 btn.html(originalText).prop('disabled', false).removeClass('btn-success btn-error');
//             }, 3000);
//         });

//         // Сохранение API ключей при вводе
//         dialog.find('.api-key-input').on('blur', function() {
//             const provider = $(this).data('provider');
//             const apiKey = $(this).val().trim();
            
//             if (apiKey) {
//                 this.modelsConfig.setApiKey(provider, apiKey);
//             }
//         }.bind(this));
//     }

//     async testModelConnection(modelId) {
//         try {
//             const result = await this.modelManager.testModelConnection(modelId);
//             return result;
//         } catch (error) {
//             return { success: false, error: error.message };
//         }
//     }

//     async saveSettings(dialog) {
//         try {
//             console.log('🔧 Сохраняем настройки...');
            
//             // Сохраняем общие настройки
//             this.useAI = dialog.find('#use-ai-analysis').is(':checked');
//             this.autoRefresh = dialog.find('#auto-refresh-setting').is(':checked');
//             this.refreshInterval = parseInt(dialog.find('#refresh-interval-setting').val()) * 1000;
            
//             console.log('🔧 useAI:', this.useAI);
//             console.log('🔧 autoRefresh:', this.autoRefresh);
            
//             // Сохраняем выбранную модель
//             const selectedModelId = dialog.find('input[name="selected-model"]:checked').val();
//             console.log('🔧 Выбранная модель:', selectedModelId);
            
//             if (selectedModelId) {
//                 const success = this.modelsConfig.setCurrentModel(selectedModelId);
//                 console.log('🔧 Модель установлена:', success);
//                 this.modelsConfig.saveConfig();
//                 console.log('🔧 Конфигурация сохранена');
                
//                 // Проверяем, что модель действительно установилась
//                 const currentModel = this.modelsConfig.getCurrentModel();
//                 console.log('🔧 Текущая модель после сохранения:', currentModel);
//             }
            
//             // Сохраняем API ключи
//             dialog.find('.api-key-input').each((index, input) => {
//                 const provider = $(input).data('provider');
//                 const apiKey = $(input).val().trim();
//                 if (apiKey) {
//                     this.modelsConfig.setApiKey(provider, apiKey);
//                     console.log('🔧 API ключ сохранен для:', provider);
//                 }
//             });
            
//             // Обновляем автообновление
//             if (this.autoRefresh) {
//                 this.stopAutoRefresh();
//                 this.startAutoRefresh();
//             } else {
//                 this.stopAutoRefresh();
//             }
            
//             dialog.dialog("close");
//             console.log("✅ Настройки сохранены успешно");
            
//             // Обновляем анализ с новыми настройками
//             this.performAnalysis();
            
//         } catch (error) {
//             console.error('❌ Ошибка сохранения настроек:', error);
//         }
//     }

//     getProviderDisplayName(provider) {
//         const names = {
//             'openai': 'OpenAI',
//             'anthropic': 'Anthropic (Claude)',
//             'ollama': 'Ollama (Локально)',
//             'lmstudio': 'LM Studio (Локально)',
//             'builtin': 'Встроенный анализатор'
//         };
//         return names[provider] || provider;
//     }

//     showSimpleSettings() {
//         // Упрощенные настройки как fallback
//         const dialog = $(`
//             <div class="copilot-settings-dialog">
//                 <div class="settings-content">
//                     <h3>⚙️ Настройки Copilot</h3>
                    
//                     <div class="setting-item">
//                         <label>
//                             <input type="checkbox" id="auto-refresh-setting" ${this.autoRefresh ? 'checked' : ''}>
//                             Автоматическое обновление
//                         </label>
//                     </div>
                    
//                     <div class="setting-item">
//                         <label>
//                             Интервал обновления (сек):
//                             <input type="number" id="refresh-interval-setting" 
//                                    value="${this.refreshInterval / 1000}" min="5" max="300">
//                         </label>
//                     </div>
                    
//                     <div class="setting-item">
//                         <p><strong>Информация:</strong></p>
//                         <p>Это локальная версия Copilot с базовым анализом.</p>
//                     </div>
//                 </div>
//             </div>
//         `);

//         dialog.dialog({
//             title: "Настройки Copilot",
//             width: 500,
//             height: 300,
//             modal: true,
//             resizable: true,
//             buttons: {
//                 "Сохранить": () => {
//                     this.autoRefresh = dialog.find('#auto-refresh-setting').is(':checked');
//                     this.refreshInterval = parseInt(dialog.find('#refresh-interval-setting').val()) * 1000;
                    
//                     // Обновляем автообновление
//                     if (this.autoRefresh) {
//                         this.stopAutoRefresh();
//                         this.startAutoRefresh();
//                     } else {
//                         this.stopAutoRefresh();
//                     }
                    
//                     dialog.dialog("close");
//                     console.log("Настройки сохранены");
//                 },
//                 "Отмена": () => {
//                     dialog.dialog("close");
//                 }
//             }
//         });
//     }

//     showFlowDetails(flowId) {
//         const flowAnalysis = this.currentAnalysis.flowAnalyses.find(f => f.id === flowId);
//         if (!flowAnalysis) return;

//         let html = `
//             <div class="flow-details">
//                 <h3>📊 ${flowAnalysis.label}</h3>
                
//                 <div class="flow-overview">
//                     <div class="overview-stats">
//                         <div class="stat">${flowAnalysis.nodeCount} узлов</div>
//                         <div class="stat">${flowAnalysis.complexity.connections} связей</div>
//                         <div class="stat">Сложность: ${flowAnalysis.complexity.level}</div>
//                     </div>
//                 </div>
//         `;

//         if (flowAnalysis.patterns.length > 0) {
//             html += `
//                 <div class="section">
//                     <h4>🎯 Паттерны</h4>
//                     ${flowAnalysis.patterns.map(pattern => `
//                         <div class="pattern-mini">
//                             ${pattern.icon} ${pattern.name} (${pattern.confidence}%)
//                         </div>
//                     `).join('')}
//                 </div>
//             `;
//         }

//         if (flowAnalysis.issues.length > 0) {
//             html += `
//                 <div class="section">
//                     <h4>⚠️ Проблемы (${flowAnalysis.issues.length})</h4>
//                     ${flowAnalysis.issues.map(issue => `
//                         <div class="issue-mini ${issue.severity}">
//                             <strong>${issue.title}</strong><br>
//                             ${issue.message}
//                         </div>
//                     `).join('')}
//                 </div>
//             `;
//         }

//         html += '</div>';

//         const dialog = $(html);
//         dialog.dialog({
//             title: `Детали потока: ${flowAnalysis.label}`,
//             width: 500,
//             height: 400,
//             modal: true,
//             resizable: true,
//             buttons: {
//                 "Закрыть": function() {
//                     $(this).dialog("close");
//                 }
//             }
//         });
//     }
// }

// Экспортируем класс в глобальную область
window.CopilotPanel = CopilotPanel;
