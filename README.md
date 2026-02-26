# Курс "Фронтенд-разработка" (ИТМО 2025–2026)

Материалы курса по фронтенд-разработке для студентов ИТМО.
Здесь собраны **лекции, домашние задания, квизы и результаты**, которые автоматически отображаются на сайте курса.

Сайт — статический, деплоится на Vercel. Никакого билда не требуется.

---

## Структура проекта

```
/
├── index.html            # Главная страница курса
├── homeworks.html        # Страница со всеми ДЗ
├── results.html          # Страница с результатами студентов
├── exam.html             # Экзаменационная страница
├── style.css             # Основные стили
├── utils/                # Reveal.js + вспомогательные скрипты
│
├── 1-sem/                # Первый семестр
│   ├── lectures.json     # Данные лекций первого семестра
│   ├── html/             # Блок "Верстка"
│   │   ├── ...
│   ├── js/               # Блок "JavaScript"
│   │   ├── ...
│   ├── design/           # Блок "Дизайн"
│   │   ├── ...
│   └── mini-lectures/    # Доклады
│       ├── ...
│
└── 2-sem/                # Второй семестр
    ├── lectures.json     # Данные лекций второго семестра
    ├── mini-lectures.json
    ├── mini-lectures.html
    ├── hackathons.html
    ├── modern/           # Блок "Современный Frontend"
    │   └── ...
    └── infra/            # Блок "Инфраструктура"
        └── ...
```

---

## Файл `lectures.json`

Каждый семестр имеет свой файл `lectures.json` (`1-sem/lectures.json`, `2-sem/lectures.json`).
Это основной источник данных — страницы читают его в рантайме и рендерят контент.
Лекция появляется на сайте автоматически, когда наступает её `openDate`.

### Структура файла

```json
{
  "courses": [
    {
      "name": "Верстка",
      "lectures": [
        {
          "title": "Основы HTML",
          "link": "/1-sem/html/1-html/index.html",
          "openDate": "2025-09-27T10:00:00",
          "order": 1,
          "homework": "https://classroom.github.com/a/PtV9F7qh",
          "homeworkDate": "2025-10-12T23:59:59"
        }
      ]
    }
  ]
}
```

### Поля лекции

| Поле | Обязательное | Описание |
|---|---|---|
| `title` | да | Название лекции |
| `link` | да | Путь к HTML-файлу или внешняя ссылка |
| `openDate` | да | Дата и время открытия (ISO: `YYYY-MM-DDTHH:mm:ss`) |
| `order` | да | Порядковый номер для сортировки |
| `homework` | нет | Ссылка на GitHub Classroom или квиз |
| `homeworkDate` | нет | Дедлайн ДЗ (по умолчанию — две недели после лекции) |
| `homework_text` | нет | Текст вместо ссылки на ДЗ (для квизов и устных заданий) |

---

## Как добавить лекцию

### Лекция без ДЗ

1. Создай папку с HTML-файлом лекции, например `1-sem/js/5-async-1/index.html`.
2. В `1-sem/lectures.json` найди нужный курс и добавь объект в массив `lectures`:

```json
{
  "title": "Асинхронность part. 1",
  "link": "/1-sem/js/5-async-1/index.html",
  "openDate": "2025-10-25T13:00:00",
  "order": 5
}
```

### Лекция с домашним заданием (GitHub Classroom)

```json
{
  "title": "DOM и события",
  "link": "/1-sem/js/8-document/index.html",
  "openDate": "2025-11-22T11:00:00",
  "order": 8,
  "homework": "https://classroom.github.com/a/a1b2c3d4",
  "homeworkDate": "2025-12-08T23:59:59"
}
```

После этого домашка появится на странице `homeworks.html` с кнопкой перехода на GitHub Classroom.

### Лекция с квизом или устным заданием

Если вместо GitHub Classroom используется квиз, заполни `homework_text` (текст-описание) и `homework` (ссылка на квиз):

```json
{
  "title": "Типы данных part. 1",
  "link": "/1-sem/js/1-types-1/index.html",
  "openDate": "2025-09-27T12:30:00",
  "order": 1,
  "homework_text": "Квиз на лекции 04 октября 2025 г.",
  "homeworkDate": "2025-10-04T12:30:00",
  "homework": "https://play.myquiz.ru/p/00875481"
}
```

### Обновление дедлайна или ссылки на ДЗ

Найди лекцию в `lectures.json` и измени `homework` (ссылка) или `homeworkDate` (дедлайн).

### Добавление нового курса в семестр

Добавь объект в массив `courses`:

```json
{
  "name": "Название курса",
  "lectures": [ ... ]
}
```

---

