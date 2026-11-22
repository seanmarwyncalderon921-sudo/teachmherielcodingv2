/* Edit these notes and real-life coupons. reqType can be lessons, streak, or xp. */
const LOVE_MILESTONES = [
  { id: 'first-lesson', reqType: 'lessons', threshold: 1, title: 'Your first lesson', note: 'You made room for something new today. That counts.', reward: 'A long hug' },
  { id: 'streak-3', reqType: 'streak', threshold: 3, title: 'Three little days', note: 'A little practice is adding up. Sean noticed.', reward: 'Milk tea together' },
  { id: 'xp-100', reqType: 'xp', threshold: 100, title: '100 Love XP', note: 'Look how far those small steps have taken you.', reward: 'Pick a cozy café' },
  { id: 'lessons-10', reqType: 'lessons', threshold: 10, title: 'Ten lessons down', note: 'You kept showing up for yourself.', reward: 'Choose our movie night' },
  { id: 'track-first', reqType: 'lessons', threshold: 5, title: 'Five lessons down', note: 'You followed an idea all the way through.', reward: 'A date of your choice' }
];

/* The five starter lessons above are hand-authored. These plain-data builders
   expand each track to a complete 10-unit curriculum. They emit only
   JSON-serializable lesson records; grading remains in the shared runner. */
