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