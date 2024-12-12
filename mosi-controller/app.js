// Constants and global variables
let deferredPrompt;
const MAX_HISTORY = 5;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout for connections

// Initialize the application when the page loads
window.onload = () => {
    initializeApp();
    registerServiceWorker();
};

// Main initialization function
function initializeApp() {
    loadHistory();
    checkInstallation();
    setupEventListeners();
    handlePlatformSpecifics();
}

// Setup all event listeners
function setupEventListeners() {
    // Add Enter key support for serial input
    document.getElementById('serialNumber').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            connect();
        }
    });

    // Add input validation
    document.getElementById('serialNumber').addEventListener('input', (e) => {
        const input = e.target;
        const value = input.value.toUpperCase();
        input.value = value;
        validateSerialInput(value);
    });

    // Install button event listener
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.addEventListener('click', handleInstallClick);
    }
}

// Register service worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker registration successful:', registration);
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
        }
    }
}

// Handle platform-specific features
function handlePlatformSpecifics() {
    if (isIOS && !isInStandaloneMode()) {
        showIOSInstallHint();
    }

    // Handle PWA installation prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installButton').style.display = 'block';
    });
}

// Check if running in standalone mode
function isInStandaloneMode() {
    return (window.matchMedia('(display-mode: standalone)').matches) ||
           (window.navigator.standalone) ||
           document.referrer.includes('android-app://');
}

// Check installation status
function checkInstallation() {
    const installButton = document.getElementById('installButton');
    const iosInstallHint = document.getElementById('iosInstallHint');

    if (window.matchMedia('(display-mode: standalone)').matches) {
        if (installButton) installButton.style.display = 'none';
        if (iosInstallHint) iosInstallHint.style.display = 'none';
    }
}

// Show iOS installation hint
function showIOSInstallHint() {
    const hint = document.getElementById('iosInstallHint');
    if (hint) {
        hint.style.display = 'block';
        
        // Hide hint when user taps anywhere else
        document.addEventListener('click', (e) => {
            if (!hint.contains(e.target)) {
                hint.style.display = 'none';
            }
        });
    }
}

// Handle install button click
async function handleInstallClick() {
    if (!deferredPrompt) return;
    
    try {
        const result = await deferredPrompt.prompt();
        console.log(`Installation prompt result: ${result.outcome}`);
        
        if (result.outcome === 'accepted') {
            console.log('User accepted installation');
        }
    } catch (error) {
        console.error('Install prompt error:', error);
    } finally {
        deferredPrompt = null;
        document.getElementById('installButton').style.display = 'none';
    }
}

// Validate serial number input
function validateSerialInput(value) {
    const connectButton = document.getElementById('connectButton');
    const statusDiv = document.getElementById('status');
    const isValid = /^EM\d{0,4}$/.test(value);
    
    if (!isValid && value !== '') {
        statusDiv.textContent = 'Invalid format. Use EMxxxx format.';
        connectButton.disabled = true;
    } else {
        statusDiv.textContent = '';
        connectButton.disabled = false;
    }
}

// Load connection history
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('connectionHistory') || '[]');
    updateHistoryDisplay(history);
}

// Update history display
function updateHistoryDisplay(history) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    history.forEach(serial => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const serialText = document.createElement('span');
        serialText.textContent = serial;
        
        const connectBtn = document.createElement('button');
        connectBtn.textContent = 'Connect';
        connectBtn.onclick = () => {
            document.getElementById('serialNumber').value = serial;
            connect();
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            removeFromHistory(serial);
        };
        
        li.appendChild(serialText);
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        buttonGroup.appendChild(connectBtn);
        buttonGroup.appendChild(deleteBtn);
        li.appendChild(buttonGroup);
        
        historyList.appendChild(li);
    });
}

// Add device to history
function addToHistory(serial) {
    let history = JSON.parse(localStorage.getItem('connectionHistory') || '[]');
    history = history.filter(item => item !== serial);
    history.unshift(serial);
    history = history.slice(0, MAX_HISTORY);
    localStorage.setItem('connectionHistory', JSON.stringify(history));
    updateHistoryDisplay(history);
}

// Remove device from history
function removeFromHistory(serial) {
    let history = JSON.parse(localStorage.getItem('connectionHistory') || '[]');
    history = history.filter(item => item !== serial);
    localStorage.setItem('connectionHistory', JSON.stringify(history));
    updateHistoryDisplay(history);
}

// Main connect function
async function connect() {
    const serialNumber = document.getElementById('serialNumber').value.trim();
    const statusDiv = document.getElementById('status');
    const connectButton = document.getElementById('connectButton');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (!/^EM\d{4}$/.test(serialNumber)) {
        statusDiv.textContent = 'Invalid serial number format. Use EMxxxx format.';
        return;
    }

    connectButton.disabled = true;
    loadingOverlay.style.display = 'flex';
    statusDiv.textContent = 'Connecting...';

    try {
        // Try HTTPS first, then HTTP
        const protocols = ['https', 'http'];
        let connected = false;
        let finalUrl;

        for (const protocol of protocols) {
            const url = `${protocol}://${serialNumber.toLowerCase()}.local`;
            connected = await tryConnect(url);
            if (connected) {
                finalUrl = url;
                break;
            }
        }

        if (connected) {
            addToHistory(serialNumber);
            statusDiv.textContent = 'Connected! Redirecting...';
            window.location.href = finalUrl;
        } else {
            throw new Error('Connection failed');
        }
    } catch (error) {
        statusDiv.textContent = 'Could not connect. Please check if the device is powered on and connected to the network.';
        console.error('Connection error:', error);
    } finally {
        connectButton.disabled = false;
        loadingOverlay.style.display = 'none';
    }
}

// Try to connect to a specific URL
async function tryConnect(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);

        const response = await fetch(url, {
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return true;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log(`Connection timeout for ${url}`);
        } else {
            console.log(`Connection attempt failed for ${url}:`, error);
        }
        return false;
    }
}

// Handle online/offline status
window.addEventListener('online', () => {
    document.getElementById('status').textContent = 'Network connection restored';
    setTimeout(() => {
        document.getElementById('status').textContent = '';
    }, 3000);
});

window.addEventListener('offline', () => {
    document.getElementById('status').textContent = 'Network connection lost';
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadHistory();  // Refresh history when tab becomes visible
    }
});
