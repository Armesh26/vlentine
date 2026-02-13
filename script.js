// ============================================
// SILLY NUBCAT VALENTINE'S DAY
// For Anushka with love 💕
// ============================================

// Game State
let currentHint = 1;
const maxHints = 3;
const correctPassword = "270825"; // Anniversary date: 27th August 2025
const circledParts = new Set();
const totalParts = 12; // Total body parts to circle
let noButtonMoveCount = 0;
let bgMusic = null; // Background music (silliest of them all)

// Canvas drawing state
let canvas, ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentStroke = []; // Points in current stroke
let allStrokes = []; // All completed strokes
let blobPositions = {}; // Will be populated when canvas initializes

// ============================================
// STAGE NAVIGATION
// ============================================
function goToStage(stageId) {
    // Hide all stages
    document.querySelectorAll('.stage').forEach(stage => {
        stage.classList.remove('active');
    });
    
    // Show target stage
    const targetStage = document.getElementById(stageId);
    if (targetStage) {
        targetStage.classList.add('active');
        
        // Start background music on first navigation (when she clicks "I'm Ready!")
        if (stageId === 'stage-password' && !isMusicPlaying) {
            startBackgroundMusic();
        }
        
        // Special initialization for stages
        if (stageId === 'stage-select') {
            setTimeout(initCanvas, 100); // Small delay to ensure DOM is ready
        }
        if (stageId === 'stage-question') {
            initNoButton();
        }
        if (stageId === 'stage-success') {
            launchConfetti();
        }
    }
}

// ============================================
// PASSWORD GAME
// ============================================
function showNextHint() {
    if (currentHint < maxHints) {
        currentHint++;
        const hintElement = document.getElementById(`hint${currentHint}`);
        if (hintElement) {
            hintElement.classList.remove('hidden');
        }
    } else {
        // All hints shown, maybe show a cheeky message
        const btn = event.target;
        btn.textContent = "That's all the hints! 🙈";
        btn.disabled = true;
    }
}

function checkPassword() {
    const input = document.getElementById('password-input');
    const error = document.getElementById('password-error');
    const value = input.value.trim();
    
    if (value === correctPassword) {
        // Success! Move to next stage
        input.style.borderColor = '#4CAF50';
        input.style.background = '#E8F5E9';
        error.classList.add('hidden');
        
        setTimeout(() => {
            goToStage('stage-select');
        }, 500);
    } else {
        // Wrong password
        input.style.borderColor = '#E91E63';
        error.classList.remove('hidden');
        
        // Shake animation
        input.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
    }
}

// Allow enter key to submit password
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
    
    // Initialize floating hearts
    createFloatingHearts();
});

// ============================================
// DRAWING CANVAS
// ============================================
function initCanvas() {
    canvas = document.getElementById('drawing-canvas');
    const wrapper = document.querySelector('.drawing-wrapper');
    if (!canvas || !wrapper) return;
    
    // Set canvas size to match wrapper
    const rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Calculate blob positions
    calculateBlobPositions();
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Recalculate on resize
    window.addEventListener('resize', () => {
        redrawCanvas();
        calculateBlobPositions();
    });
}

function calculateBlobPositions() {
    blobPositions = {};
    const blobs = document.querySelectorAll('.blob-item');
    const canvasRect = canvas.getBoundingClientRect();
    
    blobs.forEach(blob => {
        const part = blob.dataset.part;
        const blobRect = blob.getBoundingClientRect();
        
        // Calculate center position relative to canvas
        blobPositions[part] = {
            centerX: (blobRect.left - canvasRect.left) + blobRect.width / 2,
            centerY: (blobRect.top - canvasRect.top) + blobRect.height / 2
        };
    });
}

function startDrawing(e) {
    isDrawing = true;
    const [x, y] = getCoords(e);
    lastX = x;
    lastY = y;
    currentStroke = [{x, y}];
}

function draw(e) {
    if (!isDrawing) return;
    
    const [x, y] = getCoords(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    currentStroke.push({x, y});
    
    lastX = x;
    lastY = y;
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    // Only process if we have enough points to form a shape
    if (currentStroke.length > 10) {
        // Check which blobs are enclosed by this stroke
        checkEnclosedBlobs(currentStroke);
        allStrokes.push([...currentStroke]);
    }
    currentStroke = [];
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    isDrawing = true;
    lastX = x;
    lastY = y;
    currentStroke = [{x, y}];
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    currentStroke.push({x, y});
    
    lastX = x;
    lastY = y;
}

function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
}

// Point-in-polygon algorithm (ray casting)
function isPointInPolygon(point, polygon) {
    if (polygon.length < 3) return false;
    
    let inside = false;
    const x = point.x, y = point.y;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    
    return inside;
}

function checkEnclosedBlobs(stroke) {
    // Check each blob's center point
    for (const [part, pos] of Object.entries(blobPositions)) {
        if (!circledParts.has(part)) {
            const blobCenter = { x: pos.centerX, y: pos.centerY };
            
            if (isPointInPolygon(blobCenter, stroke)) {
                circledParts.add(part);
                updateCircledUI(part);
            }
        }
    }
}

