class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="dud">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }

    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

class WindowsDesktop {
    constructor() {
        this.windows = new Map();
        this.zIndex = 100;
        this.textScramble = null;
        this.init();
    }

    init() {
        this.showLoadingScreen();
        this.setupEventListeners();
        this.updateTime();
        this.setupWindowDragging();
        
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
    }

    showLoadingScreen() {
        // Hide loading screen after 3 seconds
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                // Remove from DOM after fade animation
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    // Start desktop text animation after loading screen is hidden
                    this.initDesktopTextAnimation();
                }, 500);
            }
        }, 3000);
    }

    initDesktopTextAnimation() {
        console.log('Initializing desktop text animation...');
        const textElement = document.querySelector('.text-scramble');
        console.log('Text element found:', textElement);
        
        if (textElement) {
            this.textScramble = new TextScramble(textElement);
            console.log('TextScramble created:', this.textScramble);
            
            // Start immediately with first phrase
            setTimeout(() => {
                this.startTextAnimation();
            }, 100);
        } else {
            console.error('Text element not found!');
        }
    }

    startTextAnimation() {
        console.log('Starting text animation...');
        const phrases = [
            'Aman Kumar',
            'AI Innovator',
            'Data Science Enthusiast',
            'Robotics Explorer',
            'Versatile Developer'
        ];

        let counter = 0;
        const next = () => {
            if (this.textScramble) {
                console.log('Setting text to:', phrases[counter]);
                this.textScramble.setText(phrases[counter]).then(() => {
                    console.log('Text animation completed for:', phrases[counter]);
                    setTimeout(next, 2000);
                });
                counter = (counter + 1) % phrases.length;
            } else {
                console.error('TextScramble not available');
            }
        };

        // Start the animation
        next();
    }

    setupEventListeners() {
        // Desktop icon clicks
        document.querySelectorAll('.icon').forEach(icon => {
            icon.addEventListener('dblclick', (e) => {
                const appName = e.currentTarget.dataset.app;
                this.openWindow(appName);
            });
        });

        // Window controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                this.closeWindow(e.target);
            } else if (e.target.classList.contains('minimize')) {
                this.minimizeWindow(e.target);
            } else if (e.target.classList.contains('maximize')) {
                this.maximizeWindow(e.target);
            }
        });

        // Taskbar app clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('taskbar-app')) {
                const windowId = e.target.dataset.window;
                this.restoreWindow(windowId);
            }
        });

        // Setup icon dragging
        this.setupIconDragging();
    }

    openWindow(appName) {
        const windowId = `${appName}-window`;
        const windowElement = document.getElementById(windowId);
        
        if (!windowElement) return;

        // If window is already open, just bring it to front
        if (!windowElement.classList.contains('hidden')) {
            this.bringToFront(windowElement);
            return;
        }

        // Show window
        windowElement.classList.remove('hidden');
        
        // Position window (cascade effect)
        const openWindows = document.querySelectorAll('.window:not(.hidden)').length;
        const offset = (openWindows - 1) * 30;
        windowElement.style.left = `${100 + offset}px`;
        windowElement.style.top = `${50 + offset}px`;
        
        // Bring to front
        this.bringToFront(windowElement);
        
        // Add to taskbar
        this.addToTaskbar(windowId, appName);
        
        // Store window reference
        this.windows.set(windowId, {
            element: windowElement,
            minimized: false,
            maximized: false
        });
    }

    closeWindow(closeBtn) {
        const windowElement = closeBtn.closest('.window');
        const windowId = windowElement.id;
        
        windowElement.classList.add('hidden');
        this.removeFromTaskbar(windowId);
        this.windows.delete(windowId);
    }

    minimizeWindow(minimizeBtn) {
        const windowElement = minimizeBtn.closest('.window');
        const windowId = windowElement.id;
        
        windowElement.classList.add('hidden');
        
        if (this.windows.has(windowId)) {
            this.windows.get(windowId).minimized = true;
        }
        
        // Update taskbar button state
        const taskbarBtn = document.querySelector(`[data-window="${windowId}"]`);
        if (taskbarBtn) {
            taskbarBtn.classList.remove('active');
        }
    }

    maximizeWindow(maximizeBtn) {
        const windowElement = maximizeBtn.closest('.window');
        const windowId = windowElement.id;
        const windowData = this.windows.get(windowId);
        
        if (!windowData) return;
        
        if (windowData.maximized) {
            // Restore
            windowElement.style.width = '';
            windowElement.style.height = '';
            windowElement.style.left = windowData.originalLeft || '100px';
            windowElement.style.top = windowData.originalTop || '50px';
            windowData.maximized = false;
        } else {
            // Maximize
            windowData.originalLeft = windowElement.style.left;
            windowData.originalTop = windowElement.style.top;
            windowElement.style.left = '0px';
            windowElement.style.top = '0px';
            windowElement.style.width = '100vw';
            windowElement.style.height = 'calc(100vh - 48px)';
            windowData.maximized = true;
        }
    }

    restoreWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        windowData.element.classList.remove('hidden');
        windowData.minimized = false;
        this.bringToFront(windowData.element);
        
        // Update taskbar button
        const taskbarBtn = document.querySelector(`[data-window="${windowId}"]`);
        if (taskbarBtn) {
            taskbarBtn.classList.add('active');
        }
    }

    bringToFront(windowElement) {
        this.zIndex++;
        windowElement.style.zIndex = this.zIndex;
        
        // Update taskbar active state
        document.querySelectorAll('.taskbar-app').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const taskbarBtn = document.querySelector(`[data-window="${windowElement.id}"]`);
        if (taskbarBtn) {
            taskbarBtn.classList.add('active');
        }
    }

    addToTaskbar(windowId, appName) {
        const taskbarApps = document.querySelector('.taskbar-apps');
        
        // Check if already exists
        if (document.querySelector(`[data-window="${windowId}"]`)) return;
        
        const taskbarApp = document.createElement('div');
        taskbarApp.className = 'taskbar-app active';
        taskbarApp.dataset.window = windowId;
        taskbarApp.textContent = appName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        taskbarApps.appendChild(taskbarApp);
    }

    removeFromTaskbar(windowId) {
        const taskbarBtn = document.querySelector(`[data-window="${windowId}"]`);
        if (taskbarBtn) {
            taskbarBtn.remove();
        }
    }

    setupWindowDragging() {
        let isDragging = false;
        let currentWindow = null;
        let startX, startY, startLeft, startTop;

        document.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-header') || 
                e.target.classList.contains('window-title')) {
                
                currentWindow = e.target.closest('.window');
                if (currentWindow && !this.windows.get(currentWindow.id)?.maximized) {
                    isDragging = true;
                    currentWindow.classList.add('dragging');
                    
                    startX = e.clientX;
                    startY = e.clientY;
                    startLeft = parseInt(currentWindow.style.left) || 0;
                    startTop = parseInt(currentWindow.style.top) || 0;
                    
                    this.bringToFront(currentWindow);
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && currentWindow) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                currentWindow.style.left = `${startLeft + deltaX}px`;
                currentWindow.style.top = `${startTop + deltaY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging && currentWindow) {
                currentWindow.classList.remove('dragging');
                isDragging = false;
                currentWindow = null;
            }
        });
    }

    setupIconDragging() {
        let isDraggingIcon = false;
        let currentIcon = null;
        let startX, startY, startLeft, startTop;
        let dragTimeout = null;

        // Helper function to get coordinates from mouse or touch event
        const getEventCoords = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        };

        // Helper function to start dragging
        const startDrag = (e, icon) => {
            if (icon && !isDraggingIcon) {
                e.preventDefault(); // Prevent default touch behavior
                
                // Set a timeout to distinguish between click/tap and drag
                dragTimeout = setTimeout(() => {
                    isDraggingIcon = true;
                    currentIcon = icon;
                    currentIcon.classList.add('dragging');
                    
                    const coords = getEventCoords(e);
                    startX = coords.x;
                    startY = coords.y;
                    startLeft = parseInt(currentIcon.style.left) || 0;
                    startTop = parseInt(currentIcon.style.top) || 0;
                }, 150);
            }
        };

        // Helper function to handle dragging
        const handleDrag = (e) => {
            if (isDraggingIcon && currentIcon) {
                e.preventDefault(); // Prevent scrolling on mobile
                
                const coords = getEventCoords(e);
                const deltaX = coords.x - startX;
                const deltaY = coords.y - startY;
                
                const iconWidth = currentIcon.offsetWidth || 80;
                const iconHeight = currentIcon.offsetHeight || 100;
                
                const newLeft = Math.max(0, Math.min(window.innerWidth - iconWidth, startLeft + deltaX));
                const newTop = Math.max(0, Math.min(window.innerHeight - iconHeight, startTop + deltaY));
                
                currentIcon.style.left = `${newLeft}px`;
                currentIcon.style.top = `${newTop}px`;
            }
        };

        // Helper function to end dragging
        const endDrag = (e) => {
            if (dragTimeout) {
                clearTimeout(dragTimeout);
                dragTimeout = null;
            }
            
            if (isDraggingIcon && currentIcon) {
                currentIcon.classList.remove('dragging');
                isDraggingIcon = false;
                currentIcon = null;
            }
        };

        // Mouse events for desktop
        document.addEventListener('mousedown', (e) => {
            const icon = e.target.closest('.icon');
            if (icon) {
                startDrag(e, icon);
            }
        });

        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', endDrag);

        // Touch events for mobile
        document.addEventListener('touchstart', (e) => {
            const icon = e.target.closest('.icon');
            if (icon) {
                startDrag(e, icon);
            }
        }, { passive: false });

        document.addEventListener('touchmove', handleDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);

        // Prevent drag from interfering with double-click/tap
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.icon')) {
                e.preventDefault();
            }
        });

        // Handle double-tap for mobile (since dblclick doesn't work well on mobile)
        let lastTapTime = 0;
        document.addEventListener('touchend', (e) => {
            const icon = e.target.closest('.icon');
            if (icon && !isDraggingIcon) {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;
                
                if (tapLength < 500 && tapLength > 0) {
                    // Double tap detected
                    const appName = icon.dataset.app;
                    this.openWindow(appName);
                }
                lastTapTime = currentTime;
            }
        });
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        const dateString = now.toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        });
        
        document.getElementById('current-time').innerHTML = `
            <div>${timeString}</div>
            <div style="font-size: 10px;">${dateString}</div>
        `;
    }
}

// Initialize the desktop when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WindowsDesktop();
});