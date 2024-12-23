    let fontSize = 14;  // Set initial fontSize to a valid value for execCommand
    let lastFont = "Roboto";
    let lastAlignment = 'justifyLeft';
    let selectedImage;
    let context; // Declare the context variable for drawing
    let isDrawing = false;
    let x = 0, y = 0;
    let savedDrawingData = null; // Variable to save drawing data
    let handleScale = 1.0;

    function execCmd(command) {
  if (command === 'indent') {
    document.execCommand('indent', false, null);
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const parentElement = range.startContainer.parentElement;
    if (parentElement.tagName !== 'LI') {
      document.execCommand('insertUnorderedList', false, null);
      // Remove margin from blockquote
      parentElement.style.margin = '0';
    }
  } else {
    document.execCommand(command, false, null);
  }
}

// Zoom
document.addEventListener('DOMContentLoaded', function() {
    let currentScale = 1;
    let initialDistance = 0;

    function initializePinchToZoom(editor) {
        function handleTouchStart(event) {
            if (event.touches.length === 2) {
                initialDistance = getDistance(event.touches[0], event.touches[1]);
            }
        }

        function handleTouchMove(event) {
            if (event.touches.length === 2) {
                event.preventDefault();
                const newDistance = getDistance(event.touches[0], event.touches[1]);
                const scaleChange = newDistance / initialDistance;
                currentScale *= scaleChange;
                editor.style.transform = `scale(${currentScale})`;
                initialDistance = newDistance;
            }
        }

        function handleTouchEnd(event) {
            // Ensure the scale stays within reasonable bounds
            if (currentScale < 0.2) {
                currentScale = 0.2;
            } else if (currentScale > 3) {
                currentScale = 3;
            }
            editor.style.transform = `scale(${currentScale})`;
            resizeScale.style.transform = eval(currentScale + currentScale);
        }

        function getDistance(touch1, touch2) {
            return Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
        }

        editor.addEventListener('touchstart', handleTouchStart);
        editor.addEventListener('touchmove', handleTouchMove);
        editor.addEventListener('touchend', handleTouchEnd);
        
        // Mouse wheel zoom
        editor.addEventListener('wheel', handleWheelZoom);
    }

    function handleWheelZoom(event) {
        event.preventDefault();
        const zoomFactor = 0.1;
        const delta = Math.sign(event.deltaY);
        currentScale += delta * -zoomFactor;
        // Ensure the scale stays within reasonable bounds
        if (currentScale < 0.2) {
            currentScale = 0.2;
        } else if (currentScale > 3) {
            currentScale = 3;
        }
        const editor = event.currentTarget;
        editor.style.transform = `scale(${currentScale})`;
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('resizable')) {
                        initializePinchToZoom(node);
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Check if any resizable elements are already present when the script runs
    document.querySelectorAll('.resizable').forEach((element) => {
        initializePinchToZoom(element);
    });
});

function insertTable() {
  const rows = prompt("Enter the number of rows:", "2");
  const cols = prompt("Enter the number of columns:", "3");

  if (rows && cols) {
    let tableHtml = '<table>';
    for (let i = 0; i < rows; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHtml += '<td><br></td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table>';

    const editor = document.getElementById('editor');
    editor.focus();
    document.execCommand('insertHTML', false, tableHtml);
    showToolbar('tableToolbar');
  }
}


    
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey) {
    switch (event.key) {
      case 'b':
        event.preventDefault();
        execCmd('bold');
        break;
      case 'i':
        event.preventDefault();
        execCmd('italic');
        break;
      case 'u':
        event.preventDefault();
        execCmd('underline');
        break;
      case 'L' :
      	event.preventDefault();
      	changeAlignment('justifyLeft');
      	break;
      case 'C' :
      	event.preventDefault();
      	changeAlignment('justifyCenter');
      	break;
      case 'R' :
      	event.preventDefault();
      	changeAlignment('justifyRight');
      	break;
    }
  }
  if (event.key === 'Tab') 
	{ 
	event.preventDefault();
	execCmd('indent');
	} 

});

resizeCanvas();

document.addEventListener('click', function(event) {
  if (event.target.tagName === 'TD' || event.target.tagName === 'TH') {
    selectedCell = event.target;
    showToolbar('tableToolbar');
  }
});


    function changeFont(font) {
      document.execCommand('fontName', false, font);
      lastFont = font;
    }

    function changeFontSize(change) {
      fontSize += change;
      document.execCommand('fontSize', false, fontSize);
    }

    function changeAlignment(alignment) {
      document.execCommand(alignment, false, null);
      lastAlignment = alignment;
      document.getElementById('alignSelect').value = "";
    }

