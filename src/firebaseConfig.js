export const firebaseConfig = {
  apiKey: "AIzaSyCaq6HwJCWmdu6Sj6dFHiC3ybgb1FiWlxw",
  authDomain: "next-step-rad.firebaseapp.com",
  projectId: "next-step-rad",
  storageBucket: "next-step-rad.firebasestorage.app",
  messagingSenderId: "986424146895",
  appId: "1:986424146895:web:9d50040123be6ef5bcf0ba",
  measurementId: "G-VVZ6WRDRP9",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);
