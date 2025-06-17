// DOM Elements
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userCoins = document.getElementById('userCoins');
const userBalance = document.getElementById('userBalance');
const availableBalance = document.getElementById('availableBalance');
const withdrawBtn = document.getElementById('withdrawBtn');
const withdrawalForm = document.getElementById('withdrawalForm');
const withdrawForm = document.getElementById('withdrawForm');
const paymentMethod = document.getElementById('paymentMethod');
const upiGroup = document.getElementById('upiGroup');
const paytmGroup = document.getElementById('paytmGroup');
const transactionList = document.getElementById('transactionList');
const logoutBtn = document.getElementById('logoutBtn');

// Constants
const MIN_WITHDRAWAL = 10; // Minimum withdrawal amount in rupees
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
            availableBalance.textContent = `₹${rupees.toFixed(2)}`;
            
            // Enable/disable withdraw button
            withdrawBtn.disabled = rupees < MIN_WITHDRAWAL;
            
            // Load transactions
            loadTransactions(user.uid);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    } else {
        window.location.href = '/index.html';
    }
});

// Load Transactions
async function loadTransactions(userId) {
    try {
        const transactions = await db.collection('transactions')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        transactionList.innerHTML = '';
        
        if (transactions.empty) {
            transactionList.innerHTML = '<p class="no-transactions">No transactions yet</p>';
            return;
        }
        
        transactions.forEach(doc => {
            const transaction = doc.data();
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction-item';
            
            const isWithdrawal = transaction.type === 'withdrawal';
            const amount = isWithdrawal ? -transaction.amount : transaction.amount;
            
            transactionElement.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-icon">
                        <span class="material-icons">${getTransactionIcon(transaction.type)}</span>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.title}</h4>
                        <p>${formatTimestamp(transaction.timestamp)}</p>
                    </div>
                </div>
                <div class="transaction-amount ${amount >= 0 ? 'positive' : 'negative'}">
                    ${amount >= 0 ? '+' : ''}₹${Math.abs(amount).toFixed(2)}
                </div>
            `;
            
            transactionList.appendChild(transactionElement);
        });
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Helper Functions
function getTransactionIcon(type) {
    const icons = {
        'spin': 'casino',
        'withdrawal': 'account_balance_wallet',
        'referral': 'people',
        'bonus': 'card_giftcard'
    };
    return icons[type] || 'info';
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Event Listeners
withdrawBtn.addEventListener('click', () => {
    withdrawalForm.style.display = withdrawalForm.style.display === 'none' ? 'block' : 'none';
});

paymentMethod.addEventListener('change', () => {
    const method = paymentMethod.value;
    upiGroup.style.display = method === 'upi' ? 'block' : 'none';
    paytmGroup.style.display = method === 'paytm' ? 'block' : 'none';
});

withdrawForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const method = document.getElementById('paymentMethod').value;
    const upiId = document.getElementById('upiId').value;
    const paytmNumber = document.getElementById('paytmNumber').value;
    
    if (amount < MIN_WITHDRAWAL) {
        alert(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`);
        return;
    }
    
    const coins = amount * COINS_TO_RUPEES;
    
    try {
        const user = auth.currentUser;
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        
        if (userData.coins < coins) {
            alert('Insufficient balance');
            return;
        }
        
        // Create withdrawal request
        await db.collection('withdrawals').add({
            userId: user.uid,
            amount: amount,
            coins: coins,
            method: method,
            upiId: upiId,
            paytmNumber: paytmNumber,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update user coins
        await userRef.update({
            coins: userData.coins - coins
        });
        
        // Add transaction
        await db.collection('transactions').add({
            userId: user.uid,
            type: 'withdrawal',
            title: 'Withdrawal Request',
            description: `Withdrawal of ₹${amount} via ${method.toUpperCase()}`,
            amount: amount,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Withdrawal request submitted successfully!');
        withdrawalForm.style.display = 'none';
        withdrawForm.reset();
        
        // Reload page to update balance
        location.reload();
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        alert('Error processing withdrawal. Please try again.');
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}); 