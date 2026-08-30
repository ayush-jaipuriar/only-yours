# Only Yours - Google Play Console Release & Production Deployment Plan

**Status:** Ready for Execution  
**Scope:** End-to-End Play Console Setup, Release Signing, GCP Backend Deployment, Firebase/OAuth Configuration, and Internal Testing Rollout  
**Package Name:** `com.onlyyours.app`  
**Expo Owner:** `ayush_jaipuriar`  

---

## 1. Overview & Architecture Blueprint

To bring **Only Yours** to Google Play, the system requires four interconnected infrastructure pillars working in unison:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             1. Google Play Console                               │
│  - App ID: com.onlyyours.app                                                     │
│  - Internal Testing Track (.AAB bundle distribution)                             │
│  - Play App Signing (Generates Play Signing SHA-1)                               │
│  - Store Listing & Data Safety Declarations                                      │
└────────────────────────▲─────────────────────────────────▲───────────────────────┘
                         │                                 │
                         │ Uploads .AAB                    │ Resigns with Play Key
                         │                                 │
┌────────────────────────┴──────────────┐   ┌──────────────┴───────────────────────┐
│       2. Local / EAS Build Pipeline   │   │     3. Google Cloud & Firebase       │
│  - Expo SDK 54 / React Native 0.81    │   │  - OAuth 2.0 Client IDs (SHA-1 Triad)│
│  - Release Keystore (Upload SHA-1)    │   │  - google-services.json (FCM Push)   │
│  - Bundled Production Bundle          │   │  - Secret Manager & Cloud SQL        │
└────────────────────────┬──────────────┘   └──────────────▲───────────────────────┘
                         │                                 │
                         │ HTTPS / WSS API Requests        │ Reads Secrets / DB
                         │                                 │
┌────────────────────────▼─────────────────────────────────┴───────────────────────┐
│                         4. Production Backend (Cloud Run)                        │
│  - Spring Boot 3 / Java 17 Container                                             │
│  - WebSocket STOMP Endpoint: wss://<cloud-run-url>/ws                            │
│  - Cloud SQL PostgreSQL Instance                                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Production Backend Cloud Deployment (GCP Cloud Run)

Before uploading the mobile app bundle, the backend must be live on a persistent public HTTPS/WSS URL so Google Play reviewers and internal testers can authenticate and play.

### 1.1 Backend Infrastructure Provisioning
- [ ] **Artifact Registry**:
  ```bash
  gcloud artifacts repositories create only-yours-backend \
      --repository-format=docker \
      --location=asia-south1 \
      --description="Only Yours backend Docker repository"
  ```
- [ ] **Cloud SQL (PostgreSQL 15)**:
  ```bash
  gcloud sql instances create onlyyours-db \
      --database-version=POSTGRES_15 \
      --tier=db-f1-micro \
      --region=asia-south1 \
      --root-password="<STRONG_DB_PASSWORD>"
  ```
  - Create database: `gcloud sql databases create onlyyours --instance=onlyyours-db`
- [ ] **Secret Manager Configuration**:
  - Store runtime secrets securely:
    - `JWT_SECRET`: Random 256-bit base64 secret (`openssl rand -base64 32`)
    - `DATABASE_URL`: `jdbc:postgresql:///onlyyours?cloudSqlInstance=<PROJECT_ID>:asia-south1:onlyyours-db&socketFactory=com.google.cloud.sql.postgres.SocketFactory`
    - `DATABASE_USERNAME`: `postgres`
    - `DATABASE_PASSWORD`: `<STRONG_DB_PASSWORD>`
    - `RESEND_API_KEY`: Production Resend key for password reset emails
    - `RESEND_FROM_EMAIL`: `support@onlyyours.app` (or verified sender domain)

### 1.2 Build & Deploy Backend Container
- [ ] **Containerize Backend**:
  ```bash
  cd backend
  gcloud builds submit --tag asia-south1-docker.pkg.dev/<PROJECT_ID>/only-yours-backend/api:latest .
  ```
- [ ] **Deploy to Cloud Run with WebSocket Support**:
  ```bash
  gcloud run deploy only-yours-api \
      --image=asia-south1-docker.pkg.dev/<PROJECT_ID>/only-yours-backend/api:latest \
      --platform=managed \
      --region=asia-south1 \
      --allow-unauthenticated \
      --min-instances=1 \
      --max-instances=5 \
      --timeout=3600 \
      --session-affinity \
      --add-cloudsql-instances=<PROJECT_ID>:asia-south1:onlyyours-db \
      --set-secrets="JWT_SECRET=JWT_SECRET:latest,DATABASE_PASSWORD=DATABASE_PASSWORD:latest,RESEND_API_KEY=RESEND_API_KEY:latest"
  ```
- [ ] **Health Sanity Check**:
  ```bash
  curl -s "https://only-yours-api-<hash>-el.a.run.app/actuator/health"
  # Expected: {"status":"UP"}
  ```

---

## 3. Phase 2: Google Cloud & Firebase Setup (The SHA-1 Triad)