document.getElementById('editor').addEventListener('click', function(event) {
  const textToolbar = document.getElementById('textToolbar');
  const imageToolbar = document.getElementById('imageToolbar');
  const drawingToolbar = document.getElementById('drawingToolbar');
  const drawingCanvas = document.getElementById('drawingCanvas');

  if (event.target.tagName === 'IMG') {
    selectedImage = event.target;
    wrapImage(selectedImage);
    textToolbar.classList.add('hide');
    if (imageToolbar) imageToolbar.classList.remove('hide'); // Check existence
    drawingToolbar.classList.add('hide');
    drawingCanvas.classList.add('hide');
  } else {
    textToolbar.classList.remove('hide');
    if (imageToolbar) imageToolbar.classList.add('hide'); // Check existence
    drawingToolbar.classList.add('hide');
    drawingCanvas.classList.add('hide');
    if (selectedImage) unwrapImage(selectedImage);
    selectedImage = null;
  }
});
let strokes = []; // Array to store all strokes
let currentStroke = []; // Array to store the current stroke

function toggleDrawingToolbar() {
    const drawingToolbar = document.getElementById('drawingToolbar');
    const drawingCanvas = document.getElementById('drawingCanvas');
    const textToolbar = document.getElementById('textToolbar');
    const imageToolbar = document.getElementById('imageToolbar');

    drawingToolbar.classList.toggle('hide');
    textToolbar.classList.toggle('hide', !drawingToolbar.classList.contains('hide'));
    if (imageToolbar) imageToolbar.classList.add('hide'); // Check existence

    if (!drawingToolbar.classList.contains('hide')) {
        drawingCanvas.style.display = 'block';
        drawingCanvas.style.zIndex = '6';
        context = drawingCanvas.getContext('2d'); // Initialize context

        // Render saved drawing if it exists
        if (savedDrawingData) {
            const savedImage = new Image();
            savedImage.src = savedDrawingData;
            savedImage.onload = () => context.drawImage(savedImage, 0, 0);
        }
    } else {
        drawingCanvas.style.display = 'none';
    }
}

function saveAndHideDrawingToolbar() {
    const drawingCanvas = document.getElementById('drawingCanvas');
    const drawingToolbar = document.getElementById('drawingToolbar');
    const textToolbar = document.getElementById('textToolbar');

    if (drawingCanvas) {
        savedDrawingData = drawingCanvas.toDataURL();
    }

    // Keep canvas behind the text
    drawingCanvas.style.zIndex = '0';
    textToolbar.classList.remove('hide');
    drawingToolbar.classList.add('hide');
}

function setInkThickness(thickness) {
    context.lineWidth = thickness;
}

function selectPenColor() {
    context.lineWidth = 5;
    context.globalCompositeOperation = 'source-over'; // Ensure we're in drawing mode
    context.strokeStyle = document.getElementById('penColor').value;
}

function selectHighlighter(color) {
    context.lineWidth = 10;
    context.strokeStyle = document.getElementById('penColor').value;
}

function selectEraser() {
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = 30; // Set eraser thickness here

    // Function to erase strokes
    drawingCanvas.addEventListener('mousedown', function(event) {
        const pos = getMousePos(event);
        strokes = strokes.filter(stroke => {
            const isErased = stroke.some(point => {
                return Math.abs(point.x - pos.x) < context.lineWidth && Math.abs(point.y - pos.y) < context.lineWidth;
            });
            return !isErased; // Remove stroke if any point is within the eraser range
        });
    });
}

document.getElementById('drawingCanvas').addEventListener('mousedown', startDrawing);
document.getElementById('drawingCanvas').addEventListener('touchstart', startDrawing);

document.getElementById('drawingCanvas').addEventListener('mousemove', draw);
document.getElementById('drawingCanvas').addEventListener('touchmove', draw);

document.getElementById('drawingCanvas').addEventListener('mouseup', stopDrawing);
document.getElementById('drawingCanvas').addEventListener('touchend', stopDrawing);

document.getElementById('drawingCanvas').addEventListener('mouseout', stopDrawing);
document.getElementById('drawingCanvas').addEventListener('touchcancel', stopDrawing);

