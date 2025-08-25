// copilot-sidebar.js

module.exports = function(RED) {
    "use strict";

    const path = require('path');
    const ModelsConfig = require('./models-config');
    const ModelManager = require('./model-manager');

    // Расширенный анализатор для боковой панели с AI поддержкой
    class CopilotAnalyzer {
        constructor(RED) {
            this.RED = RED;
            this.analysisHistory = [];
            this.maxHistorySize = 50;
            
            // Инициализируем AI компоненты
            this.modelsConfig = new ModelsConfig();
            this.modelsConfig.loadConfig();
            this.modelManager = new ModelManager(this.modelsConfig);
            
            console.log('🤖 Copilot AI анализатор инициализирован');
        }

        // Получаем активный поток в редакторе
        getActiveWorkspace() {
            const flows = this.RED.nodes.getFlows();
            return flows.flows || [];
        }

        // Анализируем все потоки
        analyzeAllFlows() {
            console.log('🔍 Copilot: Анализирую все потоки...');
            
            const flows = this.getActiveWorkspace();
            const globalAnalysis = {
                timestamp: new Date().toISOString(),
                totalFlows: flows.length,
                totalNodes: 0,
                flowAnalyses: [],
                globalIssues: [],
                globalSuggestions: [],
                summary: {}
            };

            // Анализируем каждый поток
            flows.forEach(flow => {
                if (flow.nodes && flow.nodes.length > 0) {
                    const flowAnalysis = this.analyzeFlow(flow);
                    globalAnalysis.flowAnalyses.push(flowAnalysis);
                    globalAnalysis.totalNodes += flowAnalysis.nodeCount;
                }
            });

            // Глобальные проблемы
            globalAnalysis.globalIssues = this.findGlobalIssues(flows);
            globalAnalysis.globalSuggestions = this.generateGlobalSuggestions(flows);
            globalAnalysis.summary = this.generateSummary(globalAnalysis);

            // Сохраняем в историю
            this.addToHistory(globalAnalysis);

            console.log(`✅ Copilot: Анализ завершен. Найдено ${globalAnalysis.globalIssues.length} проблем`);
            return globalAnalysis;
        }

        // Анализ отдельного потока
        analyzeFlow(flow) {
            const analysis = {
                id: flow.id,
                label: flow.label || `Поток ${flow.id}`,
                type: flow.type || 'tab',
                nodeCount: flow.nodes ? flow.nodes.length : 0,
                issues: [],
                suggestions: [],
                patterns: [],
                performance: { score: 100, issues: [] },
                complexity: this.calculateComplexity(flow)
            };

            if (!flow.nodes) return analysis;

            // Анализируем проблемы
            analysis.issues = this.findFlowIssues(flow);
            analysis.suggestions = this.generateFlowSuggestions(flow);
            analysis.patterns = this.detectFlowPatterns(flow);
            analysis.performance = this.analyzeFlowPerformance(flow);

            return analysis;
        }

        // Вычисляем сложность потока
        calculateComplexity(flow) {
            if (!flow.nodes) return { level: 'simple', score: 0 };

            const nodeCount = flow.nodes.length;
            const connections = this.countConnections(flow);
            const depth = this.calculateFlowDepth(flow);
            const branches = this.countBranches(flow);

            const complexityScore = nodeCount + (connections * 0.5) + (depth * 2) + (branches * 1.5);

            let level = 'simple';
            if (complexityScore > 50) level = 'complex';
            else if (complexityScore > 20) level = 'medium';

            return {
                level,
                score: Math.round(complexityScore),
                nodeCount,
                connections,
                depth,
                branches
            };
        }

        // Считаем соединения
        countConnections(flow) {
            let connections = 0;
            flow.nodes.forEach(node => {
                if (node.wires) {
                    node.wires.forEach(wireArray => {
                        connections += wireArray.length;
                    });
                }
            });
            return connections;
        }

        // Вычисляем глубину потока
        calculateFlowDepth(flow) {
            // Простой алгоритм: найти самую длинную цепочку узлов
            let maxDepth = 0;
            const visited = new Set();

            const findDepth = (nodeId, depth = 0) => {
                if (visited.has(nodeId)) return depth;
                visited.add(nodeId);

                const node = flow.nodes.find(n => n.id === nodeId);
                if (!node || !node.wires) return depth;

                let localMaxDepth = depth;
                node.wires.forEach(wireArray => {
                    wireArray.forEach(targetId => {
                        const targetDepth = findDepth(targetId, depth + 1);
                        localMaxDepth = Math.max(localMaxDepth, targetDepth);
                    });
                });

                return localMaxDepth;
            };

            // Ищем начальные узлы (inject, http in, mqtt in)
            const startNodes = flow.nodes.filter(node => 
                ['inject', 'http in', 'mqtt in', 'websocket in'].includes(node.type)
            );

            startNodes.forEach(startNode => {
                visited.clear();
                const depth = findDepth(startNode.id);
                maxDepth = Math.max(maxDepth, depth);
            });

            return maxDepth;
        }

        // Считаем ветвления
        countBranches(flow) {
            let branches = 0;
            flow.nodes.forEach(node => {
                if (node.wires && node.wires.length > 0) {
                    const totalOutputs = node.wires.reduce((sum, wireArray) => sum + wireArray.length, 0);
                    if (totalOutputs > 1) branches += totalOutputs - 1;
                }
            });
            return branches;
        }

        // Ищем проблемы в потоке
        findFlowIssues(flow) {
            const issues = [];

            // Отключенные узлы
            const disconnected = this.findDisconnectedNodes(flow);
            if (disconnected.length > 0) {
                issues.push({
                    type: 'disconnected',
                    severity: 'warning',
                    title: 'Отключенные узлы',
                    message: `${disconnected.length} узлов не подключены`,
                    nodeIds: disconnected.map(n => n.id),
                    action: 'Подключите или удалите неиспользуемые узлы'
                });
            }

            // Отсутствие обработки ошибок
            const needsErrorHandling = this.checkErrorHandling(flow);
            if (needsErrorHandling.length > 0) {
                issues.push({
                    type: 'no-error-handling',
                    severity: 'high',
                    title: 'Нет обработки ошибок',
                    message: `${needsErrorHandling.length} узлов могут генерировать ошибки`,
                    nodeIds: needsErrorHandling,
                    action: 'Добавьте catch узлы для обработки ошибок'
                });
            }

            // Потенциальные проблемы производительности
            const performanceIssues = this.findPerformanceIssues(flow);
            issues.push(...performanceIssues);

            // Проблемы безопасности
            const securityIssues = this.findSecurityIssues(flow);
            issues.push(...securityIssues);

            return issues;
        }

        findDisconnectedNodes(flow) {
            return flow.nodes.filter(node => {
                // Пропускаем определенные типы узлов
                if (['comment', 'tab', 'group'].includes(node.type)) return false;

                const hasOutput = node.wires && node.wires.length > 0 && 
                                 node.wires.some(wire => wire.length > 0);
                const hasInput = flow.nodes.some(other => 
                    other.wires && other.wires.some(wire => wire.includes(node.id))
                );

                // inject узлы могут не иметь входов
                if (node.type === 'inject') return !hasOutput;
                
                // debug узлы могут не иметь выходов
                if (['debug', 'http response'].includes(node.type)) return !hasInput;

                return !hasOutput && !hasInput;
            });
        }

        checkErrorHandling(flow) {
            const vulnerableNodes = flow.nodes.filter(node => 
                ['function', 'http request', 'exec', 'file', 'tcp'].includes(node.type)
            ).map(n => n.id);

            const catchNodes = flow.nodes.filter(n => n.type === 'catch');
            
            if (vulnerableNodes.length > 0 && catchNodes.length === 0) {
                return vulnerableNodes;
            }

            return [];
        }

        findPerformanceIssues(flow) {
            const issues = [];

            // Много HTTP запросов подряд
            const httpNodes = flow.nodes.filter(n => n.type === 'http request');
            if (httpNodes.length > 5) {
                issues.push({
                    type: 'too-many-http',
                    severity: 'warning',
                    title: 'Много HTTP запросов',
                    message: `${httpNodes.length} HTTP запросов могут перегрузить сервер`,
                    nodeIds: httpNodes.map(n => n.id),
                    action: 'Добавьте delay узлы или группируйте запросы'
                });
            }

            // Большие циклы в function узлах
            const heavyFunctions = flow.nodes.filter(node => {
                if (node.type !== 'function' || !node.func) return false;
                return this.hasHeavyOperations(node.func);
            });

            if (heavyFunctions.length > 0) {
                issues.push({
                    type: 'heavy-function',
                    severity: 'warning',
                    title: 'Тяжелые операции в function',
                    message: `${heavyFunctions.length} function узлов содержат потенциально медленный код`,
                    nodeIds: heavyFunctions.map(n => n.id),
                    action: 'Оптимизируйте циклы или вынесите логику в отдельный модуль'
                });
            }

            return issues;
        }

        hasHeavyOperations(code) {
            const heavyPatterns = [
                /for\s*\([^)]*;\s*[^<]*<\s*\d{3,}/, // Циклы с большим количеством итераций
                /while\s*\([^)]*\d{3,}/, // While циклы с большими числами
                /\.map\s*\([^)]*\)\.map/, // Вложенные map операции
                /JSON\.parse\s*\([^)]*\.length\s*>\s*\d{4}/ // Парсинг больших JSON
            ];

            return heavyPatterns.some(pattern => pattern.test(code));
        }

        findSecurityIssues(flow) {
            const issues = [];

            // HTTP endpoints без аутентификации
            const unsecureHttp = flow.nodes.filter(node => {
                if (node.type !== 'http in') return false;
                
                // Простая проверка на наличие аутентификации
                const hasAuth = node.url && (
                    node.url.includes('auth') || 
                    node.url.includes('login') ||
                    node.url.includes('token')
                );
                
                return !hasAuth && node.method !== 'get';
            });

            if (unsecureHttp.length > 0) {
                issues.push({
                    type: 'unsecure-http',
                    severity: 'high',
                    title: 'HTTP endpoints без аутентификации',
                    message: `${unsecureHttp.length} endpoints могут быть уязвимы`,
                    nodeIds: unsecureHttp.map(n => n.id),
                    action: 'Добавьте проверку токенов или basic authentication'
                });
            }

            return issues;
        }

        // Обнаружение паттернов
        detectFlowPatterns(flow) {
            const patterns = [];
            const nodeTypes = flow.nodes.map(n => n.type);

            // HTTP API
            if (nodeTypes.includes('http in') && nodeTypes.includes('http response')) {
                patterns.push({
                    name: 'HTTP API',
                    confidence: 90,
                    icon: '🌐',
                    description: 'REST API endpoints',
                    recommendations: [
                        'Добавьте rate limiting',
                        'Используйте валидацию данных',
                        'Логируйте запросы'
                    ]
                });
            }

            // IoT сенсор
            if (nodeTypes.includes('mqtt in') && (nodeTypes.includes('function') || nodeTypes.includes('switch'))) {
                patterns.push({
                    name: 'IoT Sensor',
                    confidence: 85,
                    icon: '📡',
                    description: 'Обработка данных сенсоров',
                    recommendations: [
                        'Фильтруйте аномальные значения',
                        'Добавьте проверку качества сигнала'
                    ]
                });
            }

            // Dashboard
            if (nodeTypes.some(type => type.startsWith('ui_'))) {
                patterns.push({
                    name: 'Dashboard',
                    confidence: 95,
                    icon: '📊',
                    description: 'Панель мониторинга',
                    recommendations: [
                        'Ограничьте частоту обновлений',
                        'Группируйте связанные элементы'
                    ]
                });
            }

            // Automation
            if (nodeTypes.includes('inject') && nodeTypes.includes('switch') && 
                (nodeTypes.includes('change') || nodeTypes.includes('function'))) {
                patterns.push({
                    name: 'Automation',
                    confidence: 80,
                    icon: '🤖',
                    description: 'Автоматизация процессов',
                    recommendations: [
                        'Добавьте логирование действий',
                        'Предусмотрите ручное отключение'
                    ]
                });
            }

            return patterns;
        }

        // Глобальные проблемы
        findGlobalIssues(flows) {
            const issues = [];

            // Слишком много потоков
            if (flows.length > 10) {
                issues.push({
                    type: 'too-many-flows',
                    severity: 'warning',
                    title: 'Много потоков',
                    message: `${flows.length} потоков может усложнить управление`,
                    action: 'Рассмотрите группировку связанной логики'
                });
            }

            // Дублирование функциональности
            const duplicatePatterns = this.findDuplicatePatterns(flows);
            if (duplicatePatterns.length > 0) {
                issues.push({
                    type: 'duplicate-logic',
                    severity: 'info',
                    title: 'Дублирование логики',
                    message: `Найдены похожие паттерны в ${duplicatePatterns.length} потоках`,
                    action: 'Создайте subflow для переиспользования логики'
                });
            }

            return issues;
        }

        findDuplicatePatterns(flows) {
            // Простой алгоритм поиска дублирования
            const patterns = {};
            
            flows.forEach(flow => {
                if (!flow.nodes) return;
                
                const signature = flow.nodes
                    .map(n => n.type)
                    .sort()
                    .join(',');
                    
                if (!patterns[signature]) patterns[signature] = [];
                patterns[signature].push(flow.id);
            });

            return Object.values(patterns).filter(flowIds => flowIds.length > 1);
        }

        // Сохранение в историю
        addToHistory(analysis) {
            this.analysisHistory.unshift(analysis);
            if (this.analysisHistory.length > this.maxHistorySize) {
                this.analysisHistory = this.analysisHistory.slice(0, this.maxHistorySize);
            }
        }

        getHistory() {
            return this.analysisHistory;
        }

        // Генерация сводки
        generateSummary(globalAnalysis) {
            const totalIssues = globalAnalysis.globalIssues.length + 
                               globalAnalysis.flowAnalyses.reduce((sum, flow) => sum + flow.issues.length, 0);
            
            const highSeverityIssues = globalAnalysis.flowAnalyses
                .flatMap(flow => flow.issues)
                .filter(issue => issue.severity === 'high').length;

            const patterns = globalAnalysis.flowAnalyses
                .flatMap(flow => flow.patterns);

            return {
                status: totalIssues === 0 ? 'excellent' : 
                       highSeverityIssues === 0 ? 'good' : 'needs-attention',
                totalIssues,
                highSeverityIssues,
                patternsDetected: patterns.length,
                averageComplexity: this.calculateAverageComplexity(globalAnalysis.flowAnalyses),
                recommendations: this.getTopRecommendations(globalAnalysis)
            };
        }

        calculateAverageComplexity(flowAnalyses) {
            if (flowAnalyses.length === 0) return 0;
            
            const totalScore = flowAnalyses.reduce((sum, flow) => sum + (flow.complexity?.score || 0), 0);
            return Math.round(totalScore / flowAnalyses.length);
        }

        getTopRecommendations(globalAnalysis) {
            const allRecommendations = [];
            
            // Из глобальных проблем
            globalAnalysis.globalIssues.forEach(issue => {
                if (issue.action) allRecommendations.push(issue.action);
            });

            // Из паттернов
            globalAnalysis.flowAnalyses.forEach(flow => {
                flow.patterns.forEach(pattern => {
                    if (pattern.recommendations) {
                        allRecommendations.push(...pattern.recommendations);
                    }
                });
            });

            // Возвращаем уникальные топ-3
            return [...new Set(allRecommendations)].slice(0, 3);
        }
    }

    // Регистрируем HTTP endpoints для панели
    RED.httpAdmin.get('/copilot-sidebar/analyze', async function(req, res) {
        try {
            const analyzer = new CopilotAnalyzer(RED);
            const useAI = req.query.ai === 'true';
            
            if (useAI) {
                // Используем AI анализ
                const flows = analyzer.getActiveWorkspace();
                const aiAnalysis = {
                    timestamp: new Date().toISOString(),
                    totalFlows: flows.length,
                    totalNodes: 0,
                    flowAnalyses: [],
                    globalIssues: [],
                    globalSuggestions: [],
                    summary: {},
                    aiEnhanced: true
                };

                // Анализируем каждый поток с AI
                for (const flow of flows) {
                    if (flow.nodes && flow.nodes.length > 0) {
                        try {
                            const aiResult = await analyzer.modelManager.analyzeWithAI(flow, 'codeAnalysis');
                            const parsedResult = analyzer.modelManager.parseAIResponse(aiResult.content);
                            
                            const flowAnalysis = {
                                id: flow.id,
                                label: flow.label || `Поток ${flow.id}`,
                                type: flow.type || 'tab',
                                nodeCount: flow.nodes.length,
                                issues: parsedResult.issues || [],
                                patterns: parsedResult.patterns || [],
                                recommendations: parsedResult.recommendations || [],
                                complexity: analyzer.calculateComplexity(flow),
                                aiModel: aiResult.model,
                                tokensUsed: aiResult.tokensUsed
                            };
                            
                            aiAnalysis.flowAnalyses.push(flowAnalysis);
                            aiAnalysis.totalNodes += flowAnalysis.nodeCount;
                        } catch (error) {
                            console.warn(`AI анализ потока ${flow.id} не удался, используем базовый:`, error);
                            const fallbackAnalysis = analyzer.analyzeFlow(flow);
                            aiAnalysis.flowAnalyses.push(fallbackAnalysis);
                            aiAnalysis.totalNodes += fallbackAnalysis.nodeCount;
                        }
                    }
                }

                aiAnalysis.globalIssues = analyzer.findGlobalIssues(flows);
                aiAnalysis.summary = analyzer.generateSummary(aiAnalysis);
                analyzer.addToHistory(aiAnalysis);
                
                res.json(aiAnalysis);
            } else {
                // Используем стандартный анализ
                const analysis = analyzer.analyzeAllFlows();
                res.json(analysis);
            }
        } catch (err) {
            console.error('Copilot analysis error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    RED.httpAdmin.get('/copilot-sidebar/history', function(req, res) {
        try {
            const analyzer = new CopilotAnalyzer(RED);
            const history = analyzer.getHistory();
            res.json(history);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    RED.httpAdmin.get('/copilot-sidebar/flows/:flowId', function(req, res) {
        try {
            const analyzer = new CopilotAnalyzer(RED);
            const flows = analyzer.getActiveWorkspace();
            const flow = flows.find(f => f.id === req.params.flowId);
            
            if (!flow) {
                return res.status(404).json({ error: 'Flow not found' });
            }

            const analysis = analyzer.analyzeFlow(flow);
            res.json(analysis);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API для управления моделями
    RED.httpAdmin.get('/copilot-sidebar/models', function(req, res) {
        try {
            const analyzer = new CopilotAnalyzer(RED);
            const models = analyzer.modelsConfig.getAllModels();
            const currentModel = analyzer.modelsConfig.getCurrentModel();
            
            res.json({
                models,
                currentModel,
                stats: analyzer.modelManager.getUsageStats()
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    RED.httpAdmin.post('/copilot-sidebar/models/current', function(req, res) {
        try {
            const analyzer = new CopilotAnalyzer(RED);
            const { modelId } = req.body;
            
            const success = analyzer.modelsConfig.setCurrentModel(modelId);
            if (success) {
                analyzer.modelsConfig.saveConfig();
                res.json({ success: true, currentModel: analyzer.modelsConfig.getCurrentModel() });
            } else {
                res.status(400).json({ error: 'Модель не найдена' });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    RED.httpAdmin.post('/copilot-sidebar/models/api-key', function(req, res) {
        try {
            const analyzer = new CopilotAnalyzer(RED);
            const { provider, apiKey } = req.body;
            
            analyzer.modelsConfig.setApiKey(provider, apiKey);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    RED.httpAdmin.delete('/copilot-sidebar/models/api-key/:provider', function(req, res) {
        try {
            const analyzer = new CopilotAnalyzer(RED);
            const { provider } = req.params;
            
            analyzer.modelsConfig.removeApiKey(provider);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    RED.httpAdmin.post('/copilot-sidebar/models/test', async function(req, res) {
        try {
            const analyzer = new CopilotAnalyzer(RED);
            const { modelId } = req.body;
            
            const result = await analyzer.modelManager.testModelConnection(modelId);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    RED.httpAdmin.get('/copilot-sidebar/models/stats', function(req, res) {
        try {
            const analyzer = new CopilotAnalyzer(RED);
            const stats = analyzer.modelManager.exportStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Обслуживаем статические ресурсы
    RED.httpAdmin.get('/copilot-sidebar/resources/*', function(req, res) {
        const filePath = path.join(__dirname, 'resources', req.params[0]);
        res.sendFile(filePath);
    });

    // Фиктивный узел для регистрации плагина (не будет отображаться в палитре)
    function CopilotSidebarNode(config) {
        RED.nodes.createNode(this, config);
    }

    RED.nodes.registerType("copilot-sidebar", CopilotSidebarNode);
};
