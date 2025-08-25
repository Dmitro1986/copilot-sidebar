# 🤖 Node-RED Copilot

Универсальный AI-помощник для Node-RED с поддержкой множественных провайдеров и интеллектуальным анализом потоков.

![Node-RED Copilot](https://img.shields.io/badge/Node--RED-Copilot-red?style=for-the-badge&logo=node-red)
![AI Powered](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge&logo=openai)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)

## ✨ Возможности

### 🧠 AI Анализ
- **Интеллектуальный анализ потоков** с персональными рекомендациями
- **Обнаружение проблем** и уязвимостей безопасности
- **Оптимизация производительности** и архитектурные советы
- **Поддержка множественных AI провайдеров**

### ⚡ Быстрый Анализ
- **Мгновенная проверка** потоков без AI
- **Обнаружение паттернов** (HTTP API, IoT, Dashboard, Automation)
- **Анализ сложности** и метрики потоков
- **Поиск отключенных узлов** и проблем конфигурации

### 💬 AI Чат
- **Интерактивный чат** с контекстом ваших потоков
- **Персональные ответы** на основе анализа вашего проекта
- **Поддержка Markdown** в ответах
- **История чата** с возможностью очистки

### 🎛️ Гибкие Настройки
- **Множественные провайдеры**: OpenAI, Anthropic, Ollama, Gemini
- **Пресеты настроек** для разных типов анализа
- **Настройка температуры** и количества токенов
- **Статус провайдеров** в реальном времени

## 🚀 Поддерживаемые AI Провайдеры

| Провайдер | Модели | Требует API ключ | Статус |
|-----------|--------|------------------|---------|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-3.5-turbo | ✅ | ✅ |
| **Anthropic** | Claude-3-Haiku, Claude-3-Sonnet, Claude-3-Opus | ✅ | ✅ |
| **Ollama** | Любые локальные модели | ❌ | ✅ |
| **Google Gemini** | Gemini-1.5-Flash, Gemini-1.5-Pro | ✅ | ✅ |

## 📦 Установка

### Предварительные требования
- Node-RED v3.0+
- Node.js v16+

### Быстрая установка

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/Dmitro1986/node-red-copilot.git
cd node-red-copilot
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Запустите Node-RED:**
```bash
npm start
```

4. **Откройте браузер:**
```
http://localhost:1887
```

### Настройка AI провайдеров

#### OpenAI
```bash
export OPENAI_API_KEY="your-api-key-here"
```

#### Anthropic
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

#### Google Gemini
```bash
export GEMINI_API_KEY="your-api-key-here"
```

#### Ollama (локальный)
```bash
# Установка Ollama
brew install ollama  # macOS
# или скачайте с https://ollama.ai

# Запуск сервера
ollama serve

# Установка модели
ollama pull llama3.2:latest
ollama pull codellama:7b
```

## 🎯 Использование

### 1. Открытие Copilot
- В Node-RED найдите вкладку **🤖 Copilot** в боковой панели
- Если вкладки нет, перезагрузите страницу

### 2. Выбор AI модели
- Выберите **провайдера** (OpenAI, Anthropic, Ollama, Gemini)
- Выберите **модель** из доступных
- При необходимости настройте **расширенные параметры**

### 3. Анализ потоков

#### Быстрый анализ
```
⚡ Быстрый анализ - мгновенная проверка без AI
```
- Обнаружение отключенных узлов
- Поиск проблем безопасности
- Анализ сложности потоков
- Определение архитектурных паттернов

#### AI анализ
```
🧠 AI анализ - умные рекомендации с использованием AI
```
- Персональные рекомендации по улучшению
- Глубокий анализ архитектуры
- Советы по оптимизации производительности
- Обнаружение потенциальных проблем

### 4. Чат с AI
- Задавайте вопросы о Node-RED
- Получайте советы по вашим потокам
- AI анализирует ваш проект для персональных ответов

## 🛠️ Конфигурация

### Файл настроек
Основные настройки находятся в `settings.js`:

```javascript
module.exports = {
    uiPort: process.env.PORT || 1887,
    nodesDir: ['./plugins/', './.nodered/nodes/'],
    // ... другие настройки
}
```

### AI конфигурация
Настройки AI находятся в `.nodered/nodes/copilot-sidebar/ai-config.json`:

