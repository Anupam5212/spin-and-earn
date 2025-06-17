// DOM Elements
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userCoins = document.getElementById('userCoins');
const userBalance = document.getElementById('userBalance');
const profilePhoto = document.getElementById('profilePhoto');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const memberSince = document.getElementById('memberSince');
const totalSpins = document.getElementById('totalSpins');
const totalEarnings = document.getElementById('totalEarnings');
const totalReferrals = document.getElementById('totalReferrals');
const changePhotoBtn = document.getElementById('changePhoto');
const editProfileForm = document.getElementById('editProfileForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const logoutBtn = document.getElementById('logoutBtn');

// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        loadUserData(user);
    } else {
        // User is not signed in, redirect to login
        window.location.href = 'index.html';
    }
});

// Load user data
async function loadUserData(user) {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        // Update UI with user data
        userPhoto.src = user.photoURL || 'src/assets/default-avatar.png';
        userName.textContent = userData.name;
        userEmail.textContent = user.email;
        userCoins.textContent = userData.coins || 0;
        userBalance.textContent = `₹${(userData.coins || 0) * 0.1}`; // 1 coin = ₹0.1

        // Update profile section
        profilePhoto.src = user.photoURL || 'src/assets/default-avatar.png';
        profileName.textContent = userData.name;
        profileEmail.textContent = user.email;
        memberSince.textContent = new Date(user.metadata.creationTime).toLocaleDateString();
        totalSpins.textContent = userData.totalSpins || 0;
        totalEarnings.textContent = `₹${(userData.coins || 0) * 0.1}`;
        totalReferrals.textContent = userData.referrals?.length || 0;

        // Set form values
        document.getElementById('editName').value = userData.name;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editPhone').value = userData.phone || '';

    } catch (error) {
        console.error('Error loading user data:', error);
        showError('Failed to load user data. Please try again.');
    }
}

// Change profile photo
changePhotoBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Show loading state
                changePhotoBtn.disabled = true;
                changePhotoBtn.innerHTML = '<span class="material-icons">hourglass_empty</span>';

                // Upload image to Firebase Storage
                const storageRef = firebase.storage().ref();
                const photoRef = storageRef.child(`profile_photos/${firebase.auth().currentUser.uid}`);
                await photoRef.put(file);
                const photoURL = await photoRef.getDownloadURL();

                // Update user profile
                await firebase.auth().currentUser.updateProfile({ photoURL });
                await firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).update({
                    photoURL
                });

                // Update UI
                userPhoto.src = photoURL;
                profilePhoto.src = photoURL;

                showSuccess('Profile photo updated successfully!');
            } catch (error) {
                console.error('Error updating profile photo:', error);
                showError('Failed to update profile photo. Please try again.');
            } finally {
                // Reset button state
                changePhotoBtn.disabled = false;
                changePhotoBtn.innerHTML = '<span class="material-icons">photo_camera</span>';
            }
        }
    };
    input.click();
});

// Edit profile form submission
editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('editName').value;
    const newPhone = document.getElementById('editPhone').value;

    try {
        // Show loading state
        const submitBtn = editProfileForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Saving...';

        // Update user profile
        await firebase.auth().currentUser.updateProfile({ displayName: newName });
        await firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).update({
            name: newName,
            phone: newPhone
        });

        // Update UI
        userName.textContent = newName;
        profileName.textContent = newName;

        showSuccess('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile. Please try again.');
    } finally {
        // Reset button state
        const submitBtn = editProfileForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-icons">save</span> Save Changes';
    }
});

// Change password form submission
changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showError('New passwords do not match!');
        return;
    }

    try {
        // Show loading state
        const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Changing...';

        // Reauthenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            firebase.auth().currentUser.email,
            currentPassword
        );
        await firebase.auth().currentUser.reauthenticateWithCredential(credential);

        // Update password
        await firebase.auth().currentUser.updatePassword(newPassword);

        // Clear form
        changePasswordForm.reset();

        showSuccess('Password changed successfully!');
    } catch (error) {
        console.error('Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
            showError('Current password is incorrect!');
        } else {
            showError('Failed to change password. Please try again.');
        }
    } finally {
        // Reset button state
        const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-icons">lock</span> Change Password';
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showError('Failed to sign out. Please try again.');
    }
});

// Helper functions for notifications
function showSuccess(message) {
    // You can implement your preferred notification system here
    alert(message); // Basic implementation
}

function showError(message) {
    // You can implement your preferred notification system here
    alert(message); // Basic implementation
} 