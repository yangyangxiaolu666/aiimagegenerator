// DOM Elements
const editImage = document.getElementById('editImage');
const togglePanel = document.getElementById('togglePanel');
const toolPanel = document.querySelector('.tool-panel');
const toolItems = document.querySelectorAll('.tool-item');
const exportButtons = document.querySelectorAll('[data-format]');
const cropOverlay = document.getElementById('cropOverlay');
const cropArea = document.getElementById('cropArea');

// Export button functionality
const exportButton = document.querySelector('.export-btn');
const exportDropdown = document.querySelector('.export-dropdown');

// Initialize Fabric.js canvas
let canvas = null;

// Add state management at the top of the file
const toolState = {
    filters: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0,
        blur: 0
    },
    effects: {
        border: {
            width: 0,
            color: '#000000'
        },
        shadow: {
            blur: 0,
            color: '#000000'
        },
        rounded: {
            radius: 0
        }
    }
};

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get the image URL from localStorage
    const imageUrl = localStorage.getItem('editImageUrl');
    if (!imageUrl) {
        alert('No image selected. Please go back and select an image.');
        return;
    }

    // Initialize canvas
    canvas = new fabric.Canvas('canvas', {
        width: 800,
        height: 600,
        backgroundColor: '#f8f9fa'
    });

    // Load image
    fabric.Image.fromURL(imageUrl, function(img) {
        // Scale image to fit canvas
        const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
        );
        img.scale(scale);
        
        // Center image
        img.set({
            left: (canvas.width - img.width * scale) / 2,
            top: (canvas.height - img.height * scale) / 2
        });

        canvas.add(img);
        canvas.renderAll();
    });

    // Initialize tool panel functionality
    initializeToolPanel();
    initializeExportButton();
});

// Tool Panel Functionality
function initializeToolPanel() {
    console.log('Initializing tool panel...');
    const toolPanel = document.querySelector('.tool-panel');
    const toggleButton = document.getElementById('togglePanel');
    const toolItems = document.querySelectorAll('.tool-item');
    console.log('Found tool items:', toolItems.length);

    // Toggle panel
    toggleButton.addEventListener('click', () => {
        console.log('Toggle panel clicked');
        toolPanel.classList.toggle('collapsed');
        const icon = toggleButton.querySelector('i');
        icon.classList.toggle('fa-chevron-left');
        icon.classList.toggle('fa-chevron-right');
    });

    // Tool item click handlers
    toolItems.forEach(item => {
        item.addEventListener('click', () => {
            const tool = item.dataset.tool;
            console.log('Tool clicked:', tool);
            handleToolClick(tool, item);
        });
    });
}

