import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDNvPoMDx5jvktqjGKNqhmtWb_BnvHLS60",
  authDomain: "rfeapp-33a60.firebaseapp.com",
  projectId: "rfeapp-33a60",
  storageBucket: "rfeapp-33a60.firebasestorage.app",
  messagingSenderId: "44123509350",
  appId: "1:44123509350:web:f8be2e9b998738cea193a7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ──────────────────────────────────────

export const emailLogin = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const emailSignup = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const googleLogin = () => signInWithPopup(auth, googleProvider);

export const logout = () => signOut(auth);

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export { auth };
export type { User };
