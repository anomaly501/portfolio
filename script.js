document.addEventListener('DOMContentLoaded', () => {
    const desktop = document.querySelector('.desktop');
    const icons = document.querySelectorAll('.icon');
    const taskbarClock = document.querySelector('.taskbar .clock');
    let highestZIndex = 10;

    // --- Window Functionality ---
    icons.forEach(icon => {
        icon.addEventListener('dblclick', () => {
            const windowId = icon.dataset.window;
            const windowEl = document.getElementById(`${windowId}-window`);
            if (windowEl) {
                windowEl.style.display = 'flex';
                bringToFront(windowEl);
            }
        });
    });

    // Handle closing, minimizing, and maximizing
    document.querySelectorAll('.window').forEach(windowEl => {
        const closeBtn = windowEl.querySelector('.close');
        const minimizeBtn = windowEl.querySelector('.minimize');
        const maximizeBtn = windowEl.querySelector('.maximize');

        closeBtn.addEventListener('click', () => {
            windowEl.style.display = 'none';
        });

        // Add event listeners for minimize and maximize
    });

    // --- Dragging Functionality ---
    document.querySelectorAll('.title-bar').forEach(titleBar => {
        let isDragging = false;
        let offset = { x: 0, y: 0 };
        const windowEl = titleBar.closest('.window');

        titleBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            highestZIndex++;
            windowEl.style.zIndex = highestZIndex;

            offset.x = e.clientX - windowEl.offsetLeft;
            offset.y = e.clientY - windowEl.offsetTop;

            titleBar.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            windowEl.style.left = `${e.clientX - offset.x}px`;
            windowEl.style.top = `${e.clientY - offset.y}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            titleBar.style.cursor = 'grab';
        });
    });

    // --- Real-time Clock ---
    function updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        taskbarClock.textContent = `${time} | ${date}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Function to bring a window to the front
    function bringToFront(windowEl) {
        highestZIndex++;
        windowEl.style.zIndex = highestZIndex;
    }
});