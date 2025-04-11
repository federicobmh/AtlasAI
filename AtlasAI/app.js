// Firebase Configuration (Insert your Firebase credentials here)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;

// Sign in with Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      currentUser = result.user;
      loadNotesForUser();
      document.getElementById("login-section").style.display = "none";
    })
    .catch(error => alert(error.message));
}

// Sign in with Email/Password
function signInWithEmail() {
  const email = prompt("Enter your email:");
  const password = prompt("Enter your password:");
  auth.signInWithEmailAndPassword(email, password)
    .then(result => {
      currentUser = result.user;
      loadNotesForUser();
      document.getElementById("login-section").style.display = "none";
    })
    .catch(error => alert(error.message));
}

// Sign out
function signOut() {
  auth.signOut()
    .then(() => {
      currentUser = null;
      document.getElementById("login-section").style.display = "block";
    })
    .catch(error => alert(error.message));
}

// Save slot to Firebase
function saveSlot() {
  if (!currentUser) return alert("Please log in first!");

  const name = document.getElementById("slotName").value.trim();
  const content = document.getElementById("infoInput").value;
  const tag = document.getElementById("noteTag").value.trim();
  if (!name) return alert("Enter a slot name!");

  db.ref('users/' + currentUser.uid + '/notes/' + name).set({ content, tag });
  alert("Memory saved to Firebase as: " + name);
}

// Load slot from Firebase
function loadSlot() {
  if (!currentUser) return alert("Please log in first!");

  const name = document.getElementById("slotName").value.trim();
  if (!name) return alert("Enter a slot name!");

  db.ref('users/' + currentUser.uid + '/notes/' + name).get()
    .then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("infoInput").value = data.content;
        document.getElementById("noteTag").value = data.tag || "";
      } else {
        alert("No memory found with that name.");
      }
    })
    .catch(error => alert(error.message));
}

// Respond to question
function respondToQuestion() {
  const info = document.getElementById("infoInput").value.trim();
  const question = document.getElementById("questionInput").value.trim();
  const responseArea = document.getElementById("botResponse");

  if (!info || !question) {
    responseArea.innerHTML = "Please enter notes and a question.";
    return;
  }

  const sentences = info.match(/[^.!?]+[.!?]/g) || [info];
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const sentenceScores = [];

  for (let sentence of sentences) {
    let score = 0;
    for (let word of questionWords) {
      const regex = new RegExp("\\b" + word + "\\b", "gi");
      const matches = sentence.match(regex);
      if (matches) score += matches.length;
    }
    sentenceScores.push({ sentence, score });
  }

  sentenceScores.sort((a, b) => b.score - a.score);
  const bestMatch = sentenceScores.find(s => s.score > 0);

  if (bestMatch) {
    const highlighted = highlightKeywords(bestMatch.sentence, questionWords);
    responseArea.innerHTML = highlighted;
  } else {
    responseArea.innerHTML = "No strong matches found.";
  }
}

function highlightKeywords(sentence, keywords) {
  let highlighted = sentence;
  for (let word of keywords) {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    highlighted = highlighted.replace(regex, '<span class="highlight">$1</span>');
  }
  return highlighted;
}

// Dark mode toggle
function toggleDarkMode() {
  const isDark = document.body.style.getPropertyValue("--bg") === "#1e1e1e";
  document.body.style.setProperty("--bg", isDark ? "#f5f5f5" : "#1e1e1e");
  document.body.style.setProperty("--text", isDark ? "#000" : "#fff");
}
