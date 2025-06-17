// DOM Elements
const wheelCanvas = document.getElementById('wheelCanvas');
const spinButton = document.getElementById('spinButton');
const spinsLeft = document.getElementById('spinsLeft');
const nextSpinTime = document.getElementById('nextSpinTime');
const prizeList = document.getElementById('prizeList');
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userCoins = document.getElementById('userCoins');
const userBalance = document.getElementById('userBalance');
const logoutBtn = document.getElementById('logoutBtn');

// Canvas setup
const ctx = wheelCanvas.getContext('2d');
const centerX = wheelCanvas.width / 2;
const centerY = wheelCanvas.height / 2;
const radius = Math.min(centerX, centerY) - 10;

// Prizes configuration
const prizes = [
    { text: '10 Coins', value: 10, color: '#FFD700', probability: 0.3 },
    { text: '20 Coins', value: 20, color: '#FFA500', probability: 0.2 },
    { text: '50 Coins', value: 50, color: '#FF4500', probability: 0.1 },
    { text: '100 Coins', value: 100, color: '#FF0000', probability: 0.05 },
    { text: 'Try Again', value: 0, color: '#808080', probability: 0.35 }
];

// Wheel state
let isSpinning = false;
let currentRotation = 0;
let spinTimeout = null;

// Initialize
function init() {
    // Set canvas size
    wheelCanvas.width = 400;
    wheelCanvas.height = 400;
    
    // Draw initial wheel
    drawWheel();
    
    // Load prizes
    loadPrizes();
    
    // Check auth state
    checkAuth();
    
    // Start spin timer
    updateSpinTimer();
}

// Draw wheel
function drawWheel() {
    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    
    // Draw segments
    const segmentAngle = (2 * Math.PI) / prizes.length;
    prizes.forEach((prize, index) => {
        const startAngle = index * segmentAngle + currentRotation;
        const endAngle = startAngle + segmentAngle;
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = prize.color;
        ctx.fill();
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(prize.text, radius - 20, 5);
        ctx.restore();
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();
}

// Spin wheel
function spinWheel() {
    if (isSpinning) return;
    
    isSpinning = true;
    spinButton.disabled = true;
    
    // Get random prize based on probability
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedPrize = prizes[0];
    
    for (const prize of prizes) {
        cumulativeProbability += prize.probability;
        if (random <= cumulativeProbability) {
            selectedPrize = prize;
            break;
        }
    }
    
    // Calculate rotation
    const prizeIndex = prizes.indexOf(selectedPrize);
    const segmentAngle = (2 * Math.PI) / prizes.length;
    const targetAngle = prizeIndex * segmentAngle;
    const spinAngle = 5 * Math.PI + targetAngle; // 2.5 full rotations + target
    
    // Animate spin
    let currentAngle = 0;
    const spinDuration = 5000; // 5 seconds
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        // Easing function
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        
        currentAngle = easeOut(progress) * spinAngle;
        currentRotation = currentAngle;
        
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Spin complete
            isSpinning = false;
            spinButton.disabled = false;
            
            // Update user coins
            if (selectedPrize.value > 0) {
                updateUserCoins(selectedPrize.value);
            }
            
            // Show result
            showResult(selectedPrize);
        }
    }
    
    animate();
}

// Update user coins
async function updateUserCoins(amount) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        const currentCoins = userDoc.data().coins || 0;
        
        await userRef.update({
            coins: currentCoins + amount
        });
        
        // Add activity
        await db.collection('activities').add({
            userId: user.uid,
            type: 'spin',
            title: 'Spin Wheel Win',
            description: `Won ${amount} coins from spin wheel`,
            amount: amount,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update UI
        userCoins.textContent = currentCoins + amount;
        userBalance.textContent = `₹${((currentCoins + amount) / 10).toFixed(2)}`;
    } catch (error) {
        console.error('Error updating coins:', error);
    }
}

// Show result
function showResult(prize) {
    const message = prize.value > 0 
        ? `Congratulations! You won ${prize.value} coins!`
        : 'Better luck next time!';
    
    alert(message);
}

// Load prizes
function loadPrizes() {
    prizeList.innerHTML = prizes.map(prize => `
        <div class="prize-item">
            <span class="material-icons">monetization_on</span>
            <h4>${prize.text}</h4>
            <p>${(prize.probability * 100).toFixed(1)}% chance</p>
        </div>
    `).join('');
}

// Update spin timer
function updateSpinTimer() {
    const now = new Date();
    const nextSpin = new Date(now);
    nextSpin.setHours(now.getHours() + 1);
    nextSpin.setMinutes(0);
    nextSpin.setSeconds(0);
    
    function updateTimer() {
        const current = new Date();
        const diff = nextSpin - current;
        
        if (diff <= 0) {
            // Reset timer
            nextSpin.setHours(nextSpin.getHours() + 1);
            spinsLeft.textContent = '3';
            spinButton.disabled = false;
        } else {
            // Update display
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            nextSpinTime.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Check authentication
function checkAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                
                // Update UI
                userPhoto.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`;
                userName.textContent = user.displayName || userData.name;
                userEmail.textContent = user.email;
                userCoins.textContent = userData.coins || 0;
                userBalance.textContent = `₹${((userData.coins || 0) / 10).toFixed(2)}`;
                
                // Update spins left
                spinsLeft.textContent = userData.spinsLeft || 3;
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        } else {
            window.location.href = '/index.html';
        }
    });
}

// Event Listeners
spinButton.addEventListener('click', spinWheel);
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Initialize
init(); 