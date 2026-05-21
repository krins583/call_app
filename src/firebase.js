import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5hV8gqbJfDzJpN0MlZzxSwYaY2xzFPys",
  authDomain: "callapp-605a7.firebaseapp.com",
  projectId: "callapp-605a7",
  storageBucket: "callapp-605a7.firebasestorage.app",
  messagingSenderId: "940916032911",
  appId: "1:940916032911:web:c828738d3234902ffbf7fa"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);