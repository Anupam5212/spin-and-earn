// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCHtezb1FiBiNX3MldAAlmNguQUzGcG_Dw",
    authDomain: "spin-and-earn-1cdac.firebaseapp.com",
    databaseURL: "https://spin-and-earn-1cdac-default-rtdb.firebaseio.com",
    projectId: "spin-and-earn-1cdac",
    storageBucket: "spin-and-earn-1cdac.firebasestorage.app",
    messagingSenderId: "300271267295",
    appId: "1:300271267295:web:d5d91350cada84afa1e86a",
    measurementId: "G-J8X2JQG5ZN"
  };
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.auth = auth;
window.db = db; 