Google OAuth and Firebase require registering three separate SHA-1 certificate fingerprints under package `com.onlyyours.app`.

```
                    ┌─────────────────────────┐
                    │ The SHA-1 Certificate   │
                    │       Triad             │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  1. Debug SHA-1  │  │  2. Upload SHA-1 │  │ 3. Play Sign SHA1│
│ Used for local   │  │ Used by local    │  │ Generated by     │
│ dev-client runs  │  │ release keystore │  │ Play Console     │
│ on USB/emulator  │  │ before upload    │  │ after app upload │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 2.1 Generate Release Keystore
- [ ] Generate a production upload keystore:
  ```bash
  keytool -genkey -v \
      -keystore onlyyours-upload-key.keystore \
      -alias onlyyours-upload-alias \
      -keyalg RSA \
      -keysize 2048 \
      -validity 10000 \
      -dname "CN=Only Yours, OU=Engineering, O=Only Yours, L=Bengaluru, ST=Karnataka, C=IN"
  ```
- [ ] Save keystore credentials safely in `OnlyYoursExpo/keystore.properties` (**ensure `.gitignore` includes `*.keystore` and `keystore.properties`**):
  ```properties
  storePassword=<KEYSTORE_PASSWORD>
  keyPassword=<KEY_PASSWORD>
  keyAlias=onlyyours-upload-alias
  storeFile=../../onlyyours-upload-key.keystore
  ```

### 2.2 Extract SHA-1 Fingerprints
- [ ] **Extract Local Debug SHA-1**:
  ```bash
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep "SHA1:"
  ```
- [ ] **Extract Upload Keystore SHA-1**:
  ```bash
  keytool -list -v -keystore onlyyours-upload-key.keystore -alias onlyyours-upload-alias | grep "SHA1:"
  ```

### 2.3 Firebase & Google Cloud Console Registration
- [ ] In **Firebase Console** (or Google Cloud Console -> APIs & Services -> Credentials):
  1. Add Android App with package name `com.onlyyours.app`.
  2. Add **Debug SHA-1** and **Upload Keystore SHA-1**.
  3. Download the updated `google-services.json` and place it in `OnlyYoursExpo/google-services.json`.
  4. Note the **Web Client ID** (used by backend for Google Token verification) and configure it in backend `GOOGLE_CLIENT_ID`.

---

## 4. Phase 3: Expo Client Configuration & Production AAB Build

### 3.1 Update `app.json` for Production Package ID
- [ ] Update `OnlyYoursExpo/app.json`:
  ```json
  {
    "expo": {
      "name": "Only Yours",
      "slug": "only-yours",
      "version": "1.0.0",
      "android": {
        "package": "com.onlyyours.app",
        "versionCode": 1,
        "adaptiveIcon": {
          "foregroundImage": "./assets/adaptive-icon.png",
          "backgroundColor": "#120D1C"
        }
      }
    }
  }
  ```
- [ ] Configure `OnlyYoursExpo/.env.production`:
  ```env
  EXPO_PUBLIC_API_URL=https://only-yours-api-<hash>-el.a.run.app
  ```

### 3.2 Build the Android App Bundle (.AAB)
Choose either the local build path or EAS build path:

#### Option A: Local Gradle Bundle Build (Recommended & Fast)
- [ ] Resync native Android files and compile release `.aab`:
  ```bash
  cd OnlyYoursExpo
  EXPO_FORCE_PREBUILD=1 npx expo prebuild --platform android --clean
  cd android
  ./gradlew bundleRelease
  ```
- [ ] Output artifact:
  `OnlyYoursExpo/android/app/build/outputs/bundle/release/app-release.aab`

#### Option B: EAS Cloud Build
- [ ] Run EAS production build:
  ```bash
  cd OnlyYoursExpo
  npx eas-cli build --platform android --profile production
  ```

---

## 5. Phase 4: Google Play Console Configuration

### 4.1 Create the App in Play Console
1. Navigate to [Google Play Console](https://play.google.com/console).
2. Click **Create app**:
   - **App name**: `Only Yours`
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
   - Accept Developer Program Policies and US Export Laws.

### 4.2 Complete App Content Declarations
Under **Policy and programs** -> **App content**, complete all mandatory declarations:

- [ ] **Privacy Policy**:
  - Provide public HTTPS link to Privacy Policy (e.g. `https://ayush-jaipuriar.github.io/only-yours/privacy-policy.html`).
- [ ] **App Access (Reviewer Credentials)**:
  - Select *“All or some functionality is restricted”*.
  - Add test instructions and reviewer account credentials:
    - **Account 1**: `reviewer1@onlyyours.dev` / `TestPassword123!`
    - **Account 2**: `reviewer2@onlyyours.dev` / `TestPassword123!`
    - **Notes**: Explain that Only Yours is a synchronous two-player couple game. Provide instructions that both accounts are pre-linked as a couple, allowing the reviewer to open two sessions or test dashboard, history, stats, custom questions, and gameplay seamlessly.