// Handle tool clicks
function handleToolClick(tool, item) {
    console.log('Handling tool click:', tool);
    // Remove active class from all tools
    document.querySelectorAll('.tool-item').forEach(t => t.classList.remove('active'));
    // Add active class to clicked tool
    item.classList.add('active');

    // Get the active object or the first image if no object is selected
    const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
    console.log('Active object:', activeObject ? {
        type: activeObject.type,
        width: activeObject.width,
        height: activeObject.height,
        left: activeObject.left,
        top: activeObject.top
    } : 'Not found');
    if (!activeObject) return;

    switch(tool) {
        case 'crop':
            console.log('Crop tool selected');
            // Disable drawing mode
            canvas.isDrawingMode = false;
            
            // Create crop rectangle with proper controls
            const cropRect = new fabric.Rect({
                left: activeObject.left,
                top: activeObject.top,
                width: activeObject.width * activeObject.scaleX,
                height: activeObject.height * activeObject.scaleY,
                fill: 'rgba(0,0,0,0.3)',
                stroke: '#fff',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: true,
                hasControls: true,
                hasBorders: true,
                lockRotation: true,
                transparentCorners: false,
                cornerColor: 'rgba(0,0,255,0.5)',
                cornerSize: 10
            });

            // Add crop rectangle to canvas
            canvas.add(cropRect);
            canvas.setActiveObject(cropRect);
            
            // Add crop button
            const cropButton = document.createElement('button');
            cropButton.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
            cropButton.textContent = 'Apply Crop';
            cropButton.onclick = function() {
                console.log('Apply crop clicked');
                
                // Get crop rectangle position and size
                const rect = cropRect;
                const image = activeObject;
                
                console.log('Crop rectangle:', {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    scaleX: rect.scaleX,
                    scaleY: rect.scaleY
                });
                
                console.log('Original image:', {
                    left: image.left,
                    top: image.top,
                    width: image.width,
                    height: image.height,
                    scaleX: image.scaleX,
                    scaleY: image.scaleY
                });
                
                // Calculate crop coordinates relative to the original image
                const imageLeft = image.left;
                const imageTop = image.top;
                const imageWidth = image.width * image.scaleX;
                const imageHeight = image.height * image.scaleY;
                
                // Calculate crop area relative to image with proper bounds checking
                const cropX = Math.max(0, (rect.left - imageLeft) / image.scaleX);
                const cropY = Math.max(0, (rect.top - imageTop) / image.scaleY);
                const cropWidth = Math.min(rect.width / image.scaleX, image.width - cropX);
                const cropHeight = Math.min(rect.height / image.scaleY, image.height - cropY);
                
                console.log('Calculated crop values:', {
                    cropX: cropX,
                    cropY: cropY,
                    cropWidth: cropWidth,
                    cropHeight: cropHeight
                });
                
                // Verify crop area is valid
                if (cropWidth <= 0 || cropHeight <= 0) {
                    console.log('Invalid crop area, aborting crop');
                    return;
                }
                
                // Apply crop to the image using Fabric.js crop properties
                image.set({
                    cropX: cropX,
                    cropY: cropY,
                    cropWidth: cropWidth,
                    cropHeight: cropHeight,
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    scaleX: 1,
                    scaleY: 1
                });
                
                console.log('Applied crop properties to image');
                
                // Remove crop rectangle and button
                canvas.remove(cropRect);
                cropButton.remove();
                
                // Set the cropped image as active
                canvas.setActiveObject(image);
                canvas.renderAll();
                
                console.log('Crop completed');
            };
            
            document.body.appendChild(cropButton);
            break;
        case 'rotate':
            console.log('Rotate tool selected');
            activeObject.rotate((activeObject.angle || 0) + 90);
            canvas.renderAll();
            break;
        case 'flip':
            console.log('Flip tool selected');
            activeObject.set('flipX', !activeObject.flipX);
            canvas.renderAll();
            break;
        case 'filter':
            console.log('Filter tool selected');
            showFilterOptions();
            break;
        case 'custom-filter':
            console.log('Custom filter tool selected');
            showCustomFilterOptions();
            break;
        case 'brightness':
            console.log('Brightness tool selected');
            showAdjustmentOptions('brightness');
            break;
        case 'saturation':
            console.log('Saturation tool selected');
            showAdjustmentOptions('saturation');
            break;
        case 'sharpness':
            console.log('Sharpness tool selected');
            showAdjustmentOptions('sharpness');
            break;
        case 'border':
            console.log('Border tool selected');
            showBorderOptions();
            break;
        case 'shadow':
            console.log('Shadow tool selected');
            showShadowOptions();
            break;
        case 'rounded':
            console.log('Rounded corners tool selected');
            showRoundedOptions();
            break;
    }
}

// Show filter options
function showFilterOptions() {
    console.log('Showing filter options panel');
    const filters = [
        { name: 'Grayscale', filter: 'Grayscale' },
        { name: 'Sepia', filter: 'Sepia' },
        { name: 'Invert', filter: 'Invert' },
        { name: 'Blur', filter: 'Blur' },
        { name: 'Sharpen', filter: 'Convolute' }
    ];

    const optionsPanel = createOptionsPanel('Filters');
    console.log('Created options panel:', optionsPanel);
    const content = document.createElement('div');
    content.className = 'p-4';

    const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
    if (!activeObject) {
        console.log('No active object found for filter options');
        return;
    }

    // Initialize filters if they don't exist
    if (!activeObject.filters) {
        console.log('Initializing filters array');
        activeObject.filters = [];
    }

    filters.forEach(filter => {
        const button = document.createElement('button');
        button.className = 'w-full mb-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded';
        button.textContent = filter.name;
        button.onclick = () => {
            console.log('Filter button clicked:', filter.name);
            const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
            if (activeObject) {
                // Clear existing filters
                activeObject.filters = [];
                
                if (filter.filter === 'Convolute') {
                    activeObject.filters.push(new fabric.Image.filters.Convolute({
                        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
                    }));
                } else {
                    activeObject.filters.push(new fabric.Image.filters[filter.filter]());
                }
                activeObject.applyFilters();
                canvas.renderAll();
                console.log('Filter applied:', filter.name);
            }
        };
        content.appendChild(button);
    });

    optionsPanel.appendChild(content);
    console.log('Showing options panel');
    showOptionsPanel(optionsPanel);
}