function getMousePos(event) {
    const rect = drawingCanvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function drawLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

function startDrawing(event) {
    isDrawing = true;
    const pos = getMousePos(event);
    x = pos.x;
    y = pos.y;
    currentStroke = [{x, y}]; // Start a new stroke
}

function draw(event) {
    event.preventDefault();
    if (isDrawing === true) {
        const pos = getMousePos(event);
        drawLine(context, x, y, pos.x, pos.y);
        x = pos.x;
        y = pos.y;
        currentStroke.push({x, y}); // Add point to the current stroke
    }
}

function stopDrawing() {
    if (isDrawing === true) {
        isDrawing = false;
        strokes.push(currentStroke); // Add the current stroke to the array of strokes
        context.globalCompositeOperation = 'source-over'; // Reset composite operation after erasing
    }
}


let selectedCell = null;

document.addEventListener('click', function(event) {
  if (event.target.tagName === 'TD' || event.target.tagName === 'TH') {
    selectedCell = event.target;
    showTableToolbar();
  } else if (!event.target.closest('.toolbar')) {
    showToolbar('textToolbar');
  }
});


  function showTableToolbar() {
  const tableToolbar = document.getElementById('tableToolbar');
  const textToolbar = document.getElementById('textToolbar');
  const drawingToolbar = document.getElementById('drawingToolbar');
  const imageToolbar = document.getElementById('imageToolbar');
  const drawingCanvas = document.getElementById('drawingCanvas');

  tableToolbar.classList.remove('hide');
  textToolbar.classList.add('hide');
  if (drawingToolbar) drawingToolbar.classList.add('hide');
  if (imageToolbar) imageToolbar.classList.add('hide');
  if (drawingCanvas) drawingCanvas.style.display = 'none'; // Hide the drawing canvas if it's visible
}



function addRow() {
  if (selectedCell) {
    const row = selectedCell.parentElement.cloneNode(true);
    selectedCell.parentElement.parentElement.appendChild(row);
  }
}

function addColumn() {
  if (selectedCell) {
    const rows = selectedCell.parentElement.parentElement.rows;
    for (let i = 0; i < rows.length; i++) {
      rows[i].insertCell(selectedCell.cellIndex + 1).innerHTML = "";
    }
  }
}

function deleteRow() {
  if (selectedCell) {
    selectedCell.parentElement.remove();
  }
}

function deleteColumn() {
  if (selectedCell) {
    const rows = selectedCell.parentElement.parentElement.rows;
    for (let i = 0; i < rows.length; i++) {
      rows[i].deleteCell(selectedCell.cellIndex);
    }
  }
}

function mergeCells() {
  if (selectedCell) {
    const span = parseInt(prompt("Enter colspan or rowspan value:", "2"));
    if (span) {
      selectedCell.colSpan = span;
    }
  }
}

function splitCell() {
  if (selectedCell && selectedCell.colSpan > 1) {
    selectedCell.colSpan = 1;
  }
}

function setCellType(type) {
  if (selectedCell) {
    const cellType = document.createElement(type);
    cellType.innerHTML = selectedCell.innerHTML;
    selectedCell.parentElement.replaceChild(cellType, selectedCell);
    selectedCell = cellType;
  }
}

function setAlignment(alignment) {
  if (selectedCell) {
    selectedCell.style.textAlign = alignment;
  }
}

function toggleTableToolbar() {
  const tableToolbar = document.getElementById('tableToolbar');
  const textToolbar = document.getElementById('textToolbar');
  if (tableToolbar.classList.contains('hide')) {
    tableToolbar.classList.remove('hide');
    textToolbar.classList.add('hide');
  } else {
    tableToolbar.classList.add('hide');
    textToolbar.classList.remove('hide');
  }
}

function showToolbar(toolbarId) {
  const toolbars = document.querySelectorAll('.toolbar');
  toolbars.forEach(toolbar => {
    if (toolbar.id === toolbarId) {
      toolbar.classList.remove('hide');
    } else {
      toolbar.classList.add('hide');
    }
  });
}

function toggleTextToolbar() {
  showToolbar('textToolbar');

  // Insert a <br> after the table and move the cursor
  const editor = document.getElementById('editor');
  const selection = window.getSelection();
  const range = document.createRange();
  const br = document.createElement('br');
  editor.appendChild(br);
  range.setStartAfter(editor.lastChild);
  range.setEndAfter(editor.lastChild);
  selection.removeAllRanges();
  selection.addRange(range);
}

function F() {
  showToolbar('tableToolbar');
}




    function getMousePos(event) {
      const rect = drawingCanvas.getBoundingClientRect();
      const clientX = event.clientX || event.touches[0].clientX;
      const clientY = event.clientY || event.touches[0].clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }
    
    function drawLine(context, x1, y1, x2, y2) {
      context.beginPath();
      context.lineWidth = context.lineWidth; // Maintain current line width
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
      context.closePath();
    }

    // Function to remove resize handles
    function removeResizeHandles() {
      const handles = document.querySelectorAll('.resize-handle');
      handles.forEach(handle => handle.remove());
    }

    // Ensure resize handles are removed when image is deselected
    document.getElementById('editor').addEventListener('click', function(event) {
      const textToolbar = document.getElementById('textToolbar');
      const imageToolbar = document.getElementById('imageToolbar');
      const drawingToolbar = document.getElementById('drawingToolbar');
      const drawingCanvas = document.getElementById('drawingCanvas');

      if (event.target.tagName !== 'IMG') {
          removeResizeHandles();
      }
    });

function loadImage(src) {
  const img = new Image();
  img.src = src;
  img.onload = () => document.getElementById('editor').appendChild(img);
}

   function wrapImage(image) {
  if (!image.parentElement.classList.contains('resizable')) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('resizable');
    image.parentNode.insertBefore(wrapper, image);
    wrapper.appendChild(image);
    addResizeHandles(wrapper);
  }
}

