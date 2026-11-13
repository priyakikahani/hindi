/*
  Firebase setup:
  1. Create a Firebase project at https://console.firebase.google.com/
  2. Add a Web App and copy its config below.
  3. Enable Authentication > Email/Password.
  4. Create a Firestore database.
  Note: Firebase web config is public by design. Firestore Security Rules protect your data.
*/
window.FIREBASE_CONFIG = {
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

/*
  After creating your admin user in Firebase Authentication, copy that user's UID
  and paste it below. This UID is not a password or secret. Firestore rules must
  contain the same UID. Never put a service-account key in this file.
*/
window.ADMIN_UID = "PASTE_ADMIN_USER_UID";
