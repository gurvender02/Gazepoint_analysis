let detectedWords = {};
let heatmapData = [];
let data;
let wordsVisible = false;
let wordsContainer;
let toggleButton;
let currentAlphaFactor = 1.0;
let alphaSlider;

// New variables for element statistics
let elementStats = {
  'Heading': { count: 0, duration: 0 },
  'Paragraph': { count: 0, duration: 0 },
  'Image': { count: 0, duration: 0 },
  'List': { count: 0, duration: 0 },
  'Link': { count: 0, duration: 0 },
  'Button': { count: 0, duration: 0 },
  'Other': { count: 0, duration: 0 }
};

function preload() {
  data = loadTable('d2.csv', 'csv', 'header');
}

function setup() {
  const canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.position(0, 0);
  canvas.style('pointer-events', 'none');
  noStroke();

  for (let i = 0; i < data.getRowCount(); i++) {
    const row = data.getRow(i);
    if (row.getNum('FPOGV') === 1) {
      const x = map(row.getNum('FPOGX'), 0, 1, 0, window.innerWidth);
      const y = map(row.getNum('FPOGY'), 0, 1, 0, window.innerHeight);
      const duration = row.getNum('FPOGD');
      const size = map(duration, 0, 5, 5, 50);
      
      // Record heatmap data
      heatmapData.push({ x, y, size, duration });
      
      // Detect words and elements
      detectWordsAt(x, y, size, duration);
      trackElementType(x, y, duration);
    }
  }

  createGazeWordsButton();
  createAlphaSlider();
  createStatsButton(); // New stats button
}

function draw() {
  clear();
  for (let point of heatmapData) {
    let alpha = map(point.duration, 0, 5, 10, 50) * currentAlphaFactor;
    alpha = constrain(alpha, 0, 255);
    fill(255, 0, 0, alpha);
    ellipse(point.x, point.y, 2 * point.size);
  }
}

// New element tracking function
function trackElementType(x, y, duration) {
  const element = document.elementFromPoint(x, y);
  const elementType = getElementType(element);
  elementStats[elementType].count++;
  elementStats[elementType].duration += duration;
}

// New element type detection function
function getElementType(el) {
  while (el && el.tagName) {
    const tag = el.tagName.toLowerCase();
    if (tag.match(/^h[1-6]$/)) return 'Heading';
    if (tag === 'p') return 'Paragraph';
    if (tag === 'img') return 'Image';
    if (['ul', 'ol', 'li'].includes(tag)) return 'List';
    if (tag === 'a') return 'Link';
    if (tag === 'button') return 'Button';
    el = el.parentElement;
  }
  return 'Other';
}

// New function to create statistics button
function createStatsButton() {
    const statsButton = document.createElement('button');
    statsButton.innerText = 'Show Statistics';
    Object.assign(statsButton.style, {
      position: 'fixed',
      bottom: '80px',  // Changed from 20px to 80px
      right: '20px',
      padding: '10px 16px',
      fontSize: '16px',
      backgroundColor: '#8b4513',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      zIndex: '10001'
    });
    statsButton.onclick = showStatistics;
    document.body.appendChild(statsButton);
}

// New function to calculate and display statistics
function showStatistics() {
    let totalCount = Object.values(elementStats).reduce((sum, cat) => sum + cat.count, 0);
    let totalDuration = Object.values(elementStats).reduce((sum, cat) => sum + cat.duration, 0);
  
    const statsWindow = document.createElement('div');
    Object.assign(statsWindow.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '500px',
      height: '400px',
      backgroundColor: 'white',
      border: '2px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      padding: '20px',
      zIndex: '10000',
      display: 'flex',
      flexDirection: 'column'
    });
  
    const header = document.createElement('div');
    header.innerHTML = '<h3 style="margin: 0; color: #8b4513;">Gaze Statistics</h3>';
    statsWindow.appendChild(header);
  
    const content = document.createElement('div');
    Object.assign(content.style, {
      flex: '1',
      overflowY: 'auto',  // Add scroll
      marginTop: '15px',
      paddingRight: '10px'
    });
  
    for (const [category, stats] of Object.entries(elementStats)) {
      const countPercent = ((stats.count / totalCount) * 100).toFixed(1);
      const durationPercent = ((stats.duration / totalDuration) * 100).toFixed(1);
      
      const statLine = document.createElement('div');
      statLine.style.margin = '10px 0';
      statLine.style.padding = '8px';
      statLine.style.backgroundColor = '#f5f5f5';
      statLine.style.borderRadius = '4px';
      statLine.innerHTML = `
        <strong style="display: block; margin-bottom: 5px;">${category}:</strong>
        <div>Fixations: ${stats.count} (${countPercent}%)</div>
        <div>Duration: ${stats.duration.toFixed(2)}s (${durationPercent}%)</div>
      `;
      content.appendChild(statLine);
    }
  
    statsWindow.appendChild(content);
  
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '15px';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Close';
    closeBtn.style.padding = '8px 16px';
    closeBtn.onclick = () => statsWindow.remove();
    buttonContainer.appendChild(closeBtn);
    
    statsWindow.appendChild(buttonContainer);
    document.body.appendChild(statsWindow);
  
    makeDraggable(statsWindow, header);
  
    console.log('Gaze Statistics:');
    for (const [category, stats] of Object.entries(elementStats)) {
      const countPercent = ((stats.count / totalCount) * 100).toFixed(1);
      const durationPercent = ((stats.duration / totalDuration) * 100).toFixed(1);
      console.log(
        `${category}: ${stats.count} fixations (${countPercent}%), ` +
        `${stats.duration.toFixed(2)}s (${durationPercent}%)`
      );
    }
}

