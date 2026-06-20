import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBYu89dxZ2p0S2_mopBu18RCin_8eWa1XI",
  authDomain: "acdex-41c97.firebaseapp.com",
  projectId: "acdex-41c97",
  storageBucket: "acdex-41c97.firebasestorage.app",
  messagingSenderId: "589952766141",
  appId: "1:589952766141:web:7517ca4e9a2609ab34a7d4"
}

const app = initializeApp(firebaseConfig)
const auth = window.firebaseAuth
const googleProvider = new window.GoogleAuthProvider()

export const loginWithGoogle = () => window.signInWithPopup(auth, googleProvider)
export const loginWithEmail = (email, password) => window.signInWithEmailAndPassword(auth, email, password)
export const registerWithEmail = (email, password) => window.createUserWithEmailAndPassword(auth, email, password)
export const logoutUser = () => window.signOut(auth)
export { auth }