// Show custom filter options
function showCustomFilterOptions() {
    const optionsPanel = createOptionsPanel('Custom Filter');
    const content = document.createElement('div');
    content.className = 'p-4 space-y-4';

    const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
    if (!activeObject) return;

    // Initialize filters if they don't exist
    if (!activeObject.filters) {
        activeObject.filters = [];
    }

    // Brightness
    addSlider(content, 'Brightness', -100, 100, toolState.filters.brightness, (value) => {
        const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
        if (activeObject) {
            // Remove existing brightness filter if any
            activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.Brightness));
            // Add new brightness filter
            activeObject.filters.push(new fabric.Image.filters.Brightness({ brightness: value / 100 }));
            activeObject.applyFilters();
            canvas.renderAll();
            // Save the value
            toolState.filters.brightness = value;
        }
    });

    // Contrast
    addSlider(content, 'Contrast', -100, 100, toolState.filters.contrast, (value) => {
        const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
        if (activeObject) {
            // Remove existing contrast filter if any
            activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.Contrast));
            // Add new contrast filter
            activeObject.filters.push(new fabric.Image.filters.Contrast({ contrast: value / 100 }));
            activeObject.applyFilters();
            canvas.renderAll();
            // Save the value
            toolState.filters.contrast = value;
        }
    });

    // Saturation
    addSlider(content, 'Saturation', -100, 100, toolState.filters.saturation, (value) => {
        const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
        if (activeObject) {
            // Remove existing saturation filter if any
            activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.Saturation));
            // Add new saturation filter
            activeObject.filters.push(new fabric.Image.filters.Saturation({ saturation: value / 100 }));
            activeObject.applyFilters();
            canvas.renderAll();
            // Save the value
            toolState.filters.saturation = value;
        }
    });

    optionsPanel.appendChild(content);
    showOptionsPanel(optionsPanel);
}

// Show adjustment options
function showAdjustmentOptions(type) {
    const optionsPanel = createOptionsPanel(type.charAt(0).toUpperCase() + type.slice(1));
    const content = document.createElement('div');
    content.className = 'p-4 space-y-4';

    const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
    if (!activeObject) return;

    // Initialize filters if they don't exist
    if (!activeObject.filters) {
        activeObject.filters = [];
    }

    switch(type) {
        case 'brightness':
            addSlider(content, 'Brightness', -100, 100, toolState.filters.brightness, (value) => {
                const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
                if (activeObject) {
                    // Remove existing brightness filter if any
                    activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.Brightness));
                    // Add new brightness filter
                    activeObject.filters.push(new fabric.Image.filters.Brightness({ brightness: value / 100 }));
                    activeObject.applyFilters();
                    canvas.renderAll();
                    // Save the value
                    toolState.filters.brightness = value;
                }
            });
            addSlider(content, 'Contrast', -100, 100, toolState.filters.contrast, (value) => {
                const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
                if (activeObject) {
                    // Remove existing contrast filter if any
                    activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.Contrast));
                    // Add new contrast filter
                    activeObject.filters.push(new fabric.Image.filters.Contrast({ contrast: value / 100 }));
                    activeObject.applyFilters();
                    canvas.renderAll();
                    // Save the value
                    toolState.filters.contrast = value;
                }
            });
            break;
        case 'saturation':
            addSlider(content, 'Saturation', -100, 100, toolState.filters.saturation, (value) => {
                const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
                if (activeObject) {
                    // Remove existing saturation filter if any
                    activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.Saturation));
                    // Add new saturation filter
                    activeObject.filters.push(new fabric.Image.filters.Saturation({ saturation: value / 100 }));
                    activeObject.applyFilters();
                    canvas.renderAll();
                    // Save the value
                    toolState.filters.saturation = value;
                }
            });
            break;
        case 'sharpness':
            addSlider(content, 'Sharpen', 0, 100, toolState.filters.sharpness, (value) => {
                const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
                if (activeObject) {
                    // Remove existing convolute filter if any
                    activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.Convolute));
                    // Add new convolute filter
                    activeObject.filters.push(new fabric.Image.filters.Convolute({
                        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
                    }));
                    activeObject.applyFilters();
                    canvas.renderAll();
                    // Save the value
                    toolState.filters.sharpness = value;
                }
            });
            addSlider(content, 'Blur', 0, 100, toolState.filters.blur, (value) => {
                const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
                if (activeObject) {
                    // Remove existing blur filter if any
                    activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.Blur));
                    // Add new blur filter
                    activeObject.filters.push(new fabric.Image.filters.Blur({ blur: value / 100 }));
                    activeObject.applyFilters();
                    canvas.renderAll();
                    // Save the value
                    toolState.filters.blur = value;
                }
            });
            break;
    }

    optionsPanel.appendChild(content);
    showOptionsPanel(optionsPanel);
}

