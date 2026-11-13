# Priya Ki Kahaniya — GitHub Pages + Firebase

A lightweight Hindi story website with a public story listing and a protected admin area. Hosting can run on GitHub Pages. Firebase Authentication and Firestore provide login and story storage.

## Included
- Beige/cream two-column story listing inspired by the supplied reference layout
- Latest and popular story views, category links, search and pagination
- Individual story pages
- Admin login using Firebase Email/Password
- Admin-only create, edit, publish, draft and delete
- Firestore rules that allow public reads only for published stories
- Responsive mobile layout

## Before publishing
This ZIP is a complete starter project, but Firebase credentials and the admin UID must be configured by you. Do not publish it before completing the security steps below.

### 1. Create Firebase project
1. Open https://console.firebase.google.com/ and create a project.
2. In Project settings > General, add a Web app.
3. Copy the Firebase web configuration into `firebase-config.js`.
4. In Authentication > Sign-in method, enable **Email/Password**.
5. In Authentication > Users, add your own admin email and a strong password.
6. Open the created user and copy the **UID**.

### 2. Configure the admin UID
1. In `firebase-config.js`, replace `PASTE_ADMIN_USER_UID` with your admin user's UID.
2. In `firestore.rules`, replace the same `PASTE_ADMIN_USER_UID` with that exact UID.
3. Never put a service-account JSON file, private key, or admin password in this repository.

### 3. Create Firestore and publish rules
1. In Firebase Console > Firestore Database, create a database.
2. Open the Rules tab.
3. Paste the contents of `firestore.rules` and click **Publish**.
4. The rules permit anyone to read documents only when `status == "published"`. Only the configured UID can create, update, read drafts, or delete.

### 4. Test locally
You can open `index.html` for the public demo layout. Firebase authentication and Firestore generally work best when served from a local web server, not by opening the file directly.
- If Python is installed: run `python -m http.server 8000` in this folder.
- Open `http://localhost:8000`.

### 5. Deploy to GitHub Pages
1. Create a public repository named `priya-ki-kahaniya`.
2. Upload all files and folders from this ZIP to the repository root.
3. Go to Settings > Pages.
4. Under Build and deployment, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. Wait for GitHub Pages to publish. Your site will be available at `https://YOUR_GITHUB_USERNAME.github.io/priya-ki-kahaniya/`.

### 6. Add your first story
1. Open your website and click **Admin**.
2. Sign in using the admin email and password created in Firebase.
3. Write the title, category, description and story content.
4. Click **Publish Story**. Use **Save Draft** to save without public display.
5. Published stories appear on the public website automatically.

## Important notes
- Firebase web config is designed to be visible in browser code. Security comes from Authentication and Firestore Rules.
- The admin UID is an identifier, not a secret. The Firestore rule is the actual access control.
- Do not create a public sign-up form. Create admin users manually in Firebase Console.
- If the Firebase project is on a paid plan, usage may incur charges. Check Firebase pricing and set budget alerts where available.
- GitHub Pages is static hosting and does not run server-side code.
- This starter stores story text in Firestore. It does not upload images or support comments.
- SEO meta fields are saved with each story, but per-story dynamic HTML meta tags are not server-rendered on GitHub Pages. For stronger SEO, add a static page per story or use a rendering platform.
- Use only content you own or have permission to publish. Follow Indian law, Firebase/GitHub acceptable-use policies, age restrictions, and applicable content rules. Do not publish sexual content involving minors, non-consensual content, exploitation, or other unlawful material.

## Troubleshooting
- **Firebase not configured:** Check `firebase-config.js` for placeholders and typos.
- **Permission denied:** Confirm admin UID matches in both files and publish Firestore rules.
- **Login failed:** Confirm Email/Password provider is enabled and the user exists.
- **Admin access denied:** The logged-in UID must exactly match `window.ADMIN_UID`.
- **No stories:** Publish a story from Admin. Drafts are not public.
