/* Priya Ki Kahaniya — lightweight Firebase + GitHub Pages app */
(() => {
  "use strict";

  const PAGE_SIZE = 8;
  const $ = (id) => document.getElementById(id);
  const state = { db: null, auth: null, stories: [], category: "", mode: "popular", page: 1, search: "", user: null };

  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
  const slugify = (s = "") => s.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 90);
  const dateText = (v) => {
    try {
      const d = v && v.toDate ? v.toDate() : new Date(v);
      return isNaN(d) ? "" : d.toLocaleDateString("hi-IN", { day:"numeric", month:"short", year:"numeric" });
    } catch (_) { return ""; }
  };
  const showNotice = (msg, type = "info") => {
    const el = $("notice");
    el.hidden = !msg;
    el.className = `notice ${type}`;
    el.textContent = msg;
  };

  function initFirebase() {
    const c = window.FIREBASE_CONFIG || {};
    if (!window.firebase || !c.apiKey || c.apiKey.startsWith("PASTE_") || !c.projectId || c.projectId.startsWith("YOUR_")) {
      showNotice("Firebase अभी configure नहीं है। README.md में दिए setup steps पूरे करें। Demo layout देखने के लिए नीचे sample stories दिखाई जा सकती हैं।", "warning");
      state.stories = demoStories();
      render();
      return false;
    }
    try {
      firebase.initializeApp(c);
      state.auth = firebase.auth();
      state.db = firebase.firestore();
      state.auth.onAuthStateChanged(user => {
        state.user = user || null;
        if (location.hash.startsWith("#/admin")) renderAdmin();
      });
      loadStories();
      return true;
    } catch (e) {
      showNotice("Firebase शुरू नहीं हो पाया: " + e.message, "error");
      state.stories = demoStories();
      render();
      return false;
    }
  }

  function demoStories() {
    return [
      { id:"demo-1", title:"एक खूबसूरत प्रेम कहानी", slug:"ek-khoobsurat-prem-kahani", description:"दो वयस्कों के बीच भरोसे, दोस्ती और प्यार की एक काल्पनिक कहानी।", content:"यह एक डेमो कहानी है। Firebase configure करने के बाद Admin Panel से अपनी मौलिक कहानी लिखें और प्रकाशित करें।", category:"प्रेम कहानियाँ", views:12540, status:"published", createdAt:new Date() },
      { id:"demo-2", title:"रिश्तों की नई शुरुआत", slug:"rishton-ki-nayi-shuruaat", description:"कभी-कभी एक छोटी-सी बातचीत जिंदगी का नजरिया बदल देती है।", content:"यह एक डेमो कहानी है।", category:"रिश्ते और जीवन", views:8420, status:"published", createdAt:new Date() },
      { id:"demo-3", title:"बारिश वाली शाम", slug:"baarish-wali-shaam", description:"एक शांत शाम, पुरानी यादें और एक नई उम्मीद।", content:"यह एक डेमो कहानी है।", category:"काल्पनिक कहानियाँ", views:6320, status:"published", createdAt:new Date() }
    ];
  }

  async function loadStories() {
    if (!state.db) { render(); return; }
    try {
      const snap = await state.db.collection("stories").where("status", "==", "published").get();
      state.stories = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      state.stories.sort((a,b) => {
        const av = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        const bv = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return bv - av;
      });
      render();
    } catch (e) {
      showNotice("कहानियाँ लोड नहीं हुईं। Firestore rules और configuration जाँचें। " + e.message, "error");
      render();
    }
  }

  function filteredStories() {
    let list = [...state.stories];
    if (state.category) list = list.filter(s => s.category === state.category);
    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(s => `${s.title || ""} ${s.description || ""} ${s.category || ""} ${(s.tags || []).join(" ")}`.toLowerCase().includes(q));
    }
    if (state.mode === "popular") list.sort((a,b) => (b.views || 0) - (a.views || 0));
    else list.sort((a,b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0));
    return list;
  }

  function render() {
    if (location.hash.startsWith("#/story/")) return renderStory(location.hash.split("/")[2]);
    if (location.hash.startsWith("#/admin")) return renderAdmin();
    if (location.hash.startsWith("#/privacy")) return renderStatic("Privacy Policy", "हम इस starter website में analytics या advertising tracking अपने-आप चालू नहीं करते। यदि आप कोई tracking service जोड़ते हैं, तो अपनी privacy policy अपडेट करें।");
    if (location.hash.startsWith("#/contact")) return renderStatic("Contact", "संपर्क के लिए वेबसाइट संचालक द्वारा दिया गया आधिकारिक ईमेल यहाँ जोड़ें।");
    if (location.hash.startsWith("#/popular")) state.mode = "popular";
    else if (location.hash.startsWith("#/latest")) state.mode = "latest";
    else if (location.hash.startsWith("#/category/")) state.category = decodeURIComponent(location.hash.split("/")[2] || "");
    else state.category = "";

    $("page-title").textContent = state.category || (state.mode === "latest" ? "नई कहानियाँ" : "लोकप्रिय कहानियाँ");
    const list = filteredStories();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = list.slice(start, start + PAGE_SIZE);
    $("story-list").innerHTML = pageItems.length ? pageItems.map(cardHTML).join("") :
      `<article class="story-card"><h2>अभी कोई कहानी उपलब्ध नहीं है</h2><p>Admin Panel से पहली कहानी प्रकाशित करें।</p></article>`;
    $("pagination").innerHTML = pages > 1 ? paginationHTML(pages) : "";
    const cats = [...new Set(state.stories.map(s => s.category).filter(Boolean))].sort();
    $("category-list").innerHTML = `<a href="#/">सभी कहानियाँ</a>` + cats.map(c => `<a href="#/category/${encodeURIComponent(c)}">${esc(c)}</a>`).join("");
  }

  function cardHTML(s) {
    return `<article class="story-card">
      <h2><a href="#/story/${encodeURIComponent(s.slug || s.id)}">${esc(s.title || "बिना शीर्षक")}</a></h2>
      <p class="story-description">${esc(s.description || "")}</p>
      <div class="story-meta"><span>◉ ${(Number(s.views)||0).toLocaleString("en-IN")} Views</span><span>${esc(dateText(s.createdAt))}</span></div>
      <div class="story-category">${esc(s.category || "अन्य")}</div>
      <div class="story-tags">${(s.tags || []).map(t => `<span>${esc(t)}</span>`).join("")}</div>
      <a class="read-more" href="#/story/${encodeURIComponent(s.slug || s.id)}">पूरी कहानी पढ़ें →</a>
    </article>`;
  }

  function paginationHTML(pages) {
    let html = `<button ${state.page===1?"disabled":""} data-page="${state.page-1}">← पिछला</button>`;
    for (let i=1;i<=pages;i++) html += `<button class="${i===state.page?"active":""}" data-page="${i}">${i}</button>`;
    html += `<button ${state.page===pages?"disabled":""} data-page="${state.page+1}">अगला →</button>`;
    return html;
  }

  async function renderStory(slug) {
    let s = state.stories.find(x => x.slug === slug || x.id === slug);
    if (!s && state.db) {
      try {
        const snap = await state.db.collection("stories").where("slug","==",slug).limit(1).get();
        if (!snap.empty) s = { id:snap.docs[0].id, ...snap.docs[0].data() };
      } catch (_) {}
    }
    $("page-title").textContent = s ? s.title : "कहानी";
    $("pagination").innerHTML = "";
    $("category-list").innerHTML = `<a href="#/">सभी कहानियाँ</a>`;
    $("story-list").innerHTML = s ? `<article class="story-card full-story">
      <a class="back-link" href="#/">← सभी कहानियों पर वापस जाएँ</a>
      <h2>${esc(s.title)}</h2>
      <p class="story-description">${esc(s.description || "")}</p>
      <div class="story-meta"><span>◉ ${(Number(s.views)||0).toLocaleString("en-IN")} Views</span><span>${esc(dateText(s.createdAt))}</span></div>
      <div class="story-content">${esc(s.content || "").split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,"<br>")}</p>`).join("")}</div>
      <div class="story-category">${esc(s.category || "")}</div>
    </article>` : `<article class="story-card"><h2>कहानी नहीं मिली</h2><a href="#/">होम पर जाएँ</a></article>`;
    if (s && state.db && !String(s.id).startsWith("demo-")) {
      try { await state.db.collection("stories").doc(s.id).update({ views: firebase.firestore.FieldValue.increment(1) }); } catch (_) {}
    }
  }

  function renderStatic(title, body) {
    $("page-title").textContent = title;
    $("pagination").innerHTML = "";
    $("story-list").innerHTML = `<article class="story-card"><h2>${esc(title)}</h2><p>${esc(body)}</p></article>`;
  }

  function renderAdmin() {
    $("page-title").textContent = "Admin Dashboard";
    $("pagination").innerHTML = "";
    $("category-list").innerHTML = `<a href="#/">Public Website</a>`;
    if (!state.auth || !state.db) {
      $("story-list").innerHTML = `<article class="story-card"><h2>Firebase setup बाकी है</h2><p>पहले README.md के अनुसार Firebase configure करें।</p></article>`;
      return;
    }
    if (!state.user) {
      $("story-list").innerHTML = `<section class="story-card admin-card">
        <h2>Admin Login</h2>
        <form id="login-form" class="admin-form">
          <label>Email address<input id="login-email" type="email" required autocomplete="username"></label>
          <label>Password<input id="login-password" type="password" required autocomplete="current-password"></label>
          <button class="primary-btn" type="submit">Login</button>
          <p class="form-help">Admin account Firebase Console में पहले से बनाया होना चाहिए। Public sign-up उपलब्ध नहीं है।</p>
          <p id="login-error" class="form-error"></p>
        </form>
      </section>`;
      $("login-form").addEventListener("submit", login);
      return;
    }
    if (state.user.uid !== window.ADMIN_UID) {
      $("story-list").innerHTML = `<article class="story-card"><h2>Access denied</h2><p>इस account को admin access नहीं है।</p><button id="logout-btn" class="secondary-btn">Logout</button></article>`;
      $("logout-btn").onclick = logout;
      return;
    }
    $("story-list").innerHTML = `
      <section class="story-card admin-card">
        <div class="admin-heading"><div><p class="eyebrow">Content management</p><h2>नई कहानी लिखें</h2></div><button id="logout-btn" class="secondary-btn">Logout</button></div>
        <form id="post-form" class="admin-form">
          <input type="hidden" id="post-id">
          <label>कहानी का शीर्षक<input id="post-title" required maxlength="140" placeholder="कहानी का शीर्षक"></label>
          <label>URL Slug<input id="post-slug" maxlength="150" placeholder="automatic-slug"></label>
          <label>Category<input id="post-category" required list="category-options" placeholder="जैसे: प्रेम कहानियाँ"><datalist id="category-options">${[...new Set(state.stories.map(s=>s.category).filter(Boolean))].map(c=>`<option value="${esc(c)}">`).join("")}</datalist></label>
          <label>Short Description<textarea id="post-description" rows="2" maxlength="300" placeholder="कहानी का छोटा परिचय"></textarea></label>
          <label>पूरी कहानी<textarea id="post-content" rows="14" required placeholder="अपनी मौलिक कहानी यहाँ लिखें..."></textarea></label>
          <label>Tags (comma separated)<input id="post-tags" placeholder="प्रेम, रिश्ते, हिंदी कहानी"></label>
          <label>SEO Meta Title<input id="post-seo-title" maxlength="65" placeholder="SEO title"></label>
          <label>SEO Meta Description<textarea id="post-seo-description" rows="2" maxlength="160" placeholder="SEO description"></textarea></label>
          <div class="form-row"><button class="primary-btn" type="submit">Publish Story</button><button id="draft-btn" class="secondary-btn" type="button">Save Draft</button><button id="reset-btn" class="secondary-btn" type="button">Clear</button></div>
          <p id="post-message" class="form-help"></p>
        </form>
      </section>
      <section class="story-card admin-card">
        <h2>आपकी कहानियाँ</h2>
        <div id="admin-posts">Loading...</div>
      </section>`;
    $("logout-btn").onclick = logout;
    $("post-form").addEventListener("submit", e => savePost(e, "published"));
    $("draft-btn").onclick = () => savePost(null, "draft");
    $("reset-btn").onclick = resetForm;
    loadAdminPosts();
  }

  async function login(e) {
    e.preventDefault();
    $("login-error").textContent = "";
    try { await state.auth.signInWithEmailAndPassword($("login-email").value.trim(), $("login-password").value); }
    catch (err) { $("login-error").textContent = "Login नहीं हुआ: " + err.message; }
  }
  async function logout() { try { await state.auth.signOut(); } catch (_) {} location.hash = "#/"; }

  async function savePost(e, status) {
    if (e) e.preventDefault();
    if (!state.user || state.user.uid !== window.ADMIN_UID) return;
    const title = $("post-title").value.trim();
    const content = $("post-content").value.trim();
    if (!title || !content) { $("post-message").textContent = "Title और पूरी कहानी भरना जरूरी है।"; return; }
    const slug = $("post-slug").value.trim() || slugify(title);
    const data = {
      title, slug, category: $("post-category").value.trim(),
      description: $("post-description").value.trim(), content,
      tags: $("post-tags").value.split(",").map(x=>x.trim()).filter(Boolean),
      seoTitle: $("post-seo-title").value.trim(),
      seoDescription: $("post-seo-description").value.trim(),
      status, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
      const id = $("post-id").value;
      if (id) await state.db.collection("stories").doc(id).update(data);
      else await state.db.collection("stories").add({...data, views:0, createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      $("post-message").textContent = status === "published" ? "कहानी publish हो गई!" : "Draft save हो गया।";
      resetForm();
      await loadAdminPosts();
      await loadStories();
    } catch (err) { $("post-message").textContent = "Save error: " + err.message; }
  }

  function resetForm() {
    $("post-form").reset();
    $("post-id").value = "";
  }

  async function loadAdminPosts() {
    const host = $("admin-posts");
    try {
      const snap = await state.db.collection("stories").orderBy("updatedAt","desc").get();
      const items = snap.docs.map(d=>({id:d.id,...d.data()}));
      host.innerHTML = items.length ? `<div class="admin-table">${items.map(s=>`<div class="admin-row">
        <div><strong>${esc(s.title)}</strong><small>${esc(s.category||"")} · ${esc(s.status||"draft")}</small></div>
        <div class="row-actions"><button data-edit="${esc(s.id)}" class="small-btn">Edit</button><button data-delete="${esc(s.id)}" class="small-btn danger-btn">Delete</button></div>
      </div>`).join("")}</div>` : "<p>अभी कोई पोस्ट नहीं है।</p>";
      host.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editPost(items.find(s=>s.id===b.dataset.edit)));
      host.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deletePost(b.dataset.delete));
    } catch (e) { host.textContent = "Posts लोड नहीं हुए: " + e.message; }
  }

  function editPost(s) {
    if (!s) return;
    $("post-id").value = s.id;
    $("post-title").value = s.title || "";
    $("post-slug").value = s.slug || "";
    $("post-category").value = s.category || "";
    $("post-description").value = s.description || "";
    $("post-content").value = s.content || "";
    $("post-tags").value = (s.tags || []).join(", ");
    $("post-seo-title").value = s.seoTitle || "";
    $("post-seo-description").value = s.seoDescription || "";
    $("post-message").textContent = "Editing: " + s.title;
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function deletePost(id) {
    if (!confirm("क्या आप इस कहानी को हमेशा के लिए delete करना चाहते हैं?")) return;
    try { await state.db.collection("stories").doc(id).delete(); await loadAdminPosts(); await loadStories(); }
    catch (e) { alert("Delete error: " + e.message); }
  }

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-page]");
    if (b && !b.disabled) { state.page = Number(b.dataset.page); render(); window.scrollTo({top:0,behavior:"smooth"}); }
  });
  $("search-input").addEventListener("input", e => { state.search = e.target.value.trim(); state.page=1; if (!location.hash || location.hash === "#/") state.mode="latest"; render(); });
  window.addEventListener("hashchange", () => { state.page=1; render(); });
  $("year").textContent = new Date().getFullYear();
  initFirebase();
  if (!location.hash) location.hash = "#/";
})();