const CURRICULUM = {
  html: {
    unit: ['Text & structure', 'Links & media', 'Lists & tables', 'Forms', 'Semantic pages', 'Accessible patterns', 'Embedded content', 'Page metadata', 'Reusable components', 'Small projects'],
    topics: ['Semantic landmarks', 'Headings in order', 'Emphasis and quotations', 'Description lists', 'Table captions', 'Table headers', 'Form labels', 'Required fields', 'Select menus', 'Button types', 'Details and summary', 'Figure captions', 'Audio controls', 'Video captions', 'Responsive images', 'Navigation menus', 'Article structure', 'Time and dates', 'Accessible names', 'Page language', 'Document title', 'Meta description', 'Data attributes', 'Custom data', 'Skip links', 'Field groups', 'Radio choices', 'Checkbox choices', 'Textarea fields', 'Input hints', 'Autocomplete', 'Form validation', 'Download links', 'Email links', 'Telephone links', 'External links', 'Ordered lists', 'Nested lists', 'Table footers', 'Column groups', 'Progress meter', 'Disclosure widgets', 'Search forms', 'Status messages', 'Image alternatives', 'Decorative images', 'SVG images', 'Iframe titles', 'Source order', 'Page sections', 'Reusable cards', 'Breadcrumbs', 'Dialogs', 'Accessible buttons', 'Language changes', 'Ruby annotations', 'Code samples', 'Keyboard focus', 'Landmark labels', 'Contact information', 'Address elements', 'Citations', 'Abbreviations', 'Marking changes', 'Meter values', 'Output elements', 'Form actions', 'Hidden labels', 'Heading levels', 'Main content', 'Footer content', 'Header content', 'Navigation links', 'List descriptions', 'Table scope', 'Cell spanning', 'Form grouping', 'Input types', 'Date inputs', 'Range inputs', 'Color inputs', 'File inputs', 'Image maps', 'Object fallback', 'Template elements', 'Slot basics', 'Web components', 'Print structure', 'Microdata basics', 'Open Graph basics', 'Favicon links', 'Preload hints', 'Base URLs', 'Noscript content', 'Landmark review', 'Page outline', 'Portfolio page', 'Recipe page', 'Profile page', 'Final page review']
  },
  css: {
    unit: ['Color & type', 'Spacing & borders', 'Selectors', 'Flexbox', 'Grid', 'Responsive design', 'States & motion', 'Layout patterns', 'Polish', 'Small projects'],
    topics: ['CSS variables', 'Color contrast', 'HSL colors', 'Font stacks', 'Line height', 'Font weight', 'Text decoration', 'Text wrapping', 'Box sizing', 'Logical properties', 'Border styles', 'Outline styles', 'Shadow restraint', 'Opacity', 'Attribute selectors', 'Child selectors', 'Sibling selectors', 'Pseudo classes', 'Pseudo elements', 'Specificity', 'Cascade layers', 'Inheritance', 'Flex direction', 'Flex wrapping', 'Flex alignment', 'Flex growth', 'Order and gaps', 'Grid columns', 'Grid rows', 'Grid gaps', 'Grid areas', 'Auto placement', 'Minmax sizing', 'Responsive units', 'Media queries', 'Container queries', 'Fluid type', 'Viewport units', 'Aspect ratio', 'Object fit', 'Position relative', 'Position sticky', 'Stacking order', 'Overflow control', 'Scroll behavior', 'Focus-visible', 'Hover states', 'Disabled states', 'Transitions', 'Reduced motion', 'Transforms', 'Keyframe basics', 'Print styles', 'Dark color scheme', 'Light color scheme', 'Form styling', 'Button states', 'Placeholder color', 'Selection styling', 'List markers', 'Counters', 'Nested variables', 'Fallback values', 'Custom properties', 'Clamp sizing', 'Fit-content', 'Intrinsic sizing', 'Text columns', 'Word breaking', 'Hyphenation', 'RTL direction', 'Writing modes', 'Grid alignment', 'Subgrid idea', 'Flex basis', 'Auto margins', 'Sticky headers', 'Centered layouts', 'Card layouts', 'Navigation bars', 'Split panes', 'Safe areas', 'Touch targets', 'Scrollbar styling', 'Backdrop filters', 'Blend modes', 'Clip paths', 'Masks overview', 'CSS nesting', 'Selector functions', ':is and :where', ':not selectors', 'Has selector', 'Supports queries', 'Layer ordering', 'Specificity review', 'Responsive card', 'Profile layout', 'Accessible form', 'Final style review']
  },
  javascript: {
    unit: ['Values & variables', 'Choices & loops', 'Arrays & objects', 'Functions', 'DOM basics', 'Events', 'Async work', 'Data handling', 'Browser APIs', 'Small projects'],
    topics: ['let and reassignment', 'Primitive values', 'Template literals', 'Number conversion', 'String methods', 'Boolean logic', 'Comparison operators', 'Truthy values', 'Nullish values', 'Default parameters', 'Ternary expressions', 'Switch statements', 'While loops', 'Break and continue', 'Array creation', 'Array indexing', 'Array methods', 'Map arrays', 'Filter arrays', 'Reduce arrays', 'Object properties', 'Object shorthand', 'Nested objects', 'Destructuring', 'Spread syntax', 'Rest parameters', 'Function returns', 'Arrow functions', 'Scope basics', 'Closures overview', 'Callbacks', 'Errors and try', 'Throwing errors', 'JSON parsing', 'JSON stringifying', 'Query selectors', 'Text content', 'Class lists', 'Create elements', 'Append children', 'Remove elements', 'Event listeners', 'Event targets', 'Form submit', 'Input values', 'Keyboard events', 'Event delegation', 'Timers', 'Promise basics', 'Async functions', 'Fetch requests', 'Response parsing', 'Await and errors', 'Local storage', 'Session storage', 'URL parameters', 'Date formatting', 'Math helpers', 'Regular expressions', 'Set collections', 'Map collections', 'Optional chaining', 'Nullish coalescing', 'Modules overview', 'Import and export', 'Default exports', 'Sorting arrays', 'Finding values', 'Some and every', 'Flat arrays', 'Copying objects', 'Immutable updates', 'Object entries', 'Object keys', 'String includes', 'Slice and substring', 'Number formatting', 'Intl basics', 'Document ready', 'Accessibility updates', 'Focus management', 'Debouncing', 'Throttling overview', 'Clipboard API', 'Intersection observer', 'Media queries API', 'Custom events', 'Abort controller', 'Promise all', 'Promise race', 'Error messages', 'Guard clauses', 'Pure functions', 'Testing ideas', 'Data validation', 'Safe DOM text', 'Reusable renderer', 'Small counter', 'Filtered list', 'Form feedback', 'Final browser project']
  },
  json: {
    unit: ['JSON shape', 'Strings & numbers', 'Objects', 'Arrays', 'Nested data', 'Validation', 'Applications', 'Interchange', 'Careful editing', 'Small projects'],
    topics: ['Object keys', 'String values', 'Number values', 'Boolean values', 'Null values', 'Array values', 'Nested objects', 'Nested arrays', 'Whitespace rules', 'Quoted keys', 'Escape characters', 'Unicode escapes', 'Decimal numbers', 'Negative numbers', 'Exponent notation', 'Empty objects', 'Empty arrays', 'Array ordering', 'Duplicate keys', 'Trailing commas', 'Comments are invalid', 'Root values', 'Property lookup', 'Array indexing', 'Mixed arrays', 'Object collections', 'Consistent records', 'Optional properties', 'Required properties', 'Type checking', 'Schema idea', 'Enum values', 'Minimum lengths', 'Maximum lengths', 'Numeric bounds', 'Unique items', 'Nested validation', 'Error locations', 'Parse errors', 'Stringify output', 'Pretty printing', 'Compact output', 'Escaped newlines', 'Slash characters', 'Date strings', 'ISO timestamps', 'URL strings', 'Email strings', 'ID fields', 'Configuration files', 'API responses', 'Request payloads', 'Localization data', 'Product records', 'Profile records', 'Settings records', 'Feature flags', 'Pagination data', 'Error objects', 'Status fields', 'Metadata fields', 'Map-like objects', 'Array of objects', 'Filtering records', 'Sorting records', 'Optional nulls', 'Empty values', 'Safe parsing', 'Parse fallback', 'Reviver overview', 'Replacer overview', 'Deep nesting', 'Data normalization', 'Schema versions', 'Backward compatibility', 'Forward compatibility', 'JSON Lines', 'NDJSON basics', 'Unicode text', 'Large integers', 'Precision limits', 'Boolean checks', 'Null checks', 'Array checks', 'Object checks', 'Key existence', 'Unknown fields', 'Sensitive values', 'Input validation', 'Response validation', 'Config review', 'Syntax review', 'Recipe data', 'Reading list data', 'Quiz data', 'Theme settings', 'Final data review']
  },
  python: {
    unit: ['Values & output', 'Choices & loops', 'Collections', 'Functions', 'Strings & files', 'Errors', 'Modules', 'Data patterns', 'Python tools', 'Small projects'],
    topics: ['Integer values', 'Float values', 'Boolean values', 'None values', 'Variable updates', 'Naming conventions', 'String methods', 'String slicing', 'f-string formatting', 'Rounding numbers', 'Comparison operators', 'and or not', 'Membership checks', 'if expressions', 'Nested conditions', 'for range loops', 'while loops', 'Loop control', 'Enumerate items', 'Zip collections', 'List creation', 'List indexing', 'List slicing', 'List methods', 'List comprehensions', 'Tuple values', 'Set values', 'Dictionary values', 'Dictionary lookup', 'Dictionary methods', 'Nested dictionaries', 'Unpacking values', 'Function arguments', 'Default arguments', 'Keyword arguments', 'Return values', 'Local scope', 'Docstrings', 'Lambda overview', 'Sorting with key', 'Any and all', 'Sum and min', 'Enumerate dictionaries', 'String splitting', 'String joining', 'Strip whitespace', 'Format specifications', 'Path objects', 'Read text files', 'Write text files', 'With statements', 'CSV overview', 'JSON module', 'Exception handling', 'Specific exceptions', 'Raise exceptions', 'Finally blocks', 'Assertions', 'Import modules', 'Standard library', 'Random module', 'Math module', 'Datetime module', 'Counter collection', 'Defaultdict', 'Iterators', 'Generators', 'Yield values', 'Type hints', 'Optional types', 'Dataclasses', 'Class basics', 'Instance methods', 'Class attributes', 'Inheritance idea', 'Properties', 'Special methods', 'Context managers', 'Comprehension review', 'Argument unpacking', 'Keyword unpacking', 'Recursive functions', 'Big O intuition', 'Testing with assert', 'Unit test idea', 'Debug print', 'Traceback reading', 'Virtual environments', 'Package imports', 'Command line args', 'Environment values', 'Safe input', 'Input validation', 'Text report', 'Score calculator', 'Shopping list', 'Word counter', 'Final Python project']
  }
};

