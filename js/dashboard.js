// DOM Elements
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userCoins = document.getElementById('userCoins');
const userBalance = document.getElementById('userBalance');
const totalSpins = document.getElementById('totalSpins');
const totalEarnings = document.getElementById('totalEarnings');
const totalReferrals = document.getElementById('totalReferrals');
const availableBalance = document.getElementById('availableBalance');
const activityList = document.getElementById('activityList');
const logoutBtn = document.getElementById('logoutBtn');

// Check Authentication
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in
        try {
            // Get user data from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();

            // Update UI with user data
            userPhoto.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`;
            userName.textContent = user.displayName || userData.name;
            userEmail.textContent = user.email;
            userCoins.textContent = userData.coins || 0;
            userBalance.textContent = `₹${(userData.coins / 10).toFixed(2)}`;

            // Update stats
            totalSpins.textContent = userData.totalSpins || 0;
            totalEarnings.textContent = `₹${((userData.totalEarnings || 0) / 10).toFixed(2)}`;
            totalReferrals.textContent = userData.referrals || 0;
            availableBalance.textContent = `₹${((userData.coins || 0) / 10).toFixed(2)}`;

            // Load recent activity
            loadRecentActivity(user.uid);
        } catch (error) {
            console.error('Error loading user data:', error);
            alert('Error loading user data. Please try again.');
        }
    } else {
        // User is signed out, redirect to login
        window.location.href = '/index.html';
    }
});

// Load Recent Activity
async function loadRecentActivity(userId) {
    try {
        const activities = await db.collection('activities')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        activityList.innerHTML = '';
        
        if (activities.empty) {
            activityList.innerHTML = '<p class="no-activity">No recent activity</p>';
            return;
        }

        activities.forEach(doc => {
            const activity = doc.data();
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            activityElement.innerHTML = `
                <div class="activity-icon">
                    <span class="material-icons">${getActivityIcon(activity.type)}</span>
                </div>
                <div class="activity-details">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <small>${formatTimestamp(activity.timestamp)}</small>
                </div>
                <div class="activity-amount ${activity.amount >= 0 ? 'positive' : 'negative'}">
                    ${activity.amount >= 0 ? '+' : ''}${activity.amount} coins
                </div>
            `;
            activityList.appendChild(activityElement);
        });
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// Helper Functions
function getActivityIcon(type) {
    const icons = {
        'spin': 'casino',
        'referral': 'people',
        'withdrawal': 'account_balance_wallet',
        'bonus': 'card_giftcard'
    };
    return icons[type] || 'info';
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}); 