// Show border options
function showBorderOptions() {
    const optionsPanel = createOptionsPanel('Border');
    const content = document.createElement('div');
    content.className = 'p-4 space-y-4';

    // Border width
    addSlider(content, 'Width', 0, 20, toolState.effects.border.width, (value) => {
        const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
        if (activeObject) {
            activeObject.set('strokeWidth', value);
            activeObject.set('stroke', toolState.effects.border.color);
            canvas.renderAll();
            // Save the value
            toolState.effects.border.width = value;
        }
    });

    // Border color
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'w-full h-10';
    colorInput.value = toolState.effects.border.color;
    colorInput.onchange = (e) => {
        const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
        if (activeObject) {
            activeObject.set('stroke', e.target.value);
            canvas.renderAll();
            // Save the value
            toolState.effects.border.color = e.target.value;
        }
    };
    content.appendChild(colorInput);

    optionsPanel.appendChild(content);
    showOptionsPanel(optionsPanel);
}

// Show shadow options
function showShadowOptions() {
    const optionsPanel = createOptionsPanel('Shadow');
    const content = document.createElement('div');
    content.className = 'p-4 space-y-4';

    // Shadow blur
    addSlider(content, 'Blur', 0, 20, toolState.effects.shadow.blur, (value) => {
        const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
        if (activeObject) {
            activeObject.set('shadow', new fabric.Shadow({
                blur: value,
                color: toolState.effects.shadow.color,
                offsetX: 10,
                offsetY: 10
            }));
            canvas.renderAll();
            // Save the value
            toolState.effects.shadow.blur = value;
        }
    });

    // Shadow color
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'w-full h-10';
    colorInput.value = toolState.effects.shadow.color;
    colorInput.onchange = (e) => {
        const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
        if (activeObject) {
            activeObject.set('shadow', new fabric.Shadow({
                blur: toolState.effects.shadow.blur,
                color: e.target.value,
                offsetX: 10,
                offsetY: 10
            }));
            canvas.renderAll();
            // Save the value
            toolState.effects.shadow.color = e.target.value;
        }
    };
    content.appendChild(colorInput);

    optionsPanel.appendChild(content);
    showOptionsPanel(optionsPanel);
}

