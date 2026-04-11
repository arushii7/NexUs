// ===== NexUs main.js =====
//firebase setup
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
  addDoc, 
  collection, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getDocs, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



const firebaseConfig = {
  apiKey: "AIzaSyC7qH4c4QVLjCDI3LMEG4q_Oev73tXVIjQ",
  authDomain: "nexus-test1byarushi.firebaseapp.com",
  projectId: "nexus-test1byarushi",
  storageBucket: "nexus-test1byarushi.firebasestorage.app",
  messagingSenderId: "161545669387",
  appId: "1:161545669387:web:c506030631cd8c4698700e",
  measurementId: "G-SZLMWGEL2G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
import { setPersistence, browserLocalPersistence }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

setPersistence(auth, browserLocalPersistence);
const db = getFirestore(app);

// ---- Toast ----
function showToast(msg, duration = 2500) {
  let t = document.getElementById('nexus-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'nexus-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

function initOnboarding() {
  const form = document.getElementById("onboarding-form");
  if (!form) return;

  const auth = getAuth();

  // show email
  const user = auth.currentUser;
  if (user) {
    const el = document.getElementById("display-email");
    if (el) el.textContent = user.email;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Not logged in");
      return;
    }

    const name = document.getElementById("ob-name").value;
    const year = document.getElementById("ob-year").value;
    const course = document.getElementById("ob-course").value;
    const about = document.getElementById("ob-about").value;

    try {
      await setDoc(doc(db, "users", user.uid), {
        name,
        year,
        course,
        about,
        email: user.email,
        onboardingcomplete: true,
        createdAt: new Date()
      }, { merge: true });

      window.location.href = "home.html";

    } catch (err) {
      alert(err.message);
    }
  });
}
//feed
async function loadFeed() {
  const postsContainer = document.getElementById("posts");
  if (!postsContainer) return;

  postsContainer.innerHTML = "";

  const params = new URLSearchParams(window.location.search);
  const filterTag = params.get("tag");

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const id = docSnap.id;
    const post = docSnap.data();
    const tag = post.tags?.[0] || "general";

    if (filterTag && tag !== filterTag) continue;

    // 🔥 fetch user properly
    let name = "User";
    if (post.uid) {
      try {
        const userRef = doc(db, "users", post.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          name = userSnap.data().name || "User";
        }
      } catch (err) {
        console.log("user fetch failed", err);
      }
    }

    const el = document.createElement("div");
    el.className = "post-card fade-in";

    el.innerHTML = `
      <div class="post-header">
        <span class="post-tag tag-${tag}">${tag}</span>
        <div class="post-author">${name}</div>
      </div>

      <div class="post-title">${post.title || ""}</div>

      ${
        tag === "resources" && post.fileUrl
          ? `
          <div class="resource-card">
            📎 ${post.fileName || post.title}
            <button onclick="event.stopPropagation(); window.open('${post.fileUrl}')">
              ⬇ Download
            </button>
          </div>
        `
          : `
          <div class="post-body">${post.content || ""}</div>
        `
      }
    `;

    el.addEventListener("click", () => {
      window.location.href = `post.html?id=${id}`;
    });

    postsContainer.appendChild(el);
  }
}
//load post wala page
async function loadPostPage() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  if (!postId) return;

  const snap = await getDoc(doc(db, "posts", postId));
  if (!snap.exists()) return;

  const post = snap.data();

  document.querySelector("h1").textContent = post.title;
  document.querySelector(".post-body-full").textContent = post.content;
  document.querySelector(".post-tag").textContent =
    post.tags?.[0] || "general";
    loadComments(postId);  
}
//profile 

function loadProfile() {
  const profile = document.querySelector(".profile-name");
  if (!profile) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;

    const data = snap.data();

    document.querySelector(".profile-name").textContent = data.name;
    document.querySelector(".profile-sub").textContent =
      `${data.course} · ${data.year}`;

    const fields = document.querySelectorAll(".info-field");

    fields[0].textContent = data.about;
    fields[1].textContent = data.name;
    fields[2].textContent = data.year;
    fields[3].textContent = data.course;
  });
}


// ---- Tab Bar ----
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const href = btn.dataset.href;
      if (href) {
        window.location.href = href;
      }
    });
  });
}

