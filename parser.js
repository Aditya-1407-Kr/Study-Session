// ===== PARSER.JS =====
// Smart syllabus text parser: detects modules and topics

/**
 * Parse raw syllabus text into structured {modules: [{name, title, topics:[]}]}
 */
export function parseSyllabus(text) {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const modules = [];
  let currentModule = null;

  // Roman numeral map
  const romanMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };

  // Patterns for module detection
  const modulePatterns = [
    // "Module I: Title" or "Module I - Title" or "UNIT I: Title"
    /^(?:module|unit|section|chapter|part)\s+([IVXLCDM]+|\d+)[:\s\-–—]\s*(.+)/i,
    // "Module I" alone
    /^(?:module|unit|section|chapter|part)\s+([IVXLCDM]+|\d+)\s*$/i,
    // "I. Title" or "I) Title" at start of line with Roman numerals
    /^([IVXLCDM]{1,5})[.)]\s+(.+)/,
  ];

  // Patterns for numbered list items (topics)
  const topicPatterns = [
    /^\d+[.)]\s+(.+)/,          // "1. Topic" or "1) Topic"
    /^[a-z][.)]\s+(.+)/i,       // "a. Topic"
    /^[-•*◦▪]\s+(.+)/,          // Bullet points
    /^\s{2,}(.+)/,               // Indented lines
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let isModule = false;

    // Test module patterns
    for (const pattern of modulePatterns) {
      const match = line.match(pattern);
      if (match) {
        const numStr = match[1]?.toUpperCase() || '';
        const num = romanMap[numStr] || parseInt(numStr) || (modules.length + 1);
        const title = match[2]?.trim() || '';

        // Generate module name like "Module I", "Module II"
        const romanNumerals = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
        const moduleName = `Module ${romanNumerals[num - 1] || num}`;

        currentModule = { name: moduleName, title: title || moduleName, topics: [] };
        modules.push(currentModule);
        isModule = true;
        break;
      }
    }

    if (isModule) continue;

    // If we have no module yet, create a default one
    if (!currentModule) {
      // Check if it looks like a standalone heading (short, no punctuation at end)
      if (line.length < 60 && !line.match(/[,;]$/) && line.match(/^[A-Z]/)) {
        currentModule = { name: 'Module I', title: line, topics: [] };
        modules.push(currentModule);
        continue;
      }
      currentModule = { name: 'Module I', title: 'General Topics', topics: [] };
      modules.push(currentModule);
    }

    // Test topic patterns
    let topicText = null;
    for (const pattern of topicPatterns) {
      const match = line.match(pattern);
      if (match) {
        topicText = match[1]?.trim() || match[0]?.trim();
        break;
      }
    }

    // If no pattern matched but we're inside a module, treat non-empty lines as topics
    if (!topicText && line.length > 2 && !line.match(/^[-=]{3,}$/)) {
      topicText = line;
    }

    if (topicText && currentModule) {
      // Clean up the topic text
      topicText = topicText
        .replace(/[,;]\s*$/, '') // remove trailing commas/semicolons
        .replace(/\s+/g, ' ')
        .trim();

      if (topicText.length > 2 && !currentModule.topics.find(t => t === topicText)) {
        currentModule.topics.push(topicText);
      }
    }
  }

  // If we have a module with no topics, it might be a title-only line; clean up
  return modules.filter(m => m.topics.length > 0 || m.title);
}

/**
 * Generate HTML preview of parsed result
 */
export function renderParserPreview(parsed) {
  if (!parsed.length) {
    return '<p class="text-muted" style="text-align:center;padding:20px;">No structure detected. Try pasting a syllabus with Module headings.</p>';
  }

  return parsed.map(mod => `
    <div class="parser-module">
      <div class="parser-module-name">📂 ${mod.name}: ${mod.title}</div>
      ${mod.topics.map(t => `<div class="parser-topic">• ${t}</div>`).join('')}
      ${mod.topics.length === 0 ? '<div class="parser-topic text-muted"><em>No topics detected in this module</em></div>' : ''}
    </div>
  `).join('');
}

/**
 * Count total items in parsed result
 */
export function parsedStats(parsed) {
  return {
    modules: parsed.length,
    topics: parsed.reduce((sum, m) => sum + m.topics.length, 0)
  };
}