```json
{
    "providers": {
        "ollama": {
            "name": "Ollama (192.168.50.250)",
            "models": ["llama3.2:latest", "gpt-oss:20b", "gemma:7b"],
            "default": "gpt-oss:20b",
            "endpoint": "http://192.168.50.250:11434/api/chat"
        }
    },
    "defaultProvider": "ollama",
    "systemPrompt": "Ты эксперт по Node-RED. Анализируй потоки и давай конкретные советы."
}
```

## 📊 Примеры анализа

### Обнаруженные паттерны
- **🌐 HTTP API** - REST API endpoints
- **📡 IoT Sensor** - Обработка данных сенсоров  
- **📊 Dashboard** - Панели мониторинга
- **🤖 Automation** - Автоматизация процессов

### Типичные проблемы
- **Отключенные узлы** - узлы без входящих/исходящих связей
- **Отсутствие обработки ошибок** - нет catch узлов
- **Проблемы безопасности** - HTTP endpoints без аутентификации
- **Проблемы производительности** - много HTTP запросов подряд

### AI рекомендации
- Архитектурные улучшения
- Оптимизация производительности
- Повышение безопасности
- Best practices для Node-RED

## 🔧 Разработка

### Структура проекта
```
node-red-copilot/
├── .nodered/
│   └── nodes/
│       └── copilot-sidebar/          # Основной плагин
│           ├── copilot-sidebar.js    # Серверная логика
│           ├── copilot-sidebar.html  # Клиентский интерфейс
│           └── ai-config.json        # Конфигурация AI
├── plugins/
│   └── copilot-sidebar/              # Дополнительные ресурсы
│       └── resources/
├── settings.js                       # Настройки Node-RED
└── package.json
```

### API Endpoints

#### Анализ потоков
```
GET /copilot-sidebar/analyze?ai=true
GET /copilot-sidebar/analyze?ai=false
```

#### Управление моделями
```
GET /copilot-sidebar/models
POST /copilot-sidebar/models/current
```

#### Чат с AI
```
POST /copilot-sidebar/chat
```

#### История и статистика
```
GET /copilot-sidebar/history
GET /copilot-sidebar/health
```

### Добавление новых провайдеров

1. **Обновите ai-config.json:**
```json
{
    "providers": {
        "your-provider": {
            "name": "Your Provider",
            "models": ["model1", "model2"],
            "default": "model1",
            "endpoint": "https://api.yourprovider.com/v1/chat"
        }
    }
}
```

2. **Добавьте обработчик в copilot-sidebar.js:**
```javascript
async callYourProvider(prompt, model, temperature, maxTokens) {
    // Реализация вызова API
}
```

## 🐛 Устранение неполадок

### Модели не загружаются
1. Проверьте консоль браузера на ошибки JavaScript
2. Убедитесь что API endpoint `/copilot-sidebar/models` работает
3. Перезагрузите страницу Node-RED

### AI анализ не работает
1. Проверьте API ключи в переменных окружения
2. Для Ollama убедитесь что сервер запущен: `ollama serve`
3. Проверьте логи Node-RED в терминале

### Ошибки source maps в Safari
Это нормально - ошибки 404 для `.map` файлов не влияют на работу плагина.

### Copilot не отображается
1. Убедитесь что плагин загружен (проверьте логи)
2. Очистите кэш браузера
3. Проверьте что порт правильный (по умолчанию 1887)

## 📝 История изменений

### v2.0.0 (2025-08-24)
- ✅ Добавлена поддержка множественных AI провайдеров
- ✅ Новый интерфейс с выбором моделей
- ✅ Интерактивный чат с AI
- ✅ Расширенные настройки и пресеты
- ✅ Улучшенный анализ потоков
- ✅ Поддержка Markdown в ответах

### v1.0.0
- ✅ Базовый анализ потоков
- ✅ Обнаружение паттернов
- ✅ Простой интерфейс

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для подробностей.

## 🙏 Благодарности

- **Node-RED** команде за отличную платформу
- **OpenAI**, **Anthropic**, **Google** за AI API
- **Ollama** за локальные модели
- Сообществу Node-RED за поддержку

## 📞 Поддержка

- 🐛 **Issues**: [GitHub Issues](https://github.com/Dmitro1986/node-red-copilot/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Dmitro1986/node-red-copilot/discussions)
- 📧 **Email**: support@node-red-copilot.com

---

**Сделано с ❤️ для сообщества Node-RED**