// Show rounded corners options
function showRoundedOptions() {
    console.log('Opening rounded corners options panel');
    const optionsPanel = createOptionsPanel('Rounded Corners');
    const content = document.createElement('div');
    content.className = 'p-4 space-y-4';

    const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
    console.log('Active object details:', activeObject ? {
        type: activeObject.type,
        width: activeObject.width,
        height: activeObject.height,
        left: activeObject.left,
        top: activeObject.top,
        scaleX: activeObject.scaleX,
        scaleY: activeObject.scaleY,
        angle: activeObject.angle
    } : 'No active object');

    if (!activeObject) return;

    // Corner radius
    addSlider(content, 'Radius', 0, 50, toolState.effects.rounded.radius, (value) => {
        console.log('Slider value changed:', value);
        const activeObject = canvas.getActiveObject() || canvas.getObjects()[0];
        
        if (activeObject) {
            // Calculate the actual dimensions considering scale
            const scaledWidth = activeObject.width * activeObject.scaleX;
            const scaledHeight = activeObject.height * activeObject.scaleY;

            // Create a clip path for rounded corners
            const clipPath = new fabric.Rect({
                width: scaledWidth,
                height: scaledHeight,
                rx: value,
                ry: value,
                absolutePositioned: true,
                left: activeObject.left,
                top: activeObject.top,
                angle: activeObject.angle,
                originX: 'left',
                originY: 'top'
            });

            console.log('Created clip path:', {
                width: clipPath.width,
                height: clipPath.height,
                rx: clipPath.rx,
                ry: clipPath.ry,
                left: clipPath.left,
                top: clipPath.top,
                angle: clipPath.angle,
                originX: clipPath.originX,
                originY: clipPath.originY
            });

            // Apply the clip path to the image
            activeObject.clipPath = clipPath;
            
            // Update the canvas
            canvas.renderAll();
            
            // Save the value
            toolState.effects.rounded.radius = value;

            console.log('Applied clip path with radius:', value);
            console.log('Active object after clip path:', {
                hasClipPath: !!activeObject.clipPath,
                clipPathType: activeObject.clipPath ? activeObject.clipPath.type : 'none',
                objectWidth: activeObject.width,
                objectHeight: activeObject.height,
                objectScaleX: activeObject.scaleX,
                objectScaleY: activeObject.scaleY
            });
        }
    });

    optionsPanel.appendChild(content);
    showOptionsPanel(optionsPanel);
}

// Helper function to show options panel
function showOptionsPanel(panel) {
    console.log('Showing options panel');
    
    // Remove existing options panel
    const existingPanel = document.querySelector('.tool-options');
    if (existingPanel) {
        console.log('Removing existing panel');
        existingPanel.remove();
    }

    // Add close button functionality
    const closeBtn = panel.querySelector('.close-btn');
    closeBtn.onclick = () => {
        console.log('Close button clicked');
        panel.remove();
    };

    // Set panel styles
    panel.style.position = 'fixed';
    panel.style.zIndex = '9999';
    panel.style.opacity = '1';
    panel.style.visibility = 'visible';
    panel.style.display = 'block';
    panel.style.backgroundColor = 'white';
    panel.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    panel.style.borderRadius = '0.5rem';
    panel.style.width = '300px';

    // Position panel next to the tool panel
    const toolPanel = document.querySelector('.tool-panel');
    const toolPanelRect = toolPanel.getBoundingClientRect();
    panel.style.left = `${toolPanelRect.right + 10}px`;
    panel.style.top = `${toolPanelRect.top}px`;

    // Add panel to document
    console.log('Adding panel to document');
    document.body.appendChild(panel);
    
    // Log panel's position and dimensions
    const rect = panel.getBoundingClientRect();
    console.log('Panel position:', {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
    });
}

