import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

// Firebase throws synchronously if initialized with missing/invalid config — that
// would crash every page (the Header needs auth state everywhere), not just the
// login page. Skip init entirely until real NEXT_PUBLIC_FIREBASE_* values exist,
// and let the rest of the app treat a null `auth` as "nobody's logged in yet."
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (firebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };
