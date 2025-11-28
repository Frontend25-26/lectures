#!/usr/bin/env node
/**
 * format-templates.js
 *
 * Форматирует CSS, находящийся внутри <template data-type="css"> … </template>
 * во всех HTML‑файлах, переданных через glob‑шаблоны.
 *
 * Требуемые зависимости:
 *   npm i prettier glob
 */

const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const glob = require('glob');

/* -------------------------------------------------------------- */
/*  Утилиты                                                    */
/* -------------------------------------------------------------- */
function readFile(file) { return fs.readFileSync(file, 'utf8'); }
function writeFile(file, content) { fs.writeFileSync(file, content, 'utf8'); }

/**
 * Форматирует кусок CSS через Prettier.
 * Если Prettier падает – возвращаем оригинал и пишем warning.
 */
function formatCss(css) {
  try {
    // prettier автоматически добавит \n в конец – убираем, иначе будет лишний перевод.
    return prettier.format(css, { parser: 'css' }).trimEnd();
  } catch (e) {
    console.warn('⚠️  Prettier не смог отформатировать CSS: ', e.message);
    return css;
  }
}

/**
 * Вычисляет **минимальный** отступ (в пробелах/табах) среди всех
 * непустых строк. Возвращает строку‑отступ.
 */
function getMinIndent(lines) {
  // Оставляем только строки, где есть хотя‑бы один не‑пробельный символ.
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  if (nonEmpty.length === 0) return '';

  // Находим минимальную длину ведущих пробельных символов.
  const indents = nonEmpty.map(l => {
    const m = l.match(/^([ \t]*)/);
    return m ? m[1].length : 0;
  });
  const min = Math.min(...indents);

  // Считаем, какие именно символы (пробел/таб) образуют этот отступ.
  const exampleLine = nonEmpty.find(l => {
    const m = l.match(/^([ \t]*)/);
    return m && m[1].length === min;
  }) || '';

  const m = exampleLine.match(/^([ \t]*)/);
  return m ? m[1] : '';
}

/* -------------------------------------------------------------- */
/*  Обработчик одного HTML‑файла                                */
/* -------------------------------------------------------------- */
function processFile(filePath) {
  const raw = readFile(filePath);

  // Шаблон ищет любой <template … data-type="css" …> … </template>
  const tmplRegex = /<template\b([^>]*\bdata-type\s*=\s*["']css["'][^>]*)>([\s\S]*?)<\/template>/gi;

  let changed = false;

  const result = raw.replace(tmplRegex, (fullMatch, attrs, inner) => {
    /* inner – всё, что находится между тегами, включая переводные строки */
    const eol = inner.includes('\r\n') ? '\r\n' : '\n'; // запоминаем тип переноса

    const lines = inner.split(eol);

    // 1️⃣  Находим минимальный отступ среди всех строк,
    //     а также индексы первой/последней строки, содержащей реальный код.
    const minIndent = getMinIndent(lines);
    const firstCodeIdx = lines.findIndex(l => l.trim().length > 0);
    const lastCodeIdx = lines.length - 1 - [...lines].reverse()
      .findIndex(l => l.trim().length > 0);

    // Если внутри блока вообще нет кода – ничего не трогаем.
    if (firstCodeIdx === -1) return fullMatch;

    // 2️⃣  Убираем найденный минимальный отступ из **каждой** строки.
    const dedented = lines.map(l => (l.startsWith(minIndent) ? l.slice(minIndent.length) : l));

    // 3️⃣  Срезаем пустые строки в начале/конце, оставляем «чистый» CSS‑текст.
    const cssRaw = dedented.slice(firstCodeIdx, lastCodeIdx + 1).join(eol).trim();

    if (!cssRaw) return fullMatch; // пустой блок

    // 4️⃣  Форматируем.
    const formatted = formatCss(cssRaw);

    // Если Prettier ничего не изменил – оставляем как было.
    if (formatted === cssRaw) return fullMatch;

    // 5️⃣  Добавляем минимальный отступ обратно к каждой строке отформатированного кода.
    const reindented = formatted
      .split('\n')
      .map(l => minIndent + l)
      .join(eol);

    // 6️⃣  Сформируем окончательный блок:
    //    – пустая строка сразу после открывающего тега,
    //    – отформатированный CSS,
    //    – пустая строка перед закрывающим тегом (с тем же базовым отступом).
    const newInner = eol + reindented + eol + minIndent;

    changed = true;
    return `<template${attrs}>${newInner}</template>`;
  });

  if (changed) writeFile(filePath, result);
  return changed;
}

/* -------------------------------------------------------------- */
/*  Основная часть                                               */
/* -------------------------------------------------------------- */
function main() {
  const args = process.argv.slice(2);
  const globs = args.length ? args : ['**/*.html']; // по‑умолчанию – все HTML

  const files = globs
    .map(p => glob.sync(p, { ignore: ['node_modules/**', '**/dist/**'] }))
    .flat()
    .filter((v, i, a) => a.indexOf(v) === i); // уникальные

  if (!files.length) {
    console.log('🔎  Файлы не найдены по шаблону:', globs.join(', '));
    return;
  }

  let changedCount = 0;
  files.forEach(f => {
    const abs = path.resolve(f);
    try {
      if (processFile(abs)) {
        console.log('✅  Отформатирован:', abs);
        changedCount++;
      }
    } catch (e) {
      console.error('❌  Ошибка обработки', abs, e);
    }
  });

  console.log(`\n🟢  Готово. Файлов изменено: ${changedCount} / ${files.length}`);
}

/* -------------------------------------------------------------- */
if (require.main === module) main();