// ---- Like / Bookmark toggles ----
function initPostActions() {
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.classList.toggle('active');
      const count = btn.querySelector('.like-count');
      if (count) {
        let n = parseInt(count.textContent) || 0;
        count.textContent = btn.classList.contains('active') ? n + 1 : Math.max(0, n - 1);
      }
    });
  });
  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.classList.toggle('active');
      showToast(btn.classList.contains('active') ? 'Post saved!' : 'Post unsaved');
    });
  });
}

// ---- Toggle switches ----
function initToggles() {
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => t.classList.toggle('on'));
  });
}

// ---- Modal close ----
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('open');
    });
  });
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modalOpen;
      const modal = document.getElementById(id);
      if (modal) modal.classList.add('open');
    });
  });
}

// ---- Post click -> post.html ----
function initPostLinks() {
  document.querySelectorAll('.post-card[data-post-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      window.location.href = 'post.html';
    });
  });
  document.querySelectorAll('.resource-card[data-resource-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      window.location.href = 'resource-view.html';
    });
  });
}

// ---- Load more ----
function initLoadMore() {
  const btn = document.getElementById('load-more-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.textContent = 'Loading...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = "That's all for now!";
      showToast("No more posts to load");
    }, 800);
  });
}

// ---- Login ----
function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();

    // allow only bennett emails
    if (!email.endsWith("@bennett.edu.in")) {
      alert("Only Bennett emails allowed");
      return;
    }

    const actionCodeSettings = {
      url: window.location.origin + "/login.html",
      handleCodeInApp: true
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem('emailForSignIn', email);
      alert("Login link sent to your Bennett email");
    } catch (error) {
      alert(error.message);
    }
  });
}
// ---- Create Post ----
function initCreatePost() {
  const form = document.getElementById('create-post-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Not logged in");
      return;
    }

    const title = form.querySelector('input').value;
    const content = form.querySelector('textarea').value;

    const tags = [...form.querySelectorAll('input[name="tag"]:checked')]
      .map(t => t.value);

    try {
      await addDoc(collection(db, "posts"), {
        title,
        content,
        tags,
        uid: user.uid,
        createdAt: serverTimestamp(),
        likes: 0
      });

      showToast("Post published 🚀");
      window.location.href = "home.html";

    } catch (err) {
      alert(err.message);
    }
  });
}

// ---- Upload Resource ----
function initUploadResource() {
  const form = document.getElementById("upload-resource-form");
  if (!form) return;

  AWS.config.update({ //update token from aws before opening this NO MATTER WHAT! 
    region: "us-east-1",
    accessKeyId: "",
    secretAccessKey: "",
    sessionToken: ""
  });

  const s3 = new AWS.S3();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Not logged in");
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading to cloud...";

    // ✅ SAFE FIELD ACCESS (no index nonsense)
    const title = form.querySelectorAll("input[type='text']")[0]?.value || "";
    const subject = form.querySelectorAll("input[type='text']")[1]?.value || "";
    const year = form.querySelector("select")?.value || "";

    const file = document.getElementById("resource-file").files[0];

    if (!file) {
      alert("Select a file");
      submitBtn.disabled = false;
      submitBtn.textContent = "Upload Resource";
      return;
    }

    const fileKey = `resources/${Date.now()}_${file.name}`;

    try {
      // ☁️ upload to S3
      const upload = await s3.upload({
        Bucket: "nexus-resources-arushi",
        Key: fileKey,
        Body: file,
        ContentType: file.type
      }).promise();

      const fileUrl = upload.Location;

      // 🔥 save metadata to Firestore
      await addDoc(collection(db, "posts"), {
        title,
        subject,
        year,
        fileUrl,
        fileName: file.name,
        tags: ["resources"],
        uid: user.uid,
        content: `📎 ${file.name}`,
        createdAt: serverTimestamp()
      });

      showToast("Resource uploaded! 📎");

      setTimeout(() => {
        window.location.href = "home.html?tag=resources";
      }, 1000);

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      alert(err.message || "Upload failed");

      submitBtn.disabled = false;
      submitBtn.textContent = "Upload Resource";
    }
  });
}
// ---- Edit Profile 
function initEditProfile() {
  const form = document.getElementById("edit-profile-form");
  if (!form) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    // show logged in email
    const emailInput = document.getElementById("email");
    if (emailInput) emailInput.value = user.email;

    // preload existing data
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();

      document.getElementById("displayName").value = data.name || "";
      document.getElementById("about").value = data.about || "";
      document.getElementById("year").value = data.year || "";
      document.getElementById("course").value = data.course || "";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    const name = document.getElementById("displayName").value;
    const about = document.getElementById("about").value;
    const year = document.getElementById("year").value;
    const course = document.getElementById("course").value;

    await setDoc(doc(db, "users", user.uid), {
      name,
      about,
      year,
      course
    }, { merge: true });

    showToast("Profile updated!");
    setTimeout(() => {
      window.location.href = "profile.html";
    }, 600);
  });
}
//show user posts on profile
function loadUserPosts() {
  const container = document.getElementById("user-posts");
  if (!container) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    container.innerHTML = "";

    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      const post = doc.data();
      const id = doc.id;
      if (post.uid !== user.uid) return;

      const tag = post.tags?.[0] || "general";

      const el = document.createElement("div");
      el.className = "post-card fade-in";

      el.innerHTML = `
        <div class="post-header">
          <span class="post-tag tag-${tag}">${tag}</span>
          <div class="post-author">You</div>
        </div>
        <div class="post-body">${post.content}</div>
      `;

      el.addEventListener("click", () => {
  window.location.href = `post.html?id=${id}`;
});

      container.appendChild(el);
    });
  });
}

