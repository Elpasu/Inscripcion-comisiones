// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCz3jiNOYsBbCCXfkybKDMITPfKcyv995o",
  authDomain: "reordenar-qo1.firebaseapp.com",
  projectId: "reordenar-qo1",
  storageBucket: "reordenar-qo1.firebasestorage.app",
  messagingSenderId: "923104825774",
  appId: "1:923104825774:web:cf1521d2ee66cf5900f83f",
  measurementId: "G-546RTGJS0C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
