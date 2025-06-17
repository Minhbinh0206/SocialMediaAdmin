// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // ✅ THÊM DÒNG NÀY

const firebaseConfig = {
  apiKey: "AIzaSyCrmDM-bRdXKE8nEyrtzGFgPRQzMkvmrwI",
  authDomain: "socialmediatdcproject.firebaseapp.com",
  databaseURL: "https://socialmediatdcproject-default-rtdb.firebaseio.com",
  projectId: "socialmediatdcproject",
  storageBucket: "socialmediatdcproject.appspot.com",
  messagingSenderId: "988543292431",
  appId: "1:878251601548:android:b26b272ad6f008acaed5a9"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app); // ✅ THÊM DÒNG NÀY

export { auth, database, storage }; // ✅ THÊM storage VÀO EXPORT