// ---- Report Post ----
function initReportPost() {
  const form = document.getElementById('report-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    showToast('Report submitted. Thank you!');
    setTimeout(() => window.location.href = 'home.html', 1200);
  });
}

// ---- Comment Submit ----
function initComments() {
  const form = document.getElementById("comment-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const input = form.querySelector("input");
    const text = input.value.trim();
    if (!text) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get("id");

    const user = auth.currentUser;
    if (!user) return;

    // derive name from email
    const name = user.email.split("@")[0];

    await addDoc(
      collection(db, "posts", postId, "comments"),
      {
        text,
        uid: user.uid,
        name,
        createdAt: serverTimestamp()
      }
    );

    input.value = "";
    loadComments(postId);
  });
}
//load comment
async function loadComments(postId) {
  const list = document.getElementById("comments-list");
  if (!list) return;

  list.innerHTML = "";

  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  for (const commentDoc of snapshot.docs) {
    const c = commentDoc.data();

    let name = "User";

    try {
      if (c.uid) {
        const userSnap = await getDoc(doc(db, "users", c.uid));
        if (userSnap.exists()) {
          name = userSnap.data().name || "User";
        }
      }
    } catch (e) {
      console.log("user fetch failed", e);
    }

    const el = document.createElement("div");
    el.className = "comment-item fade-in";

    el.innerHTML = `
      <div class="comment-author">${name}</div>
      <div class="comment-body">${c.text}</div>
    `;

    list.appendChild(el);
  }
}

// ---- Settings Save ----
function initSettings() {
  const btn = document.getElementById('save-settings-btn');
  if (!btn) return;
  btn.addEventListener('click', () => showToast('Settings saved!'));
}

// ---- Init All ----
document.addEventListener('DOMContentLoaded', () => {
  // handle email link login
if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = localStorage.getItem('emailForSignIn');

  if (!email) {
    email = prompt("Confirm your Bennett email");
  }

  signInWithEmailLink(auth, email, window.location.href)
    .then(async (result) => {
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists() || !snap.data().onboardingcomplete) {
        window.location.href = "onboarding.html";
      } else {
        window.location.href = "home.html";
      }

      localStorage.removeItem('emailForSignIn');
    })
    .catch((error) => {
      alert(error.message);
    });
}
  
  initTabs();
  initPostActions();
  initToggles();
  initModals();
  initPostLinks();
  initLoadMore();
  initLogin();
  initCreatePost();
  initUploadResource();
  initEditProfile();
  initReportPost();
  initComments();
  initSettings();
  initOnboarding();
  loadFeed();
  loadProfile();
  loadUserPosts();
  loadPostPage();
});
