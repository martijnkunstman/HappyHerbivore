/*
 * Happy Herbivore - Main Logic
 * Handling fullscreen, config reloading, and input suppression.
 */

// --- Config Loading Logic ---
let currentVersion = null;
const CONFIG_URL = './config.json';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function fetchConfig() {
    try {
        const response = await fetch(CONFIG_URL + '?t=' + new Date().getTime()); // Prevent caching
        if (!response.ok) {
            console.error('Failed to load config');
            return;
        }
        const config = await response.json();

        if (currentVersion === null) {
            currentVersion = config.version;
            console.log('Initial config loaded. Version:', currentVersion);
            if (config.idleFood) {
                startSlideshow(config.idleFood);
            }
        } else if (currentVersion !== config.version) {
            console.log(`Version changed from ${currentVersion} to ${config.version}. Reloading...`);
            location.reload();
        }
    } catch (error) {
        console.error('Error fetching config:', error);
    }
}

// Initial load
fetchConfig();

// Periodic check
setInterval(fetchConfig, CHECK_INTERVAL);

// --- Slideshow Logic ---
let idleFoods = [];
let currentSlideIndex = 0;
let currentLayer = 0; // 0 for bgImage, 1 for bgImage2
const SLIDE_INTERVAL = 5000;

const layers = [
    document.getElementById('bgImage'),
    document.getElementById('bgImage2')
];

function startSlideshow(foods) {
    if (!foods || foods.length === 0) return;
    idleFoods = foods;

    // Preload ALL images
    console.log('Preloading images...');
    idleFoods.forEach(food => {
        const img = new Image();
        img.src = `./assets/${food}`;
    });

    // Start interval
    if (window.slideshowInterval) clearInterval(window.slideshowInterval);

    // Initial State
    currentSlideIndex = 0;
    const firstImg = `url("./assets/${idleFoods[0]}")`;

    // Prepare layer 0
    layers[0].style.backgroundImage = firstImg;
    layers[0].classList.add('active');
    layers[0].classList.add('zoom-effect');

    // Ensure layer 1 is hidden
    layers[1].classList.remove('active');
    layers[1].classList.remove('zoom-effect');

    window.slideshowInterval = setInterval(nextSlide, SLIDE_INTERVAL);
}

function nextSlide() {
    if (idleFoods.length === 0) return;

    const nextLayerIndex = (currentLayer === 0) ? 1 : 0;
    const nextSlideIndex = (currentSlideIndex + 1) % idleFoods.length;
    const imgUrl = `url("./assets/${idleFoods[nextSlideIndex]}")`;

    const activeLayer = layers[currentLayer];
    const nextLayer = layers[nextLayerIndex];

    // 1. Prepare next layer (it's behind the active one, or opacity 0)
    nextLayer.style.backgroundImage = imgUrl;

    // 2. Reset animation on next layer BEFORE showing it
    nextLayer.classList.remove('zoom-effect');
    void nextLayer.offsetWidth; // force reflow
    nextLayer.classList.add('zoom-effect');

    // 3. Crossfade
    // Bring next layer to full opacity
    nextLayer.classList.add('active');

    // Fade out active layer?
    // If we just add 'active' to next layer, it sits on top (due to DOM order?) or z-index equal.
    // We should probably toggle 'active' class nicely.
    // CSS transition is on opacity.

    // Since both are just position absolute:
    // If we rely on z-index or DOM order: #bgImage2 is after #bgImage.
    // So bgImage2 on top.

    // Strategy: Always keep opacity 1 on the "new" one, and opacity 0 on the "old" one.

    // Wait for transition to finish? No, just toggle.
    activeLayer.classList.remove('active');

    // State update
    currentLayer = nextLayerIndex;
    currentSlideIndex = nextSlideIndex;
}


// --- Fullscreen Logic ---
const fullscreenBtn = document.getElementById('fullscreenBtn');
const gameContainer = document.getElementById('gameContainer'); // Or document.documentElement

function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

fullscreenBtn.addEventListener('click', () => {
    enterFullscreen();
});

// Update UI on fullscreen change
function handleFullscreenChange() {
    if (document.fullscreenElement) {
        fullscreenBtn.style.display = 'none';
        console.log('Entered fullscreen');
    } else {
        fullscreenBtn.style.display = 'block';
        console.log('Exited fullscreen');
    }
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('msfullscreenchange', handleFullscreenChange);


// --- Input Logic ---

// Disable right click
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// 5 taps in 5 seconds to exit
let tapCount = 0;
let lastTapTime = 0;
const TAP_RESET_TIME = 2000; // 2 seconds window
const TAP_REQUIRED = 5;

// Reset tap count logic needs to be a bit smarter. 
// "5 times in 5 seconds" effectively means a sliding window or a reset after 5s of the first tap.
// Simplest implementation: increment count. If time since first tap > 5s, reset.
// Actually, usually "5 clicks within a 5 second window".
// Let's implement: check if 5th tap is within 5 seconds of the 1st tap of the sequence.

let taps = [];

document.addEventListener('click', (e) => {
    // Only care if we are in fullscreen? User said "when the fullscreen display is pressed 5 times".
    // Probably implies checking this always, but mostly useful in fullscreen to exit.

    if (!document.fullscreenElement) return;

    // Check if click is in top-right 25% area
    const width = window.innerWidth;
    const height = window.innerHeight;
    const x = e.clientX;
    const y = e.clientY;

    const inTopRight = x > (width * 0.75) && y < (height * 0.25);

    if (!inTopRight) return;

    const now = Date.now();
    taps.push(now);

    // Keep only taps within the last 2 seconds
    taps = taps.filter(time => now - time <= TAP_RESET_TIME);

    if (taps.length >= TAP_REQUIRED) {
        console.log('5 taps detected in top-right corner. Exiting fullscreen.');
        exitFullscreen();
        taps = []; // Reset
    }
});