- [ ] **Ads**: Select *“No, my app does not contain ads”*.
- [ ] **Content Rating (IARC Questionnaire)**:
  - Category: *Social or Communication*.
  - Questionnaire: Does not contain offensive language, violence, or real-money gambling.
  - Result: Rated 3+ / Everyone.
- [ ] **Target Audience and Content**:
  - Target age group: 18 and over.
  - Appeal to children: No.
- [ ] **Data Safety Declaration**:
  - **Data Collected**:
    - *Personal Info*: Name (Optional display name), Email address (Account authentication), User IDs.
    - *App Info & Performance*: Crash logs, Diagnostics (Firebase Crashlytics / performance).
  - **Data Sharing**: No user data is shared with third parties.
  - **Security Practices**:
    - Data is encrypted in transit (HTTPS / TLS 1.3 / WSS).
    - Account deletion is available in-app (Settings -> Account Deletion).

### 4.3 Main Store Listing Assets
- [ ] **App Icon**: 512 × 512 px PNG (32-bit color, max 1MB).
- [ ] **Feature Graphic**: 1024 × 500 px PNG/JPEG.
- [ ] **Phone Screenshots**: Minimum 4 screenshots (1080 × 2400 px or 9:16 aspect ratio):
  1. *Dashboard & Couple Streak*
  2. *Live Real-Time Question Round*
  3. *Guess Reveal & Compatibility Results*
  4. *Custom Question Deck Builder & Stats*
- [ ] **Short Description** (up to 80 characters):
  > *Deepen your connection with real-time couple trivia, guessing, and shared insights.*
- [ ] **Full Description** (up to 4,000 characters):
  > Highlight real-time gameplay, personalized intimacy categories, custom questions, streak tracking, and private couple encryption.

---

## 6. Phase 5: Internal Testing Track Launch (Milestone 1)

The Internal Testing track provides instantaneous app distribution to up to 100 internal testers without waiting for Google review approvals.

### 5.1 Upload Bundle & Create Release
1. In Play Console, go to **Testing** -> **Internal testing**.
2. Click **Create new release**.
3. Upload `app-release.aab`.
4. Release name: `1.0.0 (1)`
5. Release notes:
   ```
   Initial internal release of Only Yours. Includes real-time couple trivia, Velvet Midnight UI, custom decks, and progression tracking.
   ```
6. Click **Next** -> **Save and publish**.

### 5.2 Retrieve Google Play App Signing SHA-1
1. Go to **Setup** -> **App signing**.
2. Copy the **App signing key certificate SHA-1 fingerprint**.
3. Add this SHA-1 to **Google Cloud Console / Firebase Console** under the Android app credentials.
   *(This ensures Google Sign-In works seamlessly when the app is installed via Google Play).*

### 5.3 Configure Testers & Test on Physical Device
1. Under **Internal testing** -> **Testers**, create an email list (e.g. `Only Yours Alpha Testers`) and add your Google account.
2. Copy the **How testers join your test** link (web or Android link).
3. Open the link on your Android device, accept the invite, and download **Only Yours** directly from the Google Play Store!

---

## 7. Phase 6: Closed Testing & Production Readiness (Milestone 2)

Once Internal Testing verification is successful:
1. Promote the release from **Internal testing** to **Closed testing (Alpha)**.
2. Recruit 20 opt-in testers to meet Google Play's 14-day continuous closed testing policy for personal developer accounts.
3. Track daily engagement, fix reported issues, and apply for **Production Access** directly from the Play Console dashboard.

---

## 8. Verification & Execution Checklist

| Step | Action Item | Verification Command / URL | Status |
| :--- | :--- | :--- | :---: |
| **1.1** | Deploy Backend to Cloud Run | `curl -s https://<cloud-run-url>/actuator/health` | [ ] |
| **1.2** | Set up Secret Manager & Cloud SQL | DB connections verified from Cloud Run | [ ] |
| **2.1** | Generate Release Keystore | `onlyyours-upload-key.keystore` generated | [ ] |
| **2.2** | Extract Debug & Upload SHA-1s | `keytool -list -v -keystore ...` | [ ] |
| **2.3** | Register SHA-1s in Firebase/GCP | Download `google-services.json` to `OnlyYoursExpo/` | [ ] |
| **3.1** | Update `app.json` (`com.onlyyours.app`) | `OnlyYoursExpo/app.json` verified | [ ] |
| **3.2** | Generate `app-release.aab` | `./gradlew bundleRelease` or EAS build | [ ] |
| **4.1** | Create Play Console App & Details | `Only Yours` draft created | [ ] |
| **4.2** | Complete App Content & Data Safety | All questionnaire badges green | [ ] |
| **4.3** | Upload Store Listing Assets | Icon, feature graphic, screenshots uploaded | [ ] |
| **5.1** | Upload `.AAB` to Internal Testing | Release published to internal track | [ ] |
| **5.2** | Register Play Signing SHA-1 in GCP | Play Signing SHA-1 added to OAuth client | [ ] |
| **5.3** | Install from Play Store Link on Phone | Full live two-player test on physical device | [ ] |