## Как создать лекцию (презентацию)

Каждая лекция — самостоятельный HTML-файл на базе reveal.js.

### Структура папки лекции

```
lectures/<sem>/<course>/<N-topic>/
├── index.html          ← презентация на reveal.js
├── css-custom/
│   ├── custom.css      ← шрифты + компоненты слайдов
│   └── fonts/          ← Textbook + Yandex Sans Display (.woff/.ttf)
└── img/                ← изображения для слайдов
```

**Быстрый старт:** скопируй `css-custom/` из любой существующей лекции — папка с шрифтами идентична во всех лекциях.

### Шаблон `index.html`

```html
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <title>Название лекции</title>
    <meta name="author" content="Имя лектора">
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimal-ui">
    <link rel="stylesheet" href="/utils/css/reveal.css">
    <link rel="stylesheet" href="/utils/lib/css/animate.css">
    <link rel="stylesheet" href="/utils/css/theme/night.css" id="theme">
    <link rel="stylesheet" href="/utils/lib/css/zenburn.css">
    <link rel="stylesheet" href="css-custom/custom.css">
    <script>
        var link = document.createElement('link');
        link.rel = 'stylesheet'; link.type = 'text/css';
        link.href = window.location.search.match(/print-pdf/gi) ? 'css/print/pdf.css' : 'css/print/paper.css';
        document.getElementsByTagName('head')[0].appendChild(link);
    </script>
</head>
<body>
<div class="reveal"><div class="slides">
    <!-- слайды -->
</div></div>
<script src="/utils/lib/js/head.min.js"></script>
<script src="/utils/js/reveal.js"></script>
<script src="https://yastatic.net/jquery/2.1.4/jquery.min.js"></script>
<script src="/utils/lib/js/code-example.js"></script>
<script>
    Reveal.initialize({
        controls: false, progress: true, history: true, center: false,
        transition: 'slide',
        dependencies: [
            { src: '/utils/lib/js/classList.js', condition: function() { return !document.body.classList; } },
            { src: '/utils/plugin/markdown/marked.js', condition: function() { return !!document.querySelector('[data-markdown]'); } },
            { src: '/utils/plugin/markdown/markdown.js', condition: function() { return !!document.querySelector('[data-markdown]'); } },
            { src: '/utils/plugin/highlight/highlight.js', async: true, condition: function() { return !!document.querySelector('pre code'); }, callback: function() { hljs.initHighlightingOnLoad(); } },
            { src: '/utils/plugin/zoom-js/zoom.js', async: true },
            { src: '/utils/plugin/notes/notes.js', async: true }
        ]
    });
    Reveal.configure({ slideNumber: true });
</script>
</body>
</html>
```

### Типы слайдов

| Тип | Шаблон |
|---|---|
| Раздел на фоне | `<section data-background-image="img/bg.jpg"><h1 style="text-shadow: #000 3px 2px 2px;">Текст</h1></section>` |
| Плюсы/минусы | `<ul class="opinion"><li class="plus fragment">...</li><li class="minus fragment">...</li></ul>` |
| Сравнение двух подходов | `.compare` > `.compare-block` (2-column grid) |
| Простой код | `<pre class="[html\|css\|javascript] size-l code-example-one"><code>...</code></pre>` |
| HTML + CSS вместе | `<code-example [fragment] [no-preview]><template data-type="html">...</template><template data-type="css">...</template></code-example>` |
| Грид инструментов | `.tools-list` > `.tool-block` |
| Временная шкала | `.timeline` > `.timeline-item` > `.timeline-label` + `.timeline-arrow` + `.timeline-desc` |
| Схема архитектуры | `.arch-flow` > `.arch-box[.highlight]` + `.arch-arrow` |
| Слайды в формате MD | `<section data-markdown data-separator="---"><script type="text/template">...markdown...</script></section>` |

CSS-компоненты (`custom.css`): `.opinion`, `.compare`/`.compare-block`, `.tools-list`/`.tool-block`, `.timeline`/`.timeline-item`, `.arch-flow`/`.arch-box`, `.wrapper`, `.iframe-container`.

---

## Команды

```bash
# Форматировать CSS внутри <template data-type="css"> в HTML-файлах
npm run format
```

---

## Полезные советы

- Не меняй порядок лекций вручную — для этого есть поле `order`.
- Не удаляй старые лекции — они остаются в архиве.
- Даты всегда пиши в ISO-формате: `YYYY-MM-DDTHH:mm:ss`.
- Если лекция не появляется — проверь: корректность JSON (лишние запятые, кавычки), наступила ли дата `openDate`, правильный ли путь в `link`, есть ли поле `order`.
