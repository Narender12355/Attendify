# Attendify (Firebase edition)

Attendance + academic helper for colleges. React + Vite + Tailwind + Firebase (Auth and Firestore), packaged as an Android app with Capacitor.

- **Students** log in with **college ID + password** (created by a teacher).
- **Teachers** log in with email + password and manage students, attendance, syllabus, timetable and events.
- Everything is live: when a teacher saves, students see it instantly.

## 1. Firebase setup (10 minutes)

1. Go to https://console.firebase.google.com and create a project.
2. **Build > Authentication > Get started > Sign-in method > Email/Password > Enable.**
3. **Build > Firestore Database > Create database** (production mode, pick a nearby region).
4. **Firestore > Rules**: paste the contents of `firestore.rules` and **Publish**.
5. **Firestore > Data > Start collection** `config`, document ID `teacher`, field `code` (string) = your secret teacher access code (e.g. `MY-SECRET-2026`).
6. **Project settings > General > Your apps > Web (</>)**: register an app and copy the config.
7. Copy `.env.example` to `.env` and paste the six values.

## 2. Run it

```bash
npm install
npm run dev
```

Open the local URL. Choose **Teacher > Sign up**, enter your name, email, password and the access code from step 5. Then:

1. **Setup**: add subjects (with semester) and a timetable.
2. **Students**: add students with their **semester, branch and section**, singly or as a whole class (paste `CSE24-001, Aarav Sharma` per line). Share the shown ID and password.
3. **Overview** has Semester, Branch, Section and **Subject** filters: leave Subject on "All subjects" for overall attendance of a section or branch, or pick one subject to see only that subject's numbers.
4. **Syllabus** and **Events**: add units/topics and upcoming sessionals.
4. **Attendance**: pick Semester + Branch + Section (e.g. Sem 2, CSE, Section 2), choose the subject and date, then mark. Each teacher only works with the group they pick; the choice is remembered.
   **Subject report** (toggle at the top of the Attendance tab): choose any semester, branch and subject to see every section's average, how many students are below 75%, and each student's attended/total, lowest first.
   Attendance: mark each class. Students see percentages, warnings and predictions straight away.

## 3. Build the Android APK

Requirements: Node 18+, JDK 17, Android Studio (installs the Android SDK).

```bash
npm run build
npx cap add android          # first time only
npm run android:sync
npm run android:open         # opens Android Studio
```

In Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The file appears at
`android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to a phone and install it (allow "install unknown apps").

Command-line alternative (after `cap add android`):

```bash
cd android && ./gradlew assembleDebug
```

For Play Store: use **Build > Generate Signed Bundle** (AAB) with your own keystore. Keep the keystore safe.

App icon: `public/icon-source-1024.png` can be used with `npx @capacitor/assets generate --android`.

## 4. Publish on GitHub Pages

Push this project to a GitHub repository on the `main` or `master` branch. In the repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**. Add these repository secrets under **Settings > Secrets and variables > Actions** using the values from your Firebase web app: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`.

The workflow in `.github/workflows/deploy-pages.yml` deploys the site on each push. The public URL is shown in the workflow run and under **Settings > Pages**. Firebase web configuration is included in the client bundle; protect the service with Firebase Authentication and Firestore security rules, not by treating these values as server-side secrets.

### No Android Studio? Use the web app as an installable app

```bash
npm i -g firebase-tools
firebase login && firebase init hosting   # public dir: dist, single-page app: yes
npm run build && firebase deploy
```
Open the hosted https link on a phone, tap **Add to Home screen**. Or paste the link into https://www.pwabuilder.com to generate an Android package.

## Sharing with every phone

1. Deploy once (`npm run build && firebase deploy`). You get a public link like `https://your-project.web.app`.
2. Send that link to students. It opens on any Android or iPhone browser, no app store needed.
3. **Android:** Chrome menu > Install app (or install your APK).
4. **iPhone:** Safari > Share > Add to Home Screen. (iPhones cannot install APK files.)
5. Students log in with the college ID and password you created for them in the Students tab.

## Code style

The UI is written in standard React JSX (`.jsx` files). The code is dense, so run `npm run format` once (Prettier) to lay it out neatly, or install the recommended VS Code extensions when prompted and enable Format on Save.

## 4. Project structure

```
src/
  main.jsx, App.jsx          entry + auth/data gate
  lib/                       firebase.js, accounts.js (student creation, password change), utils.js, files.js
  store/                     auth.jsx (user + profile), data.jsx (live Firestore data)
  components/                ui.jsx (design system), shell.jsx (navigation)
  pages/                     auth.jsx, account.jsx, student.jsx, teacher.jsx
firestore.rules              server-side security rules
```

## 5. Security model and known limits

- Rules enforce roles on the server: students can only read their own attendance/progress and cannot write shared data. Teacher self-signup needs the secret code in `config/teacher`.
- Student logins are Firebase Auth users with a private email (`<id>@students.attendify.app`). No emails are ever sent.
- **A teacher cannot reset a student's password from the app** (that needs the Firebase Admin SDK / Cloud Functions). If a student forgets it: Firebase Console > Authentication > delete that user, then add the student again in the Students tab. Students can change their own password under Account.
- Removing a student deletes their profile, progress and attendance; the Auth login remains until deleted in the console.
- Subjects can be set to one branch or "All branches"; timetables are per semester + branch (not per section).
- Any teacher can mark any group; groups are a filter for convenience, not a permission.
- Teacher accounts are not removable from the app (use the console).
- Not yet tested on a real device by the author of this scaffold. Run through the flow once before presenting.