// Helper function to create options panel
function createOptionsPanel(title) {
    console.log('Creating options panel with title:', title);
    const panel = document.createElement('div');
    panel.className = 'tool-options bg-white shadow-lg rounded-lg';
    
    const header = document.createElement('div');
    header.className = 'p-4 border-b flex justify-between items-center';
    header.innerHTML = `
        <h3 class="font-semibold">${title}</h3>
        <button class="close-btn text-gray-500 hover:text-gray-700">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    panel.appendChild(header);
    console.log('Options panel created');
    return panel;
}

// Helper function to add slider
function addSlider(container, label, min, max, value, onChange) {
    const div = document.createElement('div');
    div.className = 'space-y-2';
    
    const labelElement = document.createElement('label');
    labelElement.className = 'block text-sm font-medium text-gray-700';
    labelElement.textContent = label;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.className = 'w-full';
    
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'text-sm text-gray-500';
    valueDisplay.textContent = value;
    
    slider.oninput = (e) => {
        const newValue = parseInt(e.target.value);
        valueDisplay.textContent = newValue;
        onChange(newValue);
    };
    
    div.appendChild(labelElement);
    div.appendChild(slider);
    div.appendChild(valueDisplay);
    container.appendChild(div);
}

// Export functionality
function initializeExportButton() {
    const exportBtn = document.querySelector('.export-btn');
    const exportDropdown = document.querySelector('.export-dropdown');

    exportBtn.addEventListener('click', () => {
        exportDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
            exportDropdown.classList.remove('active');
        }
    });

    // Handle export format selection
    exportDropdown.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            const format = button.dataset.format;
            exportImage(format);
            exportDropdown.classList.remove('active');
        });
    });
}

// Export image function
function exportImage(format) {
    if (!canvas) return;

    // Get the image object (assuming there's only one image)
    const objects = canvas.getObjects();
    const image = objects.find(obj => obj.type === 'image');
    
    if (!image) {
        console.log('No image found to export');
        return;
    }

    console.log('Exporting image:', {
        type: image.type,
        width: image.width,
        height: image.height,
        scaleX: image.scaleX,
        scaleY: image.scaleY,
        left: image.left,
        top: image.top,
        angle: image.angle,
        hasClipPath: !!image.clipPath
    });

    // Check if image has clipPath (rounded corners or other clipping)
    if (image.clipPath) {
        console.log('Image has clipPath, using temporary canvas method');
        exportWithClipPath(image, format);
    } else {
        console.log('Image has no clipPath, using normal export method');
        exportNormal(image, format);
    }
}

// Export normal image (no clipPath)
function exportNormal(image, format) {
    // Calculate the actual image boundaries considering all transformations
    const imageBounds = image.getBoundingRect();
    
    console.log('Image bounds:', {
        left: imageBounds.left,
        top: imageBounds.top,
        width: imageBounds.width,
        height: imageBounds.height
    });

    // Export only the image area without background
    const dataURL = canvas.toDataURL({
        format: format,
        quality: 0.8,
        left: imageBounds.left,
        top: imageBounds.top,
        width: imageBounds.width,
        height: imageBounds.height
    });

    console.log('Normal export completed, image size:', imageBounds.width + 'x' + imageBounds.height);
    downloadImage(dataURL, format);
}

// Export image with clipPath (rounded corners, etc.)
function exportWithClipPath(image, format) {
    // Use the image's actual bounds instead of clipPath bounds
    const imageBounds = {
        left: image.left,
        top: image.top,
        width: image.width * image.scaleX,
        height: image.height * image.scaleY
    };
    
    console.log('Image actual bounds:', imageBounds);
    console.log('ClipPath bounds:', image.clipPath.getBoundingRect());

    // Create a temporary canvas with the image dimensions
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set canvas size to match image actual bounds
    tempCanvas.width = imageBounds.width;
    tempCanvas.height = imageBounds.height;
    
    console.log('Created temporary canvas:', tempCanvas.width + 'x' + tempCanvas.height);

    // Create a temporary Fabric.js canvas with transparent background
    const tempFabricCanvas = new fabric.Canvas(tempCanvas, {
        width: imageBounds.width,
        height: imageBounds.height,
        backgroundColor: 'transparent'
    });

    // Clone the image and adjust its position for the temporary canvas
    const clonedImage = fabric.util.object.clone(image);
    clonedImage.set({
        left: 0,
        top: 0,
        originX: 'left',
        originY: 'top'
    });

    // Ensure the clipPath is also cloned and positioned correctly
    if (clonedImage.clipPath) {
        const clonedClipPath = fabric.util.object.clone(clonedImage.clipPath);
        clonedClipPath.set({
            left: 0,
            top: 0,
            originX: 'left',
            originY: 'top'
        });
        clonedImage.clipPath = clonedClipPath;
        console.log('Applied clipPath to cloned image');
    }

    // Add the cloned image to temporary canvas
    tempFabricCanvas.add(clonedImage);
    tempFabricCanvas.renderAll();

    console.log('Added cloned image to temporary canvas');

    // Export the temporary canvas
    const dataURL = tempFabricCanvas.toDataURL({
        format: format,
        quality: 0.8
    });

    console.log('ClipPath export completed, image size:', imageBounds.width + 'x' + imageBounds.height);
    
    // Clean up temporary canvas
    tempFabricCanvas.dispose();
    
    downloadImage(dataURL, format);
}

// Helper function to download the image
function downloadImage(dataURL, format) {
    const link = document.createElement('a');
    link.download = `edited-image.${format}`;
    link.href = dataURL;
    link.click();
}