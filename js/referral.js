// DOM Elements
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userCoins = document.getElementById('userCoins');
const userBalance = document.getElementById('userBalance');
const totalReferrals = document.getElementById('totalReferrals');
const earnedCoins = document.getElementById('earnedCoins');
const referralCode = document.getElementById('referralCode');
const copyCode = document.getElementById('copyCode');
const referralList = document.getElementById('referralList');
const logoutBtn = document.getElementById('logoutBtn');
const shareButtons = document.querySelectorAll('.share-btn');

// Constants
const REFERRAL_BONUS = 50; // Coins earned per referral
const COINS_TO_RUPEES = 10; // 10 coins = 1 rupee

// Check Authentication
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            // Update UI
            userPhoto.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`;
            userName.textContent = user.displayName || userData.name;
            userEmail.textContent = user.email;
            
            const coins = userData.coins || 0;
            const rupees = coins / COINS_TO_RUPEES;
            
            userCoins.textContent = coins;
            userBalance.textContent = `₹${rupees.toFixed(2)}`;
            
            // Set referral code
            const code = userData.referralCode || generateReferralCode(user.uid);
            referralCode.textContent = code;
            
            // Update referral stats
            const referrals = userData.referrals || 0;
            const earned = referrals * REFERRAL_BONUS;
            
            totalReferrals.textContent = referrals;
            earnedCoins.textContent = earned;
            
            // Load referral history
            loadReferralHistory(user.uid);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    } else {
        window.location.href = '/index.html';
    }
});

// Generate Referral Code
function generateReferralCode(userId) {
    const code = userId.substring(0, 6).toUpperCase();
    return code;
}

// Load Referral History
async function loadReferralHistory(userId) {
    try {
        const referrals = await db.collection('referrals')
            .where('referrerId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        referralList.innerHTML = '';
        
        if (referrals.empty) {
            referralList.innerHTML = '<p class="no-referrals">No referrals yet</p>';
            return;
        }
        
        referrals.forEach(doc => {
            const referral = doc.data();
            const referralElement = document.createElement('div');
            referralElement.className = 'referral-item';
            
            referralElement.innerHTML = `
                <div class="referral-info">
                    <div class="referral-icon">
                        <span class="material-icons">person</span>
                    </div>
                    <div class="referral-details">
                        <h4>${referral.referredName}</h4>
                        <p>${formatTimestamp(referral.timestamp)}</p>
                    </div>
                </div>
                <div class="referral-status ${referral.status}">
                    ${referral.status === 'completed' ? 'Completed' : 'Pending'}
                </div>
            `;
            
            referralList.appendChild(referralElement);
        });
    } catch (error) {
        console.error('Error loading referrals:', error);
    }
}

// Helper Functions
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Share Functions
function getShareMessage() {
    const code = referralCode.textContent;
    return `Join Spin & Earn using my referral code: ${code}\n\nSpin the wheel and win coins! Use my code to get 50 bonus coins.`;
}

function shareWhatsApp() {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/?text=${message}`);
}

function shareTelegram() {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://t.me/share/url?url=${window.location.origin}&text=${message}`);
}

function shareFacebook() {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}&quote=${message}`);
}

function shareTwitter() {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://twitter.com/intent/tweet?text=${message}`);
}

// Event Listeners
copyCode.addEventListener('click', () => {
    const code = referralCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Referral code copied to clipboard!');
    }).catch(err => {
        console.error('Error copying code:', err);
    });
});

shareButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const platform = btn.classList[1];
        switch (platform) {
            case 'whatsapp':
                shareWhatsApp();
                break;
            case 'telegram':
                shareTelegram();
                break;
            case 'facebook':
                shareFacebook();
                break;
            case 'twitter':
                shareTwitter();
                break;
        }
    });
});

logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}); 