function convertImageToBase64(url, callback) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = this.width;
    canvas.height = this.height;
    ctx.drawImage(this, 0, 0);
    const dataURL = canvas.toDataURL('image/png');
    callback(dataURL);
  };
  img.src = url;
}

function unwrapImage(image) {
  const wrapper = image.parentElement;
  if (wrapper.classList.contains('resizable')) {
    wrapper.replaceWith(image);
  }
}

function addResizeHandles(wrapper) {
  const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  handles.forEach(handle => {
    const handleDiv = document.createElement('div');
    handleDiv.classList.add('resize-handle', handle);
    handleDiv.addEventListener('mousedown', initResize);
    wrapper.appendChild(handleDiv);
  });
}

function initResize(event) {
  startX = event.clientX;
  startY = event.clientY;
  startWidth = parseInt(document.defaultView.getComputedStyle(selectedImage).width, 10);
  startHeight = parseInt(document.defaultView.getComputedStyle(selectedImage).height, 10);
  document.documentElement.addEventListener('mousemove', doResize);
  document.documentElement.addEventListener('mouseup', stopResize);
}

function doResize(event) {
  selectedImage.width = startWidth + event.clientX - startX;
  selectedImage.height = startHeight + event.clientY - startY;
}

function stopResize() {
  document.documentElement.removeEventListener('mousemove', doResize);
  document.documentElement.removeEventListener('mouseup', stopResize);
}


    function saveFile() {
  const fileName = prompt("Enter filename:", "document");
  if (fileName) {
    const editorContent = document.getElementById('editor').innerHTML;

    // Convert all images to base64 and save their data
    const images = document.querySelectorAll('#editor img');
    let imageDataPromises = Array.from(images).map((img) => {
      return new Promise((resolve) => {
        if (img.src.startsWith('data:image')) {
          resolve(`<picture:${img.src}>`);
        } else {
          convertImageToBase64(img.src, (base64) => {
            resolve(`<picture:${base64}>`);
          });
        }
      });
    });

    // Add ink data to the saved content
    const inkData = savedDrawingData ? `<ink:${savedDrawingData}>` : '';

    Promise.all(imageDataPromises).then(imageDataArray => {
      const imageData = imageDataArray.join('');
      const content = `${editorContent}${inkData}${imageData}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName + ".ebf";
      a.click();
    });
  }
}


   function openFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      let content = e.target.result;

      // Extract and render all pictures
      const pictureRegex = /<picture:([^>]*)>/g;
      let match;
      while ((match = pictureRegex.exec(content)) !== null) {
        loadImage(match[1]);
      }

      // Extract ink data from the content
      const inkDataStart = content.indexOf('<ink:');
      const inkDataEnd = content.indexOf('>', inkDataStart);
      if (inkDataStart !== -1 && inkDataEnd !== -1) {
        const inkData = content.slice(inkDataStart + 5, inkDataEnd);
        savedDrawingData = inkData;
      }

      // Remove ink and picture data from the editor content
      const editorContent = content.replace(/<ink:.*>/, '').replace(/<picture:[^>]*>/g, '');
      document.getElementById('editor').innerHTML = editorContent;

      // Load the saved drawing data immediately
      if (savedDrawingData) {
        const drawingCanvas = document.getElementById('drawingCanvas');
        drawingCanvas.style.display = 'block';
        drawingCanvas.style.zIndex = '0'; // Keep canvas behind text
        drawingCanvas.style.position = 'absolute';
        drawingCanvas.style.top = '0';
        drawingCanvas.style.left = '0';
        drawingCanvas.width = window.innerWidth - 20;
        drawingCanvas.height = window.innerHeight - 108;
        context = drawingCanvas.getContext('2d');
        const savedImage = new Image();
        savedImage.src = savedDrawingData;
        savedImage.onload = () => context.drawImage(savedImage, 0, 0);
      }
    };
    reader.readAsText(file);
  }
}