function updateCircledUI(part) {
    // Update the blob item
    const blob = document.querySelector(`.blob-item[data-part="${part}"]`);
    if (blob) {
        blob.classList.add('circled');
    }
    
    // Update count
    const countEl = document.getElementById('circled-count');
    if (countEl) {
        countEl.textContent = `Circled: ${circledParts.size}/${totalParts}`;
    }
}

function redrawCanvas() {
    if (!canvas || !ctx) return;
    
    const wrapper = document.querySelector('.drawing-wrapper');
    const rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Redraw all strokes
    allStrokes.forEach(stroke => {
        if (stroke.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
    });
}

function clearCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    circledParts.clear();
    allStrokes = [];
    currentStroke = [];
    
    // Reset blobs
    document.querySelectorAll('.blob-item').forEach(blob => {
        blob.classList.remove('circled');
    });
    
    // Reset count
    const countEl = document.getElementById('circled-count');
    if (countEl) {
        countEl.textContent = `Circled: 0/${totalParts}`;
    }
    
    // Hide feedback
    document.getElementById('selection-feedback')?.classList.add('hidden');
}

function checkDrawing() {
    const feedback = document.getElementById('selection-feedback');
    const feedbackText = document.getElementById('feedback-text');
    
    feedback.classList.remove('hidden');
    
    if (circledParts.size === totalParts) {
        // Correct! She circled everything
        feedbackText.innerHTML = "PERFECT! 🎉 You got it right! I love EVERYTHING about you! 💖";
        feedbackText.style.color = '#4CAF50';
        
        setTimeout(() => {
            goToStage('stage-question');
        }, 1500);
    } else {
        // Not everything circled
        const remaining = totalParts - circledParts.size;
        feedbackText.innerHTML = `Hmm... you're missing ${remaining} part(s)! 🤭<br>
            <small>(Hint: I'm VERY greedy when it comes to you... I love ALL of you! 💕)</small>`;
        feedbackText.style.color = '#E91E63';
        
        // Shake the grid
        const grid = document.querySelector('.blob-grid');
        if (grid) {
            grid.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                grid.style.animation = '';
            }, 500);
        }
    }
}

// ============================================
// MOVING NO BUTTON
// ============================================
let noButtonInitialized = false;
let noButtonActivated = false; // Only start running after first click
let isMoving = false; // Prevent multiple moves at once
let megalovaniaAudio = null; // Store reference to stop it later

function initNoButton() {
    if (noButtonInitialized) return;
    noButtonInitialized = true;
    
    const noBtn = document.getElementById('btn-no');
    const teaseText = document.getElementById('tease-text');
    
    if (!noBtn) return;
    
    const minDistance = 100; // Only move when mouse is THIS close (pixels)
    
    // Mouse move handler - only triggers AFTER first click
    document.addEventListener('mousemove', (e) => {
        if (!noButtonActivated) return; // Don't move until clicked once
        if (isMoving) return; // Don't move if already moving
        
        const btnRect = noBtn.getBoundingClientRect();
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(e.clientX - btnCenterX, 2) + 
            Math.pow(e.clientY - btnCenterY, 2)
        );
        
        // Only move when mouse is VERY close to the button
        if (distance < minDistance) {
            moveNoButton(e.clientX, e.clientY, btnCenterX, btnCenterY);
        }
    });
    
    // Touch handler for mobile - activates on first touch
    noBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        noButtonActivated = true; // Activate after first touch
        const touch = e.touches[0];
        const btnRect = noBtn.getBoundingClientRect();
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;
        moveNoButton(touch.clientX, touch.clientY, btnCenterX, btnCenterY);
    });
    
    // First click activates the running, then it runs away
    noBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Play MEGALOVANIA on first click! 😈
        if (!noButtonActivated) {
            // Stop the cute background music
            stopBackgroundMusic();
            
            // Start the battle music!
            megalovaniaAudio = new Audio('MEGALOVANIA.mp3');
            megalovaniaAudio.currentTime = 30; // Start from the middle (the intense part)
            megalovaniaAudio.volume = 0.7;
            megalovaniaAudio.play().catch(err => console.log('Audio failed:', err));
        }
        
        noButtonActivated = true; // Now it will start running!
        const btnRect = noBtn.getBoundingClientRect();
        moveNoButton(e.clientX, e.clientY, btnRect.left + btnRect.width/2, btnRect.top + btnRect.height/2);
    });
}

