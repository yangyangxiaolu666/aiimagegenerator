// DOM Elements
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const statusSection = document.getElementById('statusSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');

// 添加一个变量来跟踪已完成的图片数量
let completedImages = 0;

// Particle animation function
function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    document.body.appendChild(particle);

    const animation = particle.animate([
        { transform: 'scale(1)', opacity: 0.6 },
        { transform: 'scale(20)', opacity: 0 }
    ], {
        duration: 1000,
        easing: 'ease-out'
    });

    animation.onfinish = () => particle.remove();
}

// Update progress bar
function updateProgress(progress) {
    // 确保进度只向前推进
    const currentProgress = parseInt(progressBar.style.width) || 0;
    if (progress > currentProgress) {
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }
}

// Generate random seed
function generateRandomSeed() {
    // 使用时间戳和随机数的组合生成种子
    return Math.floor(Date.now() * Math.random());
}

// Generate multiple images using Pollinations.AI API
async function generateImages(prompt) {
    try {
        // 重置已完成图片计数
        completedImages = 0;
        
        // Show status section
        statusSection.classList.remove('hidden');
        
        // Clear previous results
        resultsSection.innerHTML = '';
        
        // Initialize progress
        updateProgress(0);

        // 生成4张不同的图片，使用不同的种子值
        const imagePromises = Array(4).fill().map(async (_, index) => {
            // 为每个请求生成独特的种子值
            const seed = generateRandomSeed();
            
            // 使用原始提示词和随机种子
            const response = await fetch('https://image.pollinations.ai/prompt/' + 
                encodeURIComponent(prompt) + 
                '?seed=' + seed);
            
            const blob = await response.blob();
            // 更新已完成的图片数量并更新进度
            completedImages++;
            updateProgress(completedImages * 25);

            // 将图片转换为base64
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        blobUrl: URL.createObjectURL(blob),
                        base64: reader.result
                    });
                };
                reader.readAsDataURL(blob);
            });
        });

        // Wait for all images to be generated
        const imageData = await Promise.all(imagePromises);

        // Set progress to 100% when all images are ready
        updateProgress(100);
        
        // Add a small delay to show 100% before hiding
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Hide status section
        statusSection.classList.add('hidden');

        // Add all images to results
        imageData.forEach((data, index) => {
            addImageToResults(data.blobUrl, data.base64, prompt, index + 1);
        });

    } catch (error) {
        console.error('Error generating images:', error);
        alert('Failed to generate images. Please try again.');
        statusSection.classList.add('hidden');
    }
}

// Add generated image to results section
function addImageToResults(blobUrl, base64Data, prompt, index) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative group rounded-lg overflow-hidden shadow-lg bg-white flex flex-col';
    
    imageContainer.innerHTML = `
        <div class="aspect-w-1 aspect-h-1 w-full">
            <img src="${blobUrl}" alt="${prompt}" class="w-full h-auto object-contain">
        </div>
        <div class="p-4 flex gap-4 justify-center">
            <button class="download-btn px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-300">
                Download PNG
            </button>
            <button class="edit-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                Edit
            </button>
            <button class="retry-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Retry
            </button>
        </div>
    `;

    // Add event listeners for buttons
    const downloadBtn = imageContainer.querySelector('.download-btn');
    const editBtn = imageContainer.querySelector('.edit-btn');
    const retryBtn = imageContainer.querySelector('.retry-btn');

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `ai-generated-${Date.now()}-${index}.png`;
        link.click();
    });

    editBtn.addEventListener('click', () => {
        // 直接使用已存储的base64数据
        localStorage.setItem('editImageUrl', base64Data);
        localStorage.setItem('editPrompt', prompt);
        window.location.href = 'edit.html';
    });

    retryBtn.addEventListener('click', () => {
        imageContainer.remove();
        generateImages(prompt);
    });

    resultsSection.appendChild(imageContainer);
}

// Event Listeners
generateBtn.addEventListener('click', () => {
    const prompt = promptInput.value.trim();
    if (prompt) {
        generateImages(prompt);
    } else {
        alert('Please enter a prompt first');
    }
});

// Add particle effect to generate button
generateBtn.addEventListener('click', (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    createParticle(x, y);
});

// Allow Enter key to trigger generation
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateBtn.click();
    }
}); 