// utils/markdownParser.js
import hljs from 'highlight.js';

function applyInlineStyles(text) {
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');
  return text;
}

export function parseMarkdown(content) {
  if (!content) return '';

  const lines = content.split('\n');
  let html = '';
  let inCodeBlock = false;
  let inTable = false;
  let inList = false;
  let inChecklist = false;
  let inQuote = false;
  let codeBlockLines = [];
  let codeLanguage = '';

  lines.forEach((line) => {
    if (!line.trim() && !inCodeBlock) {
      if (inList) html += '</ul>';
      if (inChecklist) html += '</ul>';
      if (inQuote) html += '</blockquote>';
      inList = false;
      inChecklist = false;
      inQuote = false;
      return;
    }

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        const code = codeBlockLines.join('\n');
        const highlightedCode = codeLanguage
          ? hljs.highlight(code, { language: codeLanguage }).value
          : hljs.highlightAuto(code).value;
        html += `<pre><code class="hljs">${highlightedCode}</code></pre>`;
        inCodeBlock = false;
        codeBlockLines = [];
        codeLanguage = '';
      } else {
        const language = line.trim().slice(3).trim();
        codeLanguage = language || '';
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    if (line.trim().startsWith('|')) {
      if (!inTable) {
        html += '<table><thead><tr>';
        const headers = line.split('|').map(h => h.trim()).filter(h => h);
        headers.forEach(header => {
          html += `<th>${applyInlineStyles(header)}</th>`;
        });
        html += '</tr></thead><tbody>';
        inTable = true;
      } else if (line.trim().match(/^\|[-|\s:]+$/)) {
        return;
      } else {
        html += '<tr>';
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        cells.forEach(cell => {
          html += `<td>${applyInlineStyles(cell)}</td>`;
        });
        html += '</tr>';
      }
      return;
    } else if (inTable) {
      html += '</tbody></table>';
      inTable = false;
    }

    if (line.trim() === '---') {
      html += '<hr>';
      return;
    }

    if (line.trim().startsWith('>')) {
      if (!inQuote) {
        html += '<blockquote>';
        inQuote = true;
      }
      let text = line.slice(1).trim();
      text = applyInlineStyles(text);
      html += `<p>${text}</p>`;
      return;
    } else if (inQuote) {
      html += '</blockquote>';
      inQuote = false;
    }

    if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
      if (!inChecklist) {
        html += '<ul>';
        inChecklist = true;
      }
      const isChecked = line.trim().startsWith('- [x]');
      const text = applyInlineStyles(line.slice(5).trim());
      html += `<li><input type="checkbox" ${isChecked ? 'checked' : ''} disabled> ${text}</li>`;
      return;
    } else if (inChecklist) {
      html += '</ul>';
      inChecklist = false;
    }

    if (line.trim().startsWith('- ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      const text = applyInlineStyles(line.slice(2).trim());
      html += `<li>${text}</li>`;
      return;
    } else if (inList) {
      html += '</ul>';
      inList = false;
    }

    if (line.startsWith('###')) {
      html += `<h3>${applyInlineStyles(line.slice(3).trim())}</h3>`;
    } else if (line.startsWith('##')) {
      html += `<h2>${applyInlineStyles(line.slice(2).trim())}</h2>`;
    } else if (line.startsWith('#')) {
      html += `<h1>${applyInlineStyles(line.slice(1).trim())}</h1>`;
    } else if (line.trim()) {
      let text = applyInlineStyles(line.trim());
      html += `<p>${text}</p>`;
    }
  });

  if (inCodeBlock) {
    const code = codeBlockLines.join('\n');
    const highlightedCode = codeLanguage
      ? hljs.highlight(code, { language: codeLanguage }).value
      : hljs.highlightAuto(code).value;
    html += `<pre><code class="hljs">${highlightedCode}</code></pre>`;
  }
  if (inTable) html += '</tbody></table>';
  if (inList) html += '</ul>';
  if (inChecklist) html += '</ul>';
  if (inQuote) html += '</blockquote>';

  return html;
}