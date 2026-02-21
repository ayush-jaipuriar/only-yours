## Frontend Stack Decision Record — 2025-10-10

### Context
We currently ship a React Native mobile client (`OnlyYoursApp`) and a Spring Boot backend (`backend`). The mobile stack is on React Native 0.72 with Android Gradle Plugin 7.4.2, Gradle wrapper 7.6.1, compile/target SDK 33, CocoaPods (Podfile aligned with RN templates), and Hermes enabled by default. The backend uses Spring Boot 3.5.x with Gradle 8.14.3 and Java 17.

Key excerpts for traceability:

```12:24:OnlyYoursApp/package.json
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.0",
    "@react-navigation/native": "^7.1.14",
    "@react-navigation/stack": "^7.4.2"
  }
```

```3:12:OnlyYoursApp/android/build.gradle
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 21
        compileSdkVersion = 33
        targetSdkVersion = 33
        ndkVersion = "23.1.7779620"
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.4.2")
    }
}
```

```1:7:OnlyYoursApp/android/gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-7.6.1-bin.zip
```

```1:8:backend/gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-bin.zip
```

### Problem
- Local iOS/Android testing on macOS is brittle due to toolchain/version drift (Node/Ruby/CocoaPods/Xcode/AGP/Gradle). RN 0.72 is now behind current iOS/Android/Xcode releases, increasing friction.
- Desire for a “most performant, beautiful” app raises the question of switching to Jetpack Compose (Android) and potentially a different iOS layer.

### Options Considered

#### A) Stay on React Native and modernize (Recommended)
- What: Upgrade to current RN (≥0.75/0.76), adopt the New Architecture (Fabric/TurboModules), upgrade Android toolchain (AGP 8.x, Gradle 8.x, SDK 34/35), raise iOS minimum and align CocoaPods with current Xcode, pin Node/Ruby versions.
- Pros:
  - Single codebase for iOS and Android; fastest path to shipping and iteration.
  - Modern RN with Hermes + Fabric delivers near‑native UI performance for our app’s scope (navigation, lists, forms, websockets, moderate animations).
  - Leverages existing code and libraries (navigation, auth, STOMP/SockJS clients, state, screens).
- Cons:
  - Still need to manage Node + CocoaPods + Gradle ecosystem.
  - For ultra‑custom animations or very heavy UI, native may still outperform.

Scope and timeline (conservative):
- 1–2 days: Pin tool versions, fix local setup (Node LTS via .nvmrc, Ruby via Bundler, CocoaPods version match, JDK 17, react-native-doctor fixes).
- 3–5 days: `npx react-native upgrade`, AGP/Gradle/SDK updates, Pod install, resolve breaking changes, update navigation/libs.
- 1–2 days: Adopt/verify New Architecture, enable Hermes, measure startup/interaction perf.

#### B) Jetpack Compose (Android) + SwiftUI (iOS)
- What: Full native rewrite per platform; Kotlin/Compose for Android, Swift/SwiftUI for iOS.
- Pros:
  - Best native UX/performance; first‑class tooling (Android Studio/Xcode), smooth previews.
  - Easier access to platform APIs and UI affordances.
- Cons:
  - Two separate codebases; feature parity and dual-team velocity requirements.
  - Large rewrite cost: navigation, auth flows, websocket layer, screens, theming.
- Rough effort estimate (current app scope): 3–5 weeks Android + 3–5 weeks iOS for a like‑for‑like MVP rewrite, plus ongoing dual maintenance.

#### C) Jetpack Compose Multiplatform (Kotlin) targeting iOS as well
- Pros: Single language (Kotlin) and shared UI with Compose across Android/iOS.
- Cons: Smaller ecosystem on iOS compared to SwiftUI/RN; integration complexities (native services, navigation, theming); hiring/knowledge concentration risk.
- Risk: While maturing, still a smaller community than RN or pure native in 2025.

#### D) Flutter
- Pros: Strong perf, rich UI, single codebase, large ecosystem.
- Cons: Full rewrite, different language (Dart), platform interop when needed, migration cost similar to Compose.

### Evaluation
- Performance: For our app type (forms, lists, websockets, moderate animation), modern RN (Hermes + Fabric + Reanimated where needed) is sufficient. Native may exceed RN in edge cases (complex custom graphics, 120fps heavy animations), which we currently do not target.
- Developer Experience: RN friction mainly stems from outdated versions. Upgrading to current RN aligns with latest Xcode and Android SDKs and reduces Pod/AGP churn.
- Product Scope & Velocity: Cross‑platform with one codebase gives faster iteration and lower cost. A full native rewrite delays delivery and doubles maintenance.
- Backend Alignment: No changes required; all options keep the Spring Boot API/WebSocket endpoints unchanged.

### Decision
Proceed with React Native. Modernize the toolchain and project to the latest stable RN and Android/iOS build systems. Re‑evaluate native options only if, after the upgrade and New Architecture adoption, measured UX performance remains insufficient or if product strategy shifts to Android‑first.

### Upgrade/Hardening Plan (Actionable)
1) Pin development tool versions
   - Add `.nvmrc` (Node LTS), use `corepack enable` (or Yarn/PNPM pinned).
   - Use Bundler for CocoaPods (Gemfile already present), run `bundle install` then `bundle exec pod install`.
   - Ensure JDK 17 is selected for RN Android builds; keep backend on its own Gradle wrapper (isolated).
2) React Native upgrade
   - `npx react-native upgrade` to ≥0.75/0.76.
   - Android: upgrade AGP to 8.x, Gradle wrapper to 8.x, compile/target SDK to 34/35.
   - iOS: set `platform :ios, '13'` or higher in Podfile; update pods.
3) Adopt New Architecture and Hermes
   - Enable Fabric/TurboModules; ensure `react-native-reanimated` and navigation stack are compatible.
4) CI/local checks
   - Run `npx react-native doctor` until green; document macOS setup steps in the repo.
5) Performance passes
   - Measure TTI/startup and interactions; optimize images, list virtualization, memoization.

### macOS Local Setup Notes (to reduce friction)
- Use Node LTS via nvm/asdf and commit `.nvmrc`.
- Ruby via rbenv/asdf; `bundle install && bundle exec pod install` in `OnlyYoursApp/ios`.
- If Flipper causes iOS build errors, set `NO_FLIPPER=1` temporarily for dev.
- Prefer Android Emulator API level matching target SDK; clean Gradle caches on major upgrades.

### Exit Criteria to Revisit Native
- After upgrade + New Architecture, we still miss perf/UX targets verified by profiling.
- Product shifts to Android‑only for the foreseeable future and we want deep OS integration and Compose‑level polish.
- Team skillset concentrates on Kotlin/Swift and we accept dual‑stack maintenance.

### Impact
- Faster time‑to‑value with minimal rewrite, better stability on macOS, and a path to near‑native performance. Backend remains unchanged.

### Next Steps
- Implement the upgrade/hardening plan above.
- Track the work under the development plan and testing guide.