// ... (keep the rest of your existing functions unchanged below)

function createGazeWordsButton() {
    toggleButton = document.createElement('button');
    toggleButton.innerText = 'Get Gaze Words';
    Object.assign(toggleButton.style, {
      position: 'fixed',
      bottom: '20px',  // Maintained 20px bottom
      right: '20px',
      padding: '10px 16px',
      fontSize: '16px',
      backgroundColor: '#8b4513',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      zIndex: '10001'
    });
    toggleButton.onclick = toggleGazeWords;
    document.body.appendChild(toggleButton);
}

function toggleGazeWords() {
  if (wordsVisible) {
    if (wordsContainer) {
      document.body.removeChild(wordsContainer);
      wordsContainer = null;
    }
    toggleButton.innerText = 'Get Gaze Words';
  } else {
    // Main container
    wordsContainer = document.createElement('div');
    wordsContainer.id = 'gaze-words-window';
    Object.assign(wordsContainer.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '400px',
      height: '300px',
      minWidth: '200px',
      minHeight: '150px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      backgroundColor: 'white',
      color: 'black',
      border: '2px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      boxSizing: 'border-box',
      resize: 'both',
      overflow: 'auto',
      zIndex: '10000'
    });

    // Header for dragging
    const header = document.createElement('div');
    header.innerText = '👁️ Gaze Words';
    Object.assign(header.style, {
      backgroundColor: '#8b4513',
      color: 'white',
      padding: '8px',
      cursor: 'move',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      fontWeight: 'bold',
      fontSize: '16px'
    });
    wordsContainer.appendChild(header);
    makeDraggable(wordsContainer, header); // pass header as drag handle

    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.innerText = '×';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '5px',
      right: '10px',
      cursor: 'pointer',
      fontSize: '18px'
    });
    closeBtn.onclick = () => toggleGazeWords();
    wordsContainer.appendChild(closeBtn);

    // Word list
    const content = document.createElement('div');
    content.style.padding = '10px';
    const sortedWords = Object.entries(detectedWords).sort((a, b) => b[1].duration - a[1].duration);
    sortedWords.forEach(([word, info]) => {
      const span = document.createElement('span');
      span.innerText = word + ' ';
      Object.assign(span.style, {
        fontSize: info.size + 'px',
        color: info.color,
        marginRight: '5px',
        display: 'inline-block'
      });
      content.appendChild(span);
    });

    wordsContainer.appendChild(content);
    document.body.appendChild(wordsContainer);
    toggleButton.innerText = 'Close Gaze Words';
  }
  wordsVisible = !wordsVisible;
}


function detectWordsAt(x, y, radius, duration) {
  let range;
  if (document.caretPositionFromPoint) {
    range = document.caretPositionFromPoint(x, y);
  } else if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  }

  if (range && range.offsetNode && range.offsetNode.nodeType === Node.TEXT_NODE) {
    const textNode = range.offsetNode;
    const offset = range.offset;
    const text = textNode.textContent;
    const word = getWordAt(text, offset);

    if (word && word.trim().length > 0) {
      if (!detectedWords[word]) {
        detectedWords[word] = { count: 0, duration: 0, size: 10, color: '' };
      }
      detectedWords[word].count++;
      detectedWords[word].duration += duration;
      detectedWords[word].size = constrain(map(detectedWords[word].duration, 0, 5, 10, 46), 10, 46);
      detectedWords[word].color = `rgb(${map(detectedWords[word].duration, 0, 5, 0, 255)}, 50, 150)`;
    }
  }
}

function getWordAt(text, offset) {
  let left = offset, right = offset;
  while (left > 0 && /\S/.test(text[left - 1])) left--;
  while (right < text.length && /\S/.test(text[right])) right++;
  return text.slice(left, right);
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}

function makeDraggable(container, handle) {
  let isMouseDown = false;
  let offsetX = 0, offsetY = 0;

  handle.addEventListener('mousedown', function (e) {
    isMouseDown = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    document.body.style.userSelect = 'none'; // prevent text selection
  });

  document.addEventListener('mousemove', function (e) {
    if (!isMouseDown) return;
    container.style.left = `${e.clientX - offsetX}px`;
    container.style.top = `${e.clientY - offsetY}px`;
    container.style.transform = 'none';
  });

  document.addEventListener('mouseup', function () {
    isMouseDown = false;
    document.body.style.userSelect = 'auto';
  });
}

function createAlphaSlider() {
  alphaSlider = document.createElement('input');
  alphaSlider.type = 'range';
  alphaSlider.min = 0;
  alphaSlider.max = 1;
  alphaSlider.step = 0.01;
  alphaSlider.value = currentAlphaFactor;

  alphaSlider.style.position = 'fixed';
  alphaSlider.style.bottom = '20px';
  alphaSlider.style.left = '20px';
  alphaSlider.style.zIndex = '10001';

  alphaSlider.oninput = function () {
    currentAlphaFactor = parseFloat(alphaSlider.value);
  };

  document.body.appendChild(alphaSlider);

  // Optional: add label
  const label = document.createElement('label');
  label.innerText = 'Circle Alpha';
  label.style.position = 'fixed';
  label.style.bottom = '45px';
  label.style.left = '20px';
  label.style.color = '#333';
  label.style.zIndex = '10001';
  label.style.fontSize = '14px';
  document.body.appendChild(label);
}
