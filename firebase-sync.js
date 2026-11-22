/* Optional Firebase bridge. Keep the web config in firebase-config.js. */
(() => {
  'use strict';

  const FIREBASE_CONFIG = window.MHERIEL_FIREBASE_CONFIG || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: ''
  };
  const SDK_VERSION = '13.4.0';
  let servicesPromise = null;
  let servicesInstance = null;

  function isFirebaseConfigured() {
    return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.authDomain && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId);
  }

  async function getServices() {
    if (!isFirebaseConfigured()) throw new Error('Add the Firebase web app config before turning on cloud sync.');
    if (!servicesPromise) {
      const base = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
      servicesPromise = Promise.all([
        import(`${base}/firebase-app.js`),
        import(`${base}/firebase-auth.js`),
        import(`${base}/firebase-firestore.js`)
      ]).then(([appSdk, authSdk, firestoreSdk]) => {
        const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(FIREBASE_CONFIG);
        servicesInstance = {
          authSdk,
          firestoreSdk,
          auth: authSdk.getAuth(app),
          db: firestoreSdk.getFirestore(app)
        };
        return servicesInstance;
      }).catch(error => {
        servicesPromise = null;
        throw new Error(error.message || 'Firebase could not load. Check your connection.');
      });
    }
    return servicesPromise;
  }

  function waitForUser(authSdk, auth) {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    return new Promise(resolve => {
      let unsubscribe = () => {};
      unsubscribe = authSdk.onAuthStateChanged(auth, user => {
        unsubscribe();
        resolve(user || null);
      }, () => {
        unsubscribe();
        resolve(null);
      });
    });
  }

  async function getUser(services, interactive) {
    let user = await waitForUser(services.authSdk, services.auth);
    if (!user && interactive) throw new Error('Tap Continue with Google to finish signing in.');
    return user;
  }

  async function prepare() {
    await getServices();
    return true;
  }

  async function currentUser() {
    const services = await getServices();
    return waitForUser(services.authSdk, services.auth);
  }

  function signInWithGoogle() {
    if (!servicesInstance) throw new Error('Firebase is still loading. Tap sync again in a moment.');
    const provider = new servicesInstance.authSdk.GoogleAuthProvider();
    return servicesInstance.authSdk.signInWithPopup(servicesInstance.auth, provider).then(credential => credential.user);
  }

  async function syncUpToCloud(state) {
    const services = await getServices();
    const user = await getUser(services, true);
    if (!user) throw new Error('Sign in to Google to sync progress.');
    const safeState = JSON.parse(JSON.stringify(state));
    const reference = services.firestoreSdk.doc(services.db, 'mherielProgress', user.uid);
    await services.firestoreSdk.setDoc(reference, {
      state: safeState,
      updatedAt: services.firestoreSdk.serverTimestamp()
    }, { merge: true });
    return true;
  }

  async function syncDownFromCloud({ interactive = false } = {}) {
    const services = await getServices();
    const user = await getUser(services, interactive);
    if (!user) return null;
    const reference = services.firestoreSdk.doc(services.db, 'mherielProgress', user.uid);
    const snapshot = await services.firestoreSdk.getDoc(reference);
    if (!snapshot.exists()) return null;
    const record = snapshot.data();
    if (record.state && typeof record.state === 'object') return record.state;
    const { updatedAt, ...legacyState } = record;
    return legacyState;
  }

  window.FirebaseSync = {
    isFirebaseConfigured,
    prepare,
    currentUser,
    signInWithGoogle,
    syncUpToCloud,
    syncDownFromCloud,
    configured: isFirebaseConfigured,
    save: syncUpToCloud,
    load: syncDownFromCloud
  };
})();
