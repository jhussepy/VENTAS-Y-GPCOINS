import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyByGlMHEISpMtrXTzoqGceJ2FLWrQVwitw',
  authDomain: 'ventas-gpcoins.firebaseapp.com',
  projectId: 'ventas-gpcoins',
  storageBucket: 'ventas-gpcoins.firebasestorage.app',
  messagingSenderId: '1068376905175',
  appId: '1:1068376905175:web:38e0c7457b3f8f88802792',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const loginConGoogle = () => signInWithPopup(auth, googleProvider);
export const cerrarSesion = () => signOut(auth);
