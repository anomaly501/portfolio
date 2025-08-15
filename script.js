// --- Canvas Setup ---
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
let width, height;

// --- Simulation Parameters ---
const resolution = 25; // The distance between vectors in the grid
const particleCount = 1500; // Increased particle count for a clearer flow
let field = [];
let particles = [];

// --- Mouse Interaction ---
const mouse = {
    x: null,
    y: null,
};

// --- Particle Class ---
class Particle {
    constructor() {
        this.reset();
    }

    // Reset particle to a random position
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.speed = Math.random() * 1.5 + 0.5; // Add random speed
        this.life = Math.random() * 300 + 100; // Lifespan of the particle
        this.initialLife = this.life;
    }

    // Update particle position and state
    update() {
        // Get the column and row in the vector field grid
        const col = Math.floor(this.x / resolution);
        const row = Math.floor(this.y / resolution);

        // Ensure the particle is within the grid bounds
        if (col >= 0 && col < Math.ceil(width / resolution) && row >= 0 && row < Math.ceil(height / resolution)) {
            const index = col + row * Math.ceil(width / resolution);
            const angle = field[index];

            // Calculate movement based on field angle and speed
            let moveX = Math.cos(angle) * this.speed;
            let moveY = Math.sin(angle) * this.speed;

            moveX += (Math.random() - 0.5) * 0.5;
            moveY += (Math.random() - 0.5) * 0.5;
            
            this.x += moveX;
            this.y += moveY;

        } else {
            this.reset();
        }
        
        this.life--;

        if (this.life <= 0) {
            this.reset();
        }
    }

    // Draw the particle on the canvas
    draw() {
        const alpha = this.life / this.initialLife;
        ctx.fillStyle = `rgba(220, 240, 255, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- Vector Field Functions ---

/**
 * Initializes the vector field grid. This still happens in the background
 * to guide the particles, but it is not drawn.
 */
function initField() {
    const cols = Math.ceil(width / resolution);
    const rows = Math.ceil(height / resolution);
    field = new Array(cols * rows);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const index = x + y * cols;
            const angle = (Math.cos(x * 0.1) + Math.sin(y * 0.1)) * Math.PI;
            field[index] = angle;
        }
    }
}

/**
 * Updates the vector field based on the mouse position.
 * Vectors will now point towards the mouse cursor.
 */
function updateField() {
    const cols = Math.ceil(width / resolution);
    const rows = Math.ceil(height / resolution);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const gridX = x * resolution + resolution / 2;
            const gridY = y * resolution + resolution / 2;
            const index = x + y * cols;

            if (mouse.x !== null) {
                // *** MODIFIED LOGIC ***
                // If mouse is on screen, make all vectors point towards it.
                const dx = mouse.x - gridX;
                const dy = mouse.y - gridY;
                const angle = Math.atan2(dy, dx);
                field[index] = angle;
            } else {
                // Otherwise, use the default swirling pattern
                const angle = (Math.cos(gridX * 0.02) + Math.sin(gridY * 0.02)) * 2;
                field[index] = angle;
            }
        }
    }
}

// --- Main Animation Loop ---
function animate() {
    // Clear the canvas with a slight fade effect to create trails
    ctx.fillStyle = 'rgba(12, 12, 30, 0.1)';
    ctx.fillRect(0, 0, width, height);

    updateField(); // Update field based on mouse

    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    // Draw a small circle at the mouse position to act as a custom cursor
    if(mouse.x !== null) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }


    requestAnimationFrame(animate);
}

// --- Initialization and Event Listeners ---
function setup() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    initField();

    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

window.addEventListener('resize', setup);

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// --- Start the simulation ---
setup();
animate();
