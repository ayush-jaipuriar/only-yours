# Only Yours - Google Play Data Safety & App Content Reference Guide

This document contains the exact answers and declarations needed when filling out the **Data Safety**, **App Content**, and **Reviewer Access** forms in the Google Play Console for **Only Yours** (`com.onlyyours.app`).

---

## 1. App Content Declarations

### 1.1 Privacy Policy
- **Privacy Policy URL**: `https://ayush-jaipuriar.github.io/only-yours/privacy-policy.html` (or your verified domain URL)

### 1.2 App Access (Reviewer Instructions & Test Accounts)
- **Question**: Is all or part of your app restricted based on login credentials, memberships, location, or other forms of authentication?
- **Answer**: **All or some functionality is restricted**
- **Reviewer Instructions**:
  ```
  App Access Credentials for Only Yours:
  
  Only Yours is a synchronous, real-time trivia game designed for couples.
  To test both the single-user features (dashboard, stats, custom decks) and the live two-player game loops, we have provided two pre-seeded test accounts:
  
  Account 1 (Primary):
  - Email: reviewer1@onlyyours.dev
  - Password: TestPassword123!
  
  Account 2 (Partner):
  - Email: reviewer2@onlyyours.dev
  - Password: TestPassword123!
  
  Test Flow:
  1. Sign in with Account 1 on Device/Browser A.
  2. Sign in with Account 2 on Device/Browser B.
  3. Accounts are pre-linked as a couple. Tapping "Start Game" on Account 1 will send an invitation to Account 2.
  4. Both users answer Round 1 questions, proceed to Round 2 to guess their partner's answers, and view the final compatibility results.
  ```

### 1.3 Ads
- **Question**: Does your app contain ads?
- **Answer**: **No, my app does not contain ads**

### 1.4 Content Rating (IARC Questionnaire)
- **Category**: **Social or Communication**
- **Email Address**: `ayushjaipuriar@gmail.com`
- **Questionnaire**:
  - Does the app contain violence? **No**
  - Does the app contain sexuality or nudity? **No**
  - Does the app contain offensive language? **No**
  - Does the app allow users to interact or exchange content? **Yes** (Couples answer trivia and share custom questions with their linked partner only)
  - Does the app share user's precise physical location? **No**
  - Does the app allow users to purchase digital goods? **No**
- **Expected Rating**: **Everyone / PEGI 3 / USK 0**

### 1.5 Target Audience and Content
- **Target Age Group**: **18 and over**
- **Could this app unintentionally appeal to children?**: **No**

### 1.6 Financial Features & Health Apps
- **Financial features**: None
- **Health / Medical features**: None
- **Government apps**: None

---

## 2. Data Safety Questionnaire

### 2.1 Data Collection and Security
1. **Does your app collect or share any of the required user data types?** -> **Yes**
2. **Is all of the user data collected by your app encrypted in transit?** -> **Yes** (All API communication uses HTTPS / TLS 1.3 and WSS secure WebSockets)
3. **Do you provide a way for users to request that their data be deleted?** -> **Yes** (Users can request account deletion in-app via Settings -> Delete Account or by contacting support)

---

### 2.2 Data Types Collected Breakdown

#### A. Personal Info
| Data Type | Collected | Shared | Purpose | Ephemeral? | Required / Optional |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **Name** | Yes | No | App functionality, Personalization | No | Optional |
| **Email Address** | Yes | No | App functionality, Account management | No | Required |
| **User IDs** | Yes | No | App functionality, Account management | No | Required |

#### B. App Info and Performance
| Data Type | Collected | Shared | Purpose | Ephemeral? | Required / Optional |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **Crash Logs** | Yes | No | Analytics, App performance / stability | No | Required |
| **Diagnostics** | Yes | No | Analytics, App performance / stability | No | Required |

#### C. Messages / User Generated Content
| Data Type | Collected | Shared | Purpose | Ephemeral? | Required / Optional |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **Other in-app content** | Yes | No | App functionality (Custom questions created for couple partner) | No | Optional |

---

## 3. Store Listing Copy Reference

- **App Name**: `Only Yours`
- **Short Description (80 chars max)**:
  `Deepen your connection with real-time couple trivia, guessing, and insights.`
- **Full Description (4000 chars max)**:
  ```
  Only Yours is an intimate, real-time couple's game designed to help partners connect, laugh, and understand each other on a deeper level.

  HOW IT WORKS:
  1. Connect with your partner using a private, secure couple link code.
  2. Pick a category — from lighthearted daily habits and funny memories to deep emotional questions and future dreams.
  3. Round 1 (Answer): Both partners secretly answer a series of questions about themselves.
  4. Round 2 (Guess): Guess how your partner answered!
  5. The Reveal: Discover where your perspectives align, see your shared compatibility score, and unlock couple milestones and badges.

  FEATURES:
  • Real-Time Synchronous Gameplay: Answer and reveal together live with instant WebSocket synchronization.
  • Custom Question Decks: Create and curate your own personalized question cards.
  • Couple Growth & Streaks: Build daily play streaks, earn XP, and level up your relationship journey together.
  • Velvet Midnight Design: Beautiful, romantic dark & light themes designed with haptic feedback and accessibility in mind.
  • Complete Privacy: Your answers and custom questions remain strictly private between you and your partner.

  Rediscover each other today with Only Yours!
  ```
