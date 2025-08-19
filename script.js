class WindowsDesktop {
    constructor() {
        this.windows = new Map();
        this.zIndex = 100;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.setupWindowDragging();
        
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
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

        document.addEventListener('mousedown', (e) => {
            const icon = e.target.closest('.icon');
            if (icon && !isDraggingIcon) {
                // Set a timeout to distinguish between click and drag
                dragTimeout = setTimeout(() => {
                    isDraggingIcon = true;
                    currentIcon = icon;
                    currentIcon.classList.add('dragging');
                    
                    startX = e.clientX;
                    startY = e.clientY;
                    startLeft = parseInt(currentIcon.style.left) || 0;
                    startTop = parseInt(currentIcon.style.top) || 0;
                }, 150);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingIcon && currentIcon) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                const newLeft = Math.max(0, Math.min(window.innerWidth - 80, startLeft + deltaX));
                const newTop = Math.max(0, Math.min(window.innerHeight - 120, startTop + deltaY));
                
                currentIcon.style.left = `${newLeft}px`;
                currentIcon.style.top = `${newTop}px`;
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (dragTimeout) {
                clearTimeout(dragTimeout);
                dragTimeout = null;
            }
            
            if (isDraggingIcon && currentIcon) {
                currentIcon.classList.remove('dragging');
                isDraggingIcon = false;
                currentIcon = null;
            }
        });

        // Prevent drag from interfering with double-click
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.icon')) {
                e.preventDefault();
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