function moveNoButton(mouseX, mouseY, btnX, btnY) {
    if (isMoving) return;
    isMoving = true;
    
    const noBtn = document.getElementById('btn-no');
    const teaseText = document.getElementById('tease-text');
    
    const padding = 100;
    const maxX = window.innerWidth - padding;
    const maxY = window.innerHeight - padding;
    
    // Calculate direction away from mouse
    const angle = Math.atan2(btnY - mouseY, btnX - mouseX);
    
    // Move a fixed distance away
    const moveDistance = 200;
    
    // Calculate new position - move away from cursor
    let newX = btnX + Math.cos(angle) * moveDistance;
    let newY = btnY + Math.sin(angle) * moveDistance;
    
    // Check if new position would be out of bounds or stuck at edge
    const wouldBeStuck = newX <= padding || newX >= maxX || newY <= padding || newY >= maxY;
    
    if (wouldBeStuck) {
        // Find a random position that's away from the cursor
        let attempts = 0;
        do {
            newX = padding + Math.random() * (maxX - padding);
            newY = padding + Math.random() * (maxY - padding);
            
            // Calculate distance from cursor
            const distFromCursor = Math.sqrt(
                Math.pow(newX - mouseX, 2) + Math.pow(newY - mouseY, 2)
            );
            
            // Accept if far enough from cursor (at least 200px)
            if (distFromCursor > 200) break;
            attempts++;
        } while (attempts < 10);
    }
    
    // Final clamp just to be safe
    newX = Math.max(padding, Math.min(newX, maxX));
    newY = Math.max(padding, Math.min(newY, maxY));
    
    // Apply position with smooth transition
    noBtn.style.transition = 'left 0.3s ease-out, top 0.3s ease-out';
    noBtn.style.position = 'fixed';
    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
    noBtn.style.transform = 'translate(-50%, -50%)';
    noBtn.style.zIndex = '1000';
    
    // Update counter and text
    noButtonMoveCount++;
    
    if (noButtonMoveCount >= 2 && teaseText) {
        teaseText.classList.remove('hidden');
    }
    
    // Change button text after attempts
    if (noButtonMoveCount === 3) {
        noBtn.textContent = "Can't catch me! 😜";
    } else if (noButtonMoveCount === 6) {
        noBtn.textContent = "Just say YES! 💕";
    } else if (noButtonMoveCount >= 9) {
        noBtn.textContent = "Pretty please? 🥺";
    }
    
    // Allow next move after transition completes
    setTimeout(() => {
        isMoving = false;
    }, 350);
}

// ============================================
// SUCCESS - YES BUTTON
// ============================================
function sayYes() {
    // Stop all music that might be playing
    stopBackgroundMusic(); // Stop "silliest of them all"
    
    if (megalovaniaAudio) {
        megalovaniaAudio.pause();
        megalovaniaAudio.currentTime = 0;
    }
    
    // Play the WOW sound effect!
    const wowSound = new Audio('Anime WOW - Sound Effect (HD).mp3');
    wowSound.play().catch(e => console.log('Audio play failed:', e));
    
    goToStage('stage-success');
}

// ============================================
// CONFETTI CELEBRATION
// ============================================
function launchConfetti() {
    const container = document.getElementById('confetti');
    if (!container) return;
    
    const colors = ['#FF6B9D', '#FFD54F', '#4CAF50', '#64B5F6', '#BA68C8', '#FF8A65', '#E91E63'];
    const shapes = ['💖', '💕', '✨', '🌸', '💗', '🎉', '💝', '⭐'];
    
    // Launch confetti in waves
    for (let wave = 0; wave < 5; wave++) {
        setTimeout(() => {
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    createConfettiPiece(container, colors, shapes);
                }, i * 50);
            }
        }, wave * 1000);
    }
}

function createConfettiPiece(container, colors, shapes) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    
    // Random shape or colored square
    if (Math.random() > 0.5) {
        piece.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        piece.style.fontSize = `${15 + Math.random() * 20}px`;
    } else {
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    }
    
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.animationDuration = `${3 + Math.random() * 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    
    container.appendChild(piece);
    
    // Remove after animation
    setTimeout(() => {
        piece.remove();
    }, 5000);
}

// ============================================
// FLOATING HEARTS BACKGROUND
// ============================================
function createFloatingHearts() {
    const container = document.getElementById('hearts-container');
    if (!container) return;
    
    const hearts = ['💕', '💖', '💗', '💓', '💝', '🩷', '❤️'];
    
    // Create initial hearts
    for (let i = 0; i < 15; i++) {
        createHeart(container, hearts);
    }
    
    // Keep creating hearts
    setInterval(() => {
        if (document.querySelectorAll('.bg-heart').length < 20) {
            createHeart(container, hearts);
        }
    }, 2000);
}

function createHeart(container, hearts) {
    const heart = document.createElement('span');
    heart.className = 'bg-heart';
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.animationDuration = `${10 + Math.random() * 10}s`;
    heart.style.animationDelay = `${Math.random() * 5}s`;
    heart.style.fontSize = `${15 + Math.random() * 25}px`;
    
    container.appendChild(heart);
    
    // Remove after animation
    setTimeout(() => {
        heart.remove();
    }, 20000);
}

// ============================================
// BACKGROUND MUSIC
// ============================================
let isMusicPlaying = false;

function startBackgroundMusic() {
    bgMusic = new Audio('silliest of them all.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    
    bgMusic.play().then(() => {
        isMusicPlaying = true;
        console.log('🎵 Music started!');
    }).catch((e) => {
        console.log('Music play failed:', e);
    });
}

function stopBackgroundMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        isMusicPlaying = false;
    }
}

// ============================================
// INITIALIZATION
// ============================================
console.log('💕 Made with love for Anushka 💕');