function buildCurriculum() {
for (const track of TRACKS) {
  const curriculum = CURRICULUM[track.id];
  for (let lessonNumber = track.lessons.length + 1; lessonNumber <= 100; lessonNumber += 1) {
    const topic = curriculum.topics[lessonNumber - 6];
    const unitNumber = Math.ceil(lessonNumber / 10);
    const sample = track.id === 'html'
      ? { snippet: `<section>\n  <h2>${topic}</h2>\n  <p>A useful detail.</p>\n</section>`, blank: 'section', chips: ['section', 'span', 'div'], starter: '<main>\n\n</main>', rule: { kind: 'html', checks: [{ selector: 'h2', property: 'text', test: 'nonempty' }] }, output: '' }
      : track.id === 'css'
        ? { snippet: `.note {\n  color: #db2777;\n  padding: 12px;\n}`, blank: 'color', chips: ['color', 'src', 'href'], starter: '.note {\n\n}', rule: { kind: 'css', checks: [{ selector: '.note', property: 'color', test: 'notempty' }] }, output: '' }
        : track.id === 'javascript'
          ? { snippet: `const topic = "${topic}";\nconsole.log(topic);`, blank: 'const', chips: ['const', 'print', 'style'], starter: '', rule: { kind: 'js', sourceIncludes: ['console.log'], outputIncludes: [topic] }, output: topic }
          : track.id === 'json'
            ? { snippet: `{\n  "topic": "${topic}",\n  "ready": true\n}`, blank: '"topic"', chips: ['"topic"', 'topic', 'topic:'], starter: '{}', rule: { kind: 'json', checks: [{ path: 'topic', test: 'type', value: 'string' }, { path: 'ready', test: 'equals', value: true }] }, output: '' }
            : { snippet: `topic = "${topic}"\nprint(topic)`, blank: 'print', chips: ['print', 'echo', 'show'], starter: '', rule: { kind: 'python', sourceIncludes: ['print('], outputIncludes: [topic] }, output: topic };
    track.lessons.push({
      id: `${track.id}-${lessonNumber}`,
      number: lessonNumber,
      unit: unitNumber,
      title: topic,
      steps: [
        { type: 'concept', title: `A closer look at ${topic}`, text: `This lesson explores ${topic}. Read the example, then try a small version of the same idea.`, code: sample.snippet, takeaway: `Practice ${topic} in one small, clear example.`, sean: 'One small idea at a time.' },
        { type: 'fill_blank', title: `Recognize ${topic}`, prompt: `Choose the token used in this ${track.name} example.`, parts: track.id === 'html' ? ['<', { blank: 0 }, '>content</', { blank: 1 }, '>'] : track.id === 'css' ? ['.note { ', { blank: 0 }, ': #db2777; }'] : track.id === 'javascript' ? ['const topic = ', { blank: 0 }, ';\nconsole.log(topic);'] : track.id === 'json' ? ['{ ', { blank: 0 }, ': "Mheriel", "ready": true }'] : ['topic = "Mheriel"\n', { blank: 0 }, '(topic)'], answers: track.id === 'html' ? ['section', 'section'] : track.id === 'javascript' ? [`"${topic}"`] : [sample.blank], chips: track.id === 'html' ? ['section', 'span', 'section', 'div'] : track.id === 'javascript' ? [`"${topic}"`, '"Mheriel"', 'topic'] : [...sample.chips] },
        { type: 'reorder', title: 'Put the example together', prompt: 'Tap the lines in the order they belong.', lines: track.id === 'html' ? ['</section>', '<h2>Topic</h2>', '<section>'] : track.id === 'css' ? ['}', '  color: #db2777;', '.note {'] : track.id === 'javascript' ? ['console.log(topic);', `const topic = "${topic}";`] : track.id === 'json' ? ['}', `  "topic": "${topic}"`, '{'] : [`print(topic)`, `topic = "${topic}"`], solution: track.id === 'html' || track.id === 'css' || track.id === 'json' ? [2, 1, 0] : [1, 0] },
        { type: 'code_challenge', title: `Try ${topic}`, prompt: track.id === 'html' ? `Add an h2 element to practice ${topic}.` : track.id === 'css' ? `Add a color declaration to practice ${topic}.` : track.id === 'javascript' ? `Log the text “${topic}” to practice ${topic}.` : track.id === 'json' ? `Create valid JSON with a topic string and ready boolean.` : `Print the text “${topic}” to practice ${topic}.`, language: track.id, starter: sample.starter, rule: sample.rule, success: `You practiced ${topic}. Nice work.`, retryHint: `Try a small example of ${topic}.` }
      ]
    });
  }
}

for (const track of TRACKS) {
  for (let index = 0; index < track.lessons.length; index += 1) {
    track.lessons[index].number = index + 1;
    track.lessons[index].unit = Math.floor(index / 10) + 1;
  }
}
}

function pillTokenKind(text) {
  const value = String(text || '').trim();
  if (/^(const|let|var|def|function|if|else|elif|for|while|return|print|console\.log)\b/.test(value)) return 'fn';
  if (/^[A-Za-z_$][\w$]*\s*=/.test(value) || /^(const|let|var|def)\b/.test(value)) return 'var';
  if (/^(true|false|null|undefined|[-+]?\d+(?:\.\d+)?|["'`])/.test(value) || /["'`]$/.test(value)) return 'val';
  if (/^[{}()[\],.;:+*/<>=-]/.test(value) || /[{}()[\],.;:+*/<>=-]$/.test(value)) return 'op';
  return 'blank';
}

function normalizePillChallenges() {
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      for (const step of lesson.steps) {
        if (step.type !== 'reorder') continue;
        const sourceLines = Array.isArray(step.lines) ? step.lines : [];
        step.type = 'pill_challenge';
        step.lines = sourceLines.map((text, index) => ({ kind: pillTokenKind(text), text: String(text), index }));
        step.answers = Array.isArray(step.solution) ? [...step.solution] : sourceLines.map((_, index) => index);
        step.chips = step.lines.map(line => ({ text: line.text, index: line.index }));
        step.why = step.why || `The order matters because each token builds on the one before it. This sequence makes the ${track.name} example readable and runnable.`;
        delete step.solution;
      }
    }
  }
}

const TRACKS = [
  {
    id: 'html', name: 'HTML', icon: '◇', tagline: 'Shape a page', description: 'Headings, links, pictures, lists, and useful little controls.',
    lessons: [
      {
        id: 'html-1', title: 'Headings & paragraphs', steps: [
          { type: 'concept', title: 'Give a page a start', text: 'A heading gives the page a title. A paragraph holds a little more to say.', code: '<h1>For Mheriel</h1>\n<p>A little note.</p>', takeaway: 'Use headings for structure, then add a paragraph.', sean: 'A good page can start small.' },
          { type: 'fill_blank', title: 'Choose a heading', prompt: 'Pick the tag for the main heading.', parts: ['<', { blank: 0 }, '>Mheriel</', { blank: 1 }, '>'], answers: ['h1', 'h1'], chips: ['h1', 'p', 'h1', 'div'] },
          { type: 'reorder', title: 'Put it in order', prompt: 'Build the heading and its paragraph.', lines: ['</p>', '</h1>', '<p>A little note.', '<h1>For Mheriel'], solution: [3, 1, 2, 0] },
          { type: 'code_challenge', title: 'Try it yourself', prompt: 'Add an h1 and, if you like, a short paragraph too.', language: 'html', starter: '<main>\n\n</main>', rule: { kind: 'html', minChecks: 1, checks: [{ selector: 'h1', property: 'text', test: 'nonempty' }, { selector: 'p', property: 'text', test: 'nonempty' }] }, success: 'A clear heading is in place. Nice work.', retryHint: 'Add a heading or a short paragraph to keep going.' }
        ]
      },
      {
        id: 'html-2', title: 'Links & new tabs', steps: [
          { type: 'concept', title: 'Give a link somewhere to go', text: 'An anchor makes words clickable. Its href holds the address; target can open it in a new tab.', code: '<a href="https://example.com" target="_blank" rel="noopener">Visit</a>', takeaway: 'Use clear link text and a real address.', sean: 'A link is just a door with a label.' },
          { type: 'fill_blank', title: 'Add the address', prompt: 'Which attribute holds the link address?', parts: ['<a ', { blank: 0 }, '="https://example.com">Visit</a>'], answers: ['href'], chips: ['href', 'src', 'alt'] },
          { type: 'reorder', title: 'Put the link inside its paragraph', prompt: 'Tap each line in the order it belongs.', lines: ['</p>', '</a>', 'Visit a page', '<a href="https://example.com" target="_blank">', '<p>'], solution: [4, 3, 2, 1, 0] },
          { type: 'code_challenge', title: 'Make a link', prompt: 'Write a link to example.com that opens in a new tab and has readable text.', language: 'html', starter: '<p>\n\n</p>', rule: { kind: 'html', checks: [{ selector: 'a', attribute: 'href', test: 'nonempty' }, { selector: 'a', attribute: 'target', test: 'equals', value: '_blank' }, { selector: 'a', property: 'text', test: 'nonempty' }] }, success: 'That link has a place to go and words to tap.' }
        ]
      },
      {
        id: 'html-3', title: 'Images & alt text', steps: [
          { type: 'concept', title: 'Describe the picture too', text: 'src points to the image file. Alt text describes it when someone cannot see the picture.', code: '<img src="flower.jpg" alt="A small pink flower">', takeaway: 'Write alt text that says what is in the image.', sean: 'Little details make a page kinder to use.' },
          { type: 'fill_blank', title: 'Add image words', prompt: 'Choose the attribute that describes the image.', parts: ['<img src="flower.jpg" ', { blank: 0 }, '="A pink flower">'], answers: ['alt'], chips: ['alt', 'href', 'target'] },
          { type: 'reorder', title: 'Build the image tag', prompt: 'Put the tag pieces in order.', lines: ['alt="A pink flower"', '>', 'src="flower.jpg"', '<img'], solution: [3, 2, 0, 1] },
          { type: 'code_challenge', title: 'Add a picture', prompt: 'Add an image with a source and useful alt text.', language: 'html', starter: '<figure>\n\n</figure>', rule: { kind: 'html', checks: [{ selector: 'img', attribute: 'src', test: 'nonempty' }, { selector: 'img', attribute: 'alt', test: 'nonempty' }] }, success: 'The image has a useful description.' }
        ]
      },
      {
        id: 'html-4', title: 'Bullet lists', steps: [
          { type: 'concept', title: 'Keep favorites together', text: 'A ul makes a bullet list. Put each choice in its own li element.', code: '<ul>\n  <li>Tea</li>\n  <li>Mango</li>\n</ul>', takeaway: 'Each list item gets its own li tag.', sean: 'A tiny list can keep good things close.' },
          { type: 'fill_blank', title: 'Choose the list item', prompt: 'Pick the tag for one item in an unordered list.', parts: ['<ul><', { blank: 0 }, '>Tea</li></ul>'], answers: ['li'], chips: ['li', 'ul', 'ol'] },
          { type: 'reorder', title: 'Put the list together', prompt: 'Tap the lines in the order they belong.', lines: ['</ul>', '<li>Tea</li>', '<ul>', '<li>Mango</li>'], solution: [2, 3, 1, 0] },
          { type: 'code_challenge', title: 'Make a favorites list', prompt: 'Write a ul with at least two li items.', language: 'html', starter: '', rule: { kind: 'html', checks: [{ selector: 'ul', property: 'exists', test: 'true' }, { selector: 'li', property: 'count', test: 'gte', value: 2 }] }, success: 'Two favorites, in a tidy list.' }
        ]
      },
      {
        id: 'html-5', title: 'Buttons & inputs', steps: [
          { type: 'concept', title: 'Make a tiny form', text: 'An input lets someone type. A button gives them a clear action. A label tells them what to enter.', code: '<label for="wish">A wish</label>\n<input id="wish">\n<button>Save</button>', takeaway: 'Connect a label to an input with matching for and id values.', sean: 'One clear action is plenty.' },
          { type: 'fill_blank', title: 'Choose the typing field', prompt: 'Which element lets someone type a short answer?', parts: ['<', { blank: 0 }, ' id="wish">'], answers: ['input'], chips: ['input', 'button', 'label'] },
          { type: 'reorder', title: 'Set up the form', prompt: 'Put the label, input, and button in a helpful order.', lines: ['<button>Save</button>', '<input id="wish">', '<label for="wish">A wish</label>'], solution: [2, 1, 0] },
          { type: 'code_challenge', title: 'Build a small form', prompt: 'Add a label, an input, and a button.', language: 'html', starter: '<form>\n\n</form>', rule: { kind: 'html', checks: [{ selector: 'label', property: 'text', test: 'nonempty' }, { selector: 'input', property: 'exists', test: 'true' }, { selector: 'button', property: 'text', test: 'nonempty' }] }, success: 'The form has a label, a place to type, and a button.' }
        ]
      }
    ]
  },
  {
    id: 'css', name: 'CSS', icon: '✳', tagline: 'Give it a feeling', description: 'Color, type, spacing, borders, and simple layouts.',
    lessons: [
      {
        id: 'css-1', title: 'Colors & backgrounds', steps: [
          { type: 'concept', title: 'Choose two colors', text: 'color changes text. background-color changes the surface behind it.', code: '.note {\n  color: #ec4899;\n  background-color: #fff5f9;\n}', takeaway: 'Text and its background use separate properties.', sean: 'A little color goes a long way.' },
          { type: 'fill_blank', title: 'Color the text', prompt: 'Choose the property that changes text color.', parts: ['.note { ', { blank: 0 }, ': #ec4899; }'], answers: ['color'], chips: ['color', 'background-color', 'font-size'] },
          { type: 'reorder', title: 'Write the style rule', prompt: 'Put the selector and declarations in order.', lines: ['}', '  background-color: #fff5f9;', '.note {', '  color: #ec4899;'], solution: [2, 3, 1, 0] },
          { type: 'code_challenge', title: 'Pick two colors', prompt: 'Style .note with a text color and a background-color.', language: 'css', starter: '.note {\n\n}', rule: { kind: 'css', checks: [{ selector: '.note', property: 'color', test: 'notempty' }, { selector: '.note', property: 'background-color', test: 'nottransparent' }] }, success: 'Your text and surface each have a color.' }
        ]
      },
      {
        id: 'css-2', title: 'Font size & alignment', steps: [
          { type: 'concept', title: 'Set a reading rhythm', text: 'font-size sets the text size. text-align can center a short heading.', code: '.title {\n  font-size: 24px;\n  text-align: center;\n}', takeaway: 'Use px or rem for font-size.', sean: 'Readable is a lovely style choice.' },
          { type: 'fill_blank', title: 'Set the size', prompt: 'Choose a font size value.', parts: ['font-size: ', { blank: 0 }, ';'], answers: ['24px'], chips: ['24px', 'center', 'solid'] },
          { type: 'reorder', title: 'Style the title', prompt: 'Put the selector and declarations in order.', lines: ['  text-align: center;', '}', '.title {', '  font-size: 24px;'], solution: [2, 3, 0, 1] },
          { type: 'code_challenge', title: 'Style a title', prompt: 'Give .title a font size of at least 18px and center its text.', language: 'css', starter: '.title {\n\n}', rule: { kind: 'css', checks: [{ selector: '.title', property: 'font-size', test: 'minpx', value: 18 }, { selector: '.title', property: 'text-align', test: 'equals', value: 'center' }] }, success: 'The title is easy to read and centered.' }
        ]
      },
      {
        id: 'css-3', title: 'Padding & spacing', steps: [
          { type: 'concept', title: 'Give things some room', text: 'Padding is space inside an element. Margin is space outside it.', code: '.card {\n  padding: 16px;\n  margin: 12px;\n}', takeaway: 'Padding inside; margin outside.', sean: 'A little breathing room helps.' },
          { type: 'fill_blank', title: 'Space inside the card', prompt: 'Choose the property that adds room inside an element.', parts: ['.card { ', { blank: 0 }, ': 16px; }'], answers: ['padding'], chips: ['padding', 'margin', 'gap'] },
          { type: 'reorder', title: 'Space the card', prompt: 'Put the selector and declarations in order.', lines: ['  margin: 12px;', '.card {', '}', '  padding: 16px;'], solution: [1, 3, 0, 2] },
          { type: 'code_challenge', title: 'Add some breathing room', prompt: 'Give .card at least 12px of padding and margin.', language: 'css', starter: '.card {\n\n}', rule: { kind: 'css', checks: [{ selector: '.card', property: 'padding', test: 'minpx', value: 12 }, { selector: '.card', property: 'margin', test: 'minpx', value: 12 }] }, success: 'There is room inside and around the card.' }
        ]
      },
      {
        id: 'css-4', title: 'Rounded corners', steps: [
          { type: 'concept', title: 'Soften the edge', text: 'border-radius rounds the corners. A thin border gives a quiet outline.', code: '.card {\n  border: 1px solid #eadde5;\n  border-radius: 12px;\n}', takeaway: 'A small radius is enough to soften a card.', sean: 'Soft edges, simple details.' },
          { type: 'fill_blank', title: 'Round the corners', prompt: 'Choose the property that rounds corners.', parts: ['.card { ', { blank: 0 }, ': 12px; }'], answers: ['border-radius'], chips: ['border-radius', 'outline', 'corner'] },
          { type: 'reorder', title: 'Finish the card edge', prompt: 'Put the declarations inside the card rule.', lines: ['}', '  border-radius: 12px;', '.card {', '  border: 1px solid #eadde5;'], solution: [2, 3, 1, 0] },
          { type: 'code_challenge', title: 'Round a card', prompt: 'Give .card a border and rounded corners of at least 8px.', language: 'css', starter: '.card {\n\n}', rule: { kind: 'css', checks: [{ selector: '.card', property: 'border-top-width', test: 'minpx', value: 1 }, { selector: '.card', property: 'border-radius', test: 'minpx', value: 8 }] }, success: 'A quiet outline and rounded corners.' }
        ]
      },
      {
        id: 'css-5', title: 'Flexbox basics', steps: [
          { type: 'concept', title: 'Line a few things up', text: 'display: flex lays child elements out in a row. gap keeps even space between them.', code: '.favorites {\n  display: flex;\n  gap: 12px;\n}', takeaway: 'Flexbox lays out the children; gap spaces them.', sean: 'Nice and even, like little building blocks.' },
          { type: 'fill_blank', title: 'Turn on Flexbox', prompt: 'Choose the display value that starts Flexbox.', parts: ['display: ', { blank: 0 }, ';'], answers: ['flex'], chips: ['flex', 'grid', 'inline'] },
          { type: 'reorder', title: 'Line the items up', prompt: 'Put the selector and declarations in order.', lines: ['  gap: 12px;', '.favorites {', '}', '  display: flex;'], solution: [1, 3, 0, 2] },
          { type: 'code_challenge', title: 'Make a row', prompt: 'Use display:flex on .row and add a gap of at least 8px.', language: 'css', starter: '.row {\n\n}', rule: { kind: 'css', checks: [{ selector: '.row', property: 'display', test: 'equals', value: 'flex' }, { selector: '.row', property: 'gap', test: 'minpx', value: 8 }] }, success: 'Those items now sit in a neat row.' }
        ]
      }
    ]
  },
  {
    id: 'javascript', name: 'JavaScript', icon: '↗', tagline: 'Make it respond', description: 'Store a value, make a choice, and run a small function.',
    lessons: [
      {
        id: 'js-1', title: 'Variables & console.log', steps: [
          { type: 'concept', title: 'Give a value a name', text: 'A variable keeps a value under a name. console.log lets you see it while you learn.', code: 'const name = "Mheriel";\nconsole.log(name);', takeaway: 'Use const when you do not plan to replace the value.', sean: 'Now your value has a name.' },
          { type: 'fill_blank', title: 'Choose a keyword', prompt: 'Which keyword suits a value you will not reassign?', parts: [{ blank: 0 }, ' greeting = "Hi";'], answers: ['const'], chips: ['const', 'else', 'print'] },
          { type: 'reorder', title: 'Show the value', prompt: 'Put the two lines in order.', lines: ['console.log(name);', 'const name = "Mheriel";'], solution: [1, 0] },
          { type: 'code_challenge', title: 'Say hello', prompt: 'Create a name variable and log it.', language: 'javascript', starter: '', rule: { kind: 'js', sourceIncludes: ['name', 'console.log'], outputIncludes: ['Mheriel'] }, success: 'The value has a name, and you can see it.' }
        ]
      },
      {
        id: 'js-2', title: 'Template strings', steps: [
          { type: 'concept', title: 'Put a value in a sentence', text: 'A template string uses backticks. Put a variable inside ${...} to include its value.', code: 'const name = "Mheriel";\nconsole.log(`Hello, ${name}!`);', takeaway: 'Backticks make room for ${variables}.', sean: 'That sentence can change with the name.' },
          { type: 'fill_blank', title: 'Add the name slot', prompt: 'Choose the template-string slot for name.', parts: ['`Hello, ', { blank: 0 }, '!`'], answers: ['${name}'], chips: ['${name}', '(name)', 'name'] },
          { type: 'reorder', title: 'Write the greeting', prompt: 'Put the setup and output in order.', lines: ['console.log(`Hello, ${name}!`);', 'const name = "Mheriel";'], solution: [1, 0] },
          { type: 'code_challenge', title: 'Make it personal', prompt: 'Set a name variable and log a greeting with a template string.', language: 'javascript', starter: '', rule: { kind: 'js', sourceIncludes: ['const name', '`', '${name}', 'console.log'], outputIncludes: ['Mheriel'] }, success: 'Your greeting uses the value in the sentence.' }
        ]
      },
      {
        id: 'js-3', title: 'if / else decisions', steps: [
          { type: 'concept', title: 'Make a choice', text: 'An if block runs when its condition is true. else handles the other case.', code: 'if (tea === "green") {\n  console.log("Nice choice");\n} else {\n  console.log("Try another tea");\n}', takeaway: 'Use === to compare values.', sean: 'There is a path for either answer.' },
          { type: 'fill_blank', title: 'Handle the other case', prompt: 'Choose the keyword for the other branch.', parts: ['if (ready) { ... } ', { blank: 0 }, ' { ... }'], answers: ['else'], chips: ['else', 'if', 'return'] },
          { type: 'reorder', title: 'Add both paths', prompt: 'Tap each line in the order it belongs.', lines: ['  console.log("Not ready");', 'if (ready) {', '} else {', '  console.log("Ready");', '}'], solution: [1, 3, 2, 0, 4] },
          { type: 'code_challenge', title: 'Choose a path', prompt: 'Write an if and else. Log a message from each branch.', language: 'javascript', starter: 'const sunny = true;\n', rule: { kind: 'js', sourceIncludes: ['if', 'else', 'console.log'], outputIncludes: ['Sunny day'] }, success: 'Both paths are ready for either answer.' }
        ]
      },
      {
        id: 'js-4', title: 'Arrays & indexes', steps: [
          { type: 'concept', title: 'Keep a few choices', text: 'An array stores several values. JavaScript counts from zero, so the first item is at index 0.', code: 'const snacks = ["mango", "cake"];\nconsole.log(snacks[0]);', takeaway: 'The first item lives at index 0.', sean: 'Pick whichever one sounds good.' },
          { type: 'fill_blank', title: 'Pick the first item', prompt: 'What index points to the first item?', parts: ['snacks[', { blank: 0 }, ']'], answers: ['0'], chips: ['0', '1', '-1'] },
          { type: 'reorder', title: 'Read the first snack', prompt: 'Put the array, lookup, and output in order.', lines: ['console.log(firstSnack);', 'const firstSnack = snacks[0];', 'const snacks = ["mango", "cake"];'], solution: [2, 1, 0] },
          { type: 'code_challenge', title: 'Choose a snack', prompt: 'Make an array, read the first item, and log it.', language: 'javascript', starter: '', rule: { kind: 'js', sourceIncludes: ['snacks', '[0]', 'console.log'], outputIncludes: ['mango'] }, success: 'You picked the first snack from the list.' }
        ]
      },
      {
        id: 'js-5', title: 'Functions', steps: [
          { type: 'concept', title: 'Make a reusable compliment', text: 'A function holds a small job. Return a value from it, then call it when you need it.', code: 'function compliment(name) {\n  return "You are lovely, " + name;\n}\nconsole.log(compliment("Mheriel"));', takeaway: 'A function has a name, parentheses, and a body.', sean: 'Save a kind word for later.' },
          { type: 'fill_blank', title: 'Start a function', prompt: 'Choose the keyword for a function declaration.', parts: [{ blank: 0 }, ' compliment(name) { ... }'], answers: ['function'], chips: ['function', 'func', 'def'] },
          { type: 'reorder', title: 'Write and call it', prompt: 'Put the function lines in order.', lines: ['console.log(compliment("Mheriel"));', '}', 'function compliment(name) {', '  return "You are kind, " + name;'], solution: [2, 3, 1, 0] },
          { type: 'code_challenge', title: 'Write a compliment', prompt: 'Define and call a function named compliment that returns a kind message.', language: 'javascript', starter: '', rule: { kind: 'js', sourceIncludes: ['function compliment', 'return', 'compliment('], outputIncludes: ['Mheriel'] }, success: 'You made a little function you can use again.' }
        ]
      }
    ]
  },
  {
    id: 'json', name: 'JSON', icon: '{}', tagline: 'Keep details tidy', description: 'Objects, values, arrays, and careful punctuation.',
    lessons: [
      {
        id: 'json-1', title: 'Key-value objects', steps: [
          { type: 'concept', title: 'Name the details', text: 'An object groups details under keys. JSON keys and text values use double quotes.', code: '{\n  "name": "Mheriel",\n  "favorite": "tea"\n}', takeaway: 'A colon separates each key from its value.', sean: 'A tidy place for the little details.' },
          { type: 'fill_blank', title: 'Separate the pair', prompt: 'What mark separates a key from its value?', parts: ['"name" ', { blank: 0 }, ' "Mheriel"'], answers: [':'], chips: [':', ',', ';'] },
          { type: 'reorder', title: 'Build the object', prompt: 'Put the braces and key-value pairs in order.', lines: ['}', '  "favorite": "tea"', '{', '  "name": "Mheriel",'], solution: [2, 3, 1, 0] },
          { type: 'code_challenge', title: 'Keep two details', prompt: 'Write a JSON object with name and favorite keys.', language: 'json', starter: '{}', rule: { kind: 'json', checks: [{ path: 'name', test: 'equals', value: 'Mheriel' }, { path: 'favorite', test: 'equals', value: 'tea' }] }, success: 'That object keeps two details together.' }
        ]
      },
      {
        id: 'json-2', title: 'Numbers & booleans', steps: [
          { type: 'concept', title: 'Use the right kind of value', text: 'Numbers stay unquoted. true and false are booleans. null means there is no value yet.', code: '{\n  "cups": 2,\n  "isReady": true,\n  "note": null\n}', takeaway: 'Write numbers and booleans without quotes.', sean: 'Tiny punctuation, clear meaning.' },
          { type: 'fill_blank', title: 'Choose a boolean', prompt: 'Choose the JSON value for true.', parts: ['{"isReady": ', { blank: 0 }, '}'], answers: ['true'], chips: ['true', 'false', '"true"'] },
          { type: 'reorder', title: 'Add the values', prompt: 'Put each property inside the object.', lines: ['  "note": null', '{', '  "isReady": true,', '  "cups": 2,', '}'], solution: [1, 3, 2, 0, 4] },
          { type: 'code_challenge', title: 'Write a few value types', prompt: 'Make JSON with a number, a boolean, and a null value.', language: 'json', starter: '{}', rule: { kind: 'json', checks: [{ path: 'cups', test: 'type', value: 'number' }, { path: 'isReady', test: 'type', value: 'boolean' }, { path: 'note', test: 'type', value: 'null' }] }, success: 'Those values have the right types.' }
        ]
      },
      {
        id: 'json-3', title: 'Arrays in JSON', steps: [
          { type: 'concept', title: 'Store a list', text: 'Use square brackets for a list. Separate each item with a comma, and quote text values.', code: '{\n  "favorites": ["music", "coding"]\n}', takeaway: 'Arrays use square brackets.', sean: 'A list for things you like.' },
          { type: 'fill_blank', title: 'Open a list', prompt: 'Which brackets hold a JSON array?', parts: ['"favorites": ', { blank: 0 }, '"music", "coding"]'], answers: ['['], chips: ['[', '{', '('] },
          { type: 'reorder', title: 'Make the favorites array', prompt: 'Put the object and list in order.', lines: ['  "favorites": [', '}', '    "music",', '{', '    "coding"', '  ]'], solution: [3, 0, 2, 4, 5, 1] },
          { type: 'code_challenge', title: 'Add two favorites', prompt: 'Write a JSON favorites array with at least two strings.', language: 'json', starter: '{}', rule: { kind: 'json', checks: [{ path: 'favorites', test: 'array-min', value: 2 }] }, success: 'Your favorites are a proper JSON list.' }
        ]
      },
      {
        id: 'json-4', title: 'Nested objects', steps: [
          { type: 'concept', title: 'Group related details', text: 'An object can hold another object. This keeps related details, like a date plan, together.', code: '{\n  "name": "Mheriel",\n  "date": { "place": "home" }\n}', takeaway: 'Nest an object by putting braces inside braces.', sean: 'Keep the related things together.' },
          { type: 'fill_blank', title: 'Add a place', prompt: 'Which brackets start an object?', parts: ['"date": ', { blank: 0 }, '"place": "home"}'], answers: ['{'], chips: ['{', '[', '('] },
          { type: 'reorder', title: 'Nest the date', prompt: 'Put the inner object inside the outer one.', lines: ['  "date": {', '}', '    "place": "home"', '{', '  }'], solution: [3, 0, 2, 4, 1] },
          { type: 'code_challenge', title: 'Add a date detail', prompt: 'Write a nested date object with a place.', language: 'json', starter: '{}', rule: { kind: 'json', checks: [{ path: 'date.place', test: 'type', value: 'string' }] }, success: 'The date details sit neatly in their own object.' }
        ]
      },
      {
        id: 'json-5', title: 'Valid JSON rules', steps: [
          { type: 'concept', title: 'Check every mark', text: 'JSON uses double quotes, commas between items, and no trailing comma after the last one.', code: '{\n  "name": "Mheriel",\n  "days": ["Mon", "Fri"]\n}', takeaway: 'Double quotes around keys and text; no trailing comma.', sean: 'The small marks help the data make sense.' },
          { type: 'fill_blank', title: 'Quote the value', prompt: 'Choose valid JSON text for the value.', parts: ['"name": ', { blank: 0 }], answers: ['"Mheriel"'], chips: ['"Mheriel"', "'Mheriel'", 'Mheriel'] },
          { type: 'reorder', title: 'Make valid JSON', prompt: 'Put the braces and properties in order.', lines: ['  "days": ["Mon", "Fri"]', '{', '}', '  "name": "Mheriel",'], solution: [1, 3, 0, 2] },
          { type: 'code_challenge', title: 'Write valid JSON', prompt: 'Write an object with a name and a days array. Use valid JSON syntax.', language: 'json', starter: '{}', rule: { kind: 'json', checks: [{ path: 'name', test: 'type', value: 'string' }, { path: 'days', test: 'array-min', value: 2 }] }, success: 'Valid JSON. Every quote, comma, and bracket is in place.' }
        ]
      }
    ]
  },
  {
    id: 'python', name: 'Python', icon: 'Py', tagline: 'Write a small program', description: 'Print a message, do a little math, and reuse your code.',
    lessons: [
      {
        id: 'py-1', title: 'print() & variables', steps: [
          { type: 'concept', title: 'Say hello', text: 'A variable stores a value. print shows it in the output below your code.', code: 'name = "Mheriel"\nprint(name)', takeaway: 'Give the variable a name, then print that name.', sean: 'Hello is a good first line.' },
          { type: 'fill_blank', title: 'Show a message', prompt: 'Which function displays a value?', parts: [{ blank: 0 }, '("Hello")'], answers: ['print'], chips: ['print', 'input', 'show'] },
          { type: 'reorder', title: 'Print the name', prompt: 'Put the variable and print call in order.', lines: ['print(name)', 'name = "Mheriel"'], solution: [1, 0] },
          { type: 'code_challenge', title: 'Say hello', prompt: 'Set name to Mheriel and print it.', language: 'python', starter: '', rule: { kind: 'python', sourceIncludes: ['name', 'print('], outputIncludes: ['Mheriel'] }, success: 'Hello, Mheriel. It ran!' }
        ]
      },
      {
        id: 'py-2', title: 'Math & f-strings', steps: [
          { type: 'concept', title: 'Do a little math', text: 'Python can add numbers. An f-string puts a value in a sentence using braces.', code: 'cups = 2\ntotal = cups + 1\nprint(f"Tea for {total}")', takeaway: 'Put f before the quote, then the value inside braces.', sean: 'A little math makes the message.' },
          { type: 'fill_blank', title: 'Add the value slot', prompt: 'Choose the f-string value slot for total.', parts: ['print(f"Tea for ', { blank: 0 }, '")'], answers: ['{total}'], chips: ['{total}', '[total]', 'total'] },
          { type: 'reorder', title: 'Calculate and print', prompt: 'Put the setup, math, and sentence in order.', lines: ['print(f"Tea for {total}")', 'total = cups + 1', 'cups = 2'], solution: [2, 1, 0] },
          { type: 'code_challenge', title: 'Count the cups', prompt: 'Add two numbers and show the total in an f-string.', language: 'python', starter: '', rule: { kind: 'python', sourceIncludes: ['total', '+', 'f"'], outputIncludes: ['3'] }, success: 'The calculation is inside the sentence.' }
        ]
      },
      {
        id: 'py-3', title: 'if / elif / else', steps: [
          { type: 'concept', title: 'Pick a path', text: 'if checks the first case. elif checks another. else catches anything left.', code: 'if weather == "sunny":\n    plan = "walk"\nelif weather == "rainy":\n    plan = "tea"\nelse:\n    plan = "movie"', takeaway: 'Only the first matching branch runs.', sean: 'A plan for every kind of day.' },
          { type: 'fill_blank', title: 'Check another case', prompt: 'Choose the keyword that checks an extra case.', parts: ['if sunny:\n    plan = "walk"\n', { blank: 0 }, ' rainy:'], answers: ['elif'], chips: ['elif', 'if', 'else'] },
          { type: 'reorder', title: 'Make a plan', prompt: 'Tap the branches in order.', lines: ['else:', '    plan = "walk"', 'if sunny:', '    plan = "movie"', 'elif rainy:', '    plan = "tea"'], solution: [2, 1, 4, 5, 0, 3] },
          { type: 'code_challenge', title: 'Plan for the weather', prompt: 'Write if, elif, and else branches, then print the plan.', language: 'python', starter: 'weather = "rainy"\n', rule: { kind: 'python', sourceIncludes: ['if ', 'elif ', 'else:', 'print('], outputIncludes: ['tea'] }, success: 'You have a plan for each kind of day.' }
        ]
      },
      {
        id: 'py-4', title: 'Lists & for loops', steps: [
          { type: 'concept', title: 'Visit each favorite', text: 'A list holds a few values. A for loop visits each item, one at a time.', code: 'snacks = ["mango", "cake"]\nfor snack in snacks:\n    print(snack)', takeaway: 'The loop variable takes each value in turn.', sean: 'Everyone gets a turn.' },
          { type: 'fill_blank', title: 'Start the loop', prompt: 'Which keyword starts a loop over a list?', parts: [{ blank: 0 }, ' snack in snacks:'], answers: ['for'], chips: ['for', 'while', 'each'] },
          { type: 'reorder', title: 'Loop through the list', prompt: 'Put the list, loop, and print call in order.', lines: ['    print(snack)', 'for snack in snacks:', 'snacks = ["mango", "cake"]'], solution: [2, 1, 0] },
          { type: 'code_challenge', title: 'Print each snack', prompt: 'Make a list and print each item with a for loop.', language: 'python', starter: '', rule: { kind: 'python', sourceIncludes: ['snacks = [', 'for ', 'in snacks:', 'print('], outputIncludes: ['mango', 'cake'] }, success: 'Each snack got its turn.' }
        ]
      },
      {
        id: 'py-5', title: 'Functions', steps: [
          { type: 'concept', title: 'Save a small job', text: 'def gives a function a name. Indented lines belong to it. Call the function to run those lines.', code: 'def compliment(name):\n    return f"You are kind, {name}."\n\nprint(compliment("Mheriel"))', takeaway: 'Indent the function body by four spaces.', sean: 'A kind sentence you can reuse.' },
          { type: 'fill_blank', title: 'Define the function', prompt: 'Which keyword defines a function in Python?', parts: [{ blank: 0 }, ' compliment(name):'], answers: ['def'], chips: ['def', 'function', 'make'] },
          { type: 'reorder', title: 'Write and call it', prompt: 'Put the definition, return, and call in order.', lines: ['print(compliment("Mheriel"))', '    return f"You are kind, {name}."', 'def compliment(name):'], solution: [2, 1, 0] },
          { type: 'code_challenge', title: 'Write a compliment', prompt: 'Define and call a compliment(name) function using def.', language: 'python', starter: '', rule: { kind: 'python', sourceIncludes: ['def compliment(', 'return', 'compliment('], outputIncludes: ['Mheriel'] }, success: 'You can call that compliment whenever you like.' }
        ]
      }
    ]
  }
];

buildCurriculum();
normalizePillChallenges();
