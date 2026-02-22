# P0 Sprint Plan — Critical Bug Fixes & Architecture Fix

**Created:** February 22, 2026  
**Completed:** February 22, 2026  
**Source:** PROJECT_REVIEW.md, Section 13, Priority P0  
**Scope:** 5 items — 4 critical bugs + 1 architecture fix  
**Estimated Total Effort:** ~6 hours  
**Codebase:** `OnlyYoursExpo/` (the active Expo frontend)

---

## Implementation Summary

**Status: COMPLETE** — All 5 P0 items implemented and verified with automated tests.

| Task | Status | Tests |
|------|--------|-------|
| ARCH-1: Config extraction | Done | 3/3 |
| BUG-1: GameContext double-parse | Done | 11/11 |
| BUG-3: WebSocket connect race | Done | 19/19 |
| BUG-4: Subscription collision | Done | (covered in WS tests) |
| BUG-2: Inviter navigation | Done | 5/5 |
| **Total** | **5/5** | **38/38 all pass** |

### Files Created
- `OnlyYoursExpo/src/config.js` — Centralized API URL config
- `OnlyYoursExpo/.env.example` — Environment variable template
- `OnlyYoursExpo/jest.setup.js` — Jest global mocks (AsyncStorage, Alert, structuredClone)
- `OnlyYoursExpo/src/services/__tests__/WebSocketService.test.js` — 19 unit tests
- `OnlyYoursExpo/src/state/__tests__/AuthContext.test.js` — 5 unit tests
- `OnlyYoursExpo/src/__tests__/config.test.js` — 3 unit tests
- `OnlyYoursExpo/src/__mocks__/expo-status-bar.js` — Test mock

### Files Modified
- `OnlyYoursExpo/src/services/api.js` — Removed hardcoded URL, imports from config
- `OnlyYoursExpo/src/state/AuthContext.js` — Removed hardcoded URL, added INVITATION_SENT handler, simplified subscribeToGameEvents
- `OnlyYoursExpo/src/state/GameContext.js` — Removed double-parse, uses payload directly
- `OnlyYoursExpo/src/services/WebSocketService.js` — Promise-based connect, multi-subscription support
- `OnlyYoursExpo/src/state/__tests__/GameContext.test.js` — Updated to match new message contract, fixed Alert mock
- `OnlyYoursExpo/package.json` — Added jest config, test script, dev dependencies
- `OnlyYoursExpo/.gitignore` — Added `.env`

---

## Table of Contents

1. [Sprint Overview](#1-sprint-overview)
2. [Task 1: Fix GameContext Double-Parse Bug](#2-task-1-fix-gamecontext-double-parse-bug-bug-1)
3. [Task 2: Fix WebSocket Connect/Subscribe Race Condition](#3-task-2-fix-websocket-connectsubscribe-race-condition-bug-3)
4. [Task 3: Fix Inviter Never Navigating to GameScreen](#4-task-3-fix-inviter-never-navigating-to-gamescreen-bug-2)
5. [Task 4: Fix Subscription Collision Between Contexts](#5-task-4-fix-subscription-collision-between-contexts-bug-4)
6. [Task 5: Extract Hardcoded API URL to Config](#6-task-5-extract-hardcoded-api-url-to-config-arch-1)
7. [Test Plan](#7-test-plan)
8. [Implementation Order & Dependencies](#8-implementation-order--dependencies)
9. [Risk Assessment](#9-risk-assessment)

---

## 1. Sprint Overview

These 5 items are **blockers** — they prevent the game from functioning at all. Without these fixes, the app cannot:
- Receive game invitations (BUG-3)
- Display questions or game events (BUG-1)
- Navigate the inviter into the game (BUG-2)
- Receive invitations after the first game ends (BUG-4)
- Run on any network besides 192.168.1.101 (ARCH-1)

### Implementation Order (dependency-aware)

The tasks have dependencies and must be done in a specific order:

```
ARCH-1 (config)  ─────────────────────────────────────────►  Independent
BUG-3  (race condition)  ──► BUG-4 (subscription collision) ──► BUG-2 (inviter nav)
BUG-1  (double-parse)  ──────────────────────────────────────►  Independent
```

**Optimal order:**
1. **ARCH-1** first (foundational — every other file will import from the new config)
2. **BUG-1** second (simple, self-contained, unblocks game topic messages)
3. **BUG-3** third (fixes `connect()` to return a Promise — needed before BUG-4 and BUG-2)
4. **BUG-4** fourth (redesigns subscription strategy — needed before BUG-2)
5. **BUG-2** last (depends on the fixed subscription architecture from BUG-4)

---

## 2. Task 1: Fix GameContext Double-Parse Bug (BUG-1)

### Problem

`WebSocketService.subscribe()` already JSON-parses the STOMP message body and passes the **parsed JS object** to the callback:

```javascript
// WebSocketService.js lines 100-106
subscribe(destination, callback) {
    if (!this.client || !this.connected) return null;
    const sub = this.client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);  // ← parses here
        callback(body);                          // ← passes parsed object
      } catch (e) {
        callback(message.body);
      }
    });
```

But `GameContext.startGame()` treats the callback argument as a raw STOMP frame and tries to parse it again:

```javascript
// GameContext.js lines 49-51
const sub = WebSocketService.subscribe(gameTopic, (message) => {
  try {
    const payload = JSON.parse(message.body);  // ← BUG: message is already a parsed object
```

`message` is already a JS object like `{ type: 'QUESTION', questionId: 1, ... }`. So `message.body` is `undefined`, and `JSON.parse(undefined)` throws a SyntaxError. The catch block logs it and silently drops every game event.

The same bug exists in the private subscription (lines 82-96) for GUESS_RESULT messages.

### Root Cause

The code was likely copied from `AuthContext.subscribeToGameEvents()` which has its own defensive parsing (handles both string and object cases). But `GameContext` assumed the STOMP frame shape instead of the already-parsed shape.

### Theory: WebSocket Message Lifecycle

STOMP messages arrive as frames with a `.body` string property. The `@stomp/stompjs` library calls the subscribe callback with this raw frame. Our `WebSocketService.subscribe()` acts as a middleware — it intercepts the raw frame, JSON-parses the body, and forwards the parsed result. This is a "parse once at the boundary" pattern, which is correct. The bug is that downstream consumers are not respecting this contract.

### Fix

In `GameContext.js`, change both subscription callbacks to treat the callback argument as the already-parsed payload:

**File:** `OnlyYoursExpo/src/state/GameContext.js`

**Change 1 — Game topic subscription (lines 49-78):**

Before:
```javascript
const sub = WebSocketService.subscribe(gameTopic, (message) => {
  try {
    const payload = JSON.parse(message.body);
    // ... process payload
  } catch (error) {
    console.error('[GameContext] Error parsing message:', error);
  }
});
```

After:
```javascript
const sub = WebSocketService.subscribe(gameTopic, (payload) => {
  console.log('[GameContext] Received message:', payload.type || payload.status);

  if (payload.type === 'QUESTION') {
    // ... same logic, using payload directly
  } else if (payload.type === 'STATUS' && payload.status === 'ROUND1_COMPLETE') {
    // ... same logic
  } else if (payload.type === 'GAME_RESULTS') {
    // ... same logic
  }
});
```

**Change 2 — Private subscription (lines 82-97):**

Before:
```javascript
const privateSub = WebSocketService.subscribe(
  '/user/queue/game-events',
  (message) => {
    try {
      const payload = JSON.parse(message.body);
      if (payload.type === 'GUESS_RESULT') { ... }
    } catch (error) { ... }
  },
);
```

After:
```javascript
const privateSub = WebSocketService.subscribe(
  '/user/queue/game-events',
  (payload) => {
    if (payload.type === 'GUESS_RESULT') {
      console.log('[GameContext] Guess result:', payload.correct ? 'CORRECT' : 'WRONG');
      setGuessResult(payload);
      setCorrectCount(payload.correctCount || 0);
      setWaitingForPartner(true);
    }
  },
);
```

### Test Impact

The existing `GameContext.test.js` tests are **also written with the buggy pattern** — they pass `{ body: JSON.stringify({...}) }` to the callback, simulating the old (incorrect) contract. These tests must be updated to pass parsed objects directly, matching the actual contract of `WebSocketService.subscribe()`.

**Test changes in `src/state/__tests__/GameContext.test.js`:**
- Every `topicCallback({ body: JSON.stringify({...}) })` becomes `topicCallback({...})` (pass the object directly)
- Every `privateCallback({ body: JSON.stringify({...}) })` becomes `privateCallback({...})`

### Checklist

- [x] Update game topic callback in `GameContext.startGame()` to use payload directly
- [x] Update private subscription callback in `GameContext.startGame()` to use payload directly
- [x] Update all `GameContext.test.js` test cases to pass parsed objects to callbacks
- [x] Verify all 11 existing GameContext tests pass (including 2 edge-case tests fixed)
- [x] Write new test: verify callback works with parsed object (no `.body` wrapper)

---

## 3. Task 2: Fix WebSocket Connect/Subscribe Race Condition (BUG-3)

### Problem

```javascript
// AuthContext.js lines 184-188
const connectRealtime = async () => {
  WebSocketService.setConnectionStateListener(setWsConnectionState);
  await WebSocketService.connect(API_BASE);
  subscribeToGameEvents();  // ← called immediately
};
```

`WebSocketService.connect()` calls `this.client.activate()` which initiates the WebSocket handshake asynchronously. The `onConnect` callback fires later when the STOMP session is established. But `connect()` returns immediately after `activate()` — it doesn't wait for `onConnect`.

So `subscribeToGameEvents()` runs before `this.connected = true`, and `subscribe()` returns `null`:

```javascript
subscribe(destination, callback) {
  if (!this.client || !this.connected) return null;  // ← fails here
```

### Root Cause

The `connect()` method is declared `async` (because it reads from AsyncStorage), but `activate()` is fire-and-forget. There's no Promise that resolves when the STOMP connection is actually established.

### Theory: Promise-Based Connection Lifecycle

The STOMP client's `activate()` method starts an async process with multiple phases: TCP handshake, WebSocket upgrade, STOMP CONNECT frame, STOMP CONNECTED response. Only after all 4 phases is the connection ready. By wrapping the `onConnect` callback in a Promise, we can make `connect()` truly async — callers can `await` it and know the connection is ready.

We also need to handle the failure case: if the connection fails (bad token, server down), the Promise should reject rather than hang forever. We'll add a timeout.

### Fix

**File:** `OnlyYoursExpo/src/services/WebSocketService.js`

**Change the `connect()` method to return a Promise that resolves on `onConnect`:**

```javascript
async connect(baseUrl) {
  const token = await AsyncStorage.getItem('accessToken');
  if (!token) throw new Error('Missing auth token');

  const brokerURL = `${baseUrl.replace(/^http/, 'ws').replace(/\/?$/, '')}/ws-native`;

  return new Promise((resolve, reject) => {
    const CONNECTION_TIMEOUT_MS = 10000;
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('WebSocket connection timed out'));
      }
    }, CONNECTION_TIMEOUT_MS);

    this.client = new Client({
      brokerURL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: () => {},
      reconnectDelay: 5000,

      onConnect: () => {
        this.connected = true;
        this._emitConnectionState('connected');
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve();
        }
      },

      onDisconnect: () => {
        this.connected = false;
        this._emitConnectionState('disconnected');
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers['message']);
        this.connected = false;
        this._emitConnectionState('reconnecting');
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error(frame.headers['message'] || 'STOMP connection error'));
        }
      },

      onWebSocketClose: () => {
        if (this.client && this.client.active) {
          this._emitConnectionState('reconnecting');
        } else {
          this._emitConnectionState('disconnected');
        }
      },
    });

    this.client.activate();
  });
}
```

**Why this works:** `connectRealtime()` already does `await WebSocketService.connect(API_BASE)`. Currently that await is meaningless because `connect()` resolves immediately. After this fix, `await` actually waits for the STOMP CONNECTED frame, so `subscribeToGameEvents()` runs only when the connection is ready.

**Edge case — reconnection:** After the initial connection, if the WebSocket drops and STOMP auto-reconnects, the `onConnect` fires again. The `settled` flag ensures the Promise logic is only used once (for the initial connection). Subsequent `onConnect` fires still update `this.connected` and emit state changes.

### Checklist

- [x] Refactor `WebSocketService.connect()` to return a Promise that resolves on `onConnect`
- [x] Add 10-second timeout to reject the Promise if connection fails
- [x] Use `settled` flag to ensure Promise is resolved/rejected only once
- [x] Verify `connectRealtime()` in AuthContext needs no changes (it already `await`s)
- [x] Write unit test: `connect()` resolves after `onConnect` fires
- [x] Write unit test: `connect()` rejects on STOMP error
- [x] Write unit test: `connect()` rejects on timeout

---

## 4. Task 3: Fix Inviter Never Navigating to GameScreen (BUG-2)

### Problem

When Player A (inviter) sends an invitation:
1. Player A calls `WebSocketService.sendMessage('/app/game.invite', ...)` from `CategorySelectionScreen`
2. Backend creates a `GameSession`, sends `INVITATION` to Player B's queue, sends `INVITATION_SENT` status to Player A's queue
3. Player A sees Alert: "Invitation Sent — Waiting for partner..."
4. Player B accepts → backend broadcasts first `QUESTION` to `/topic/game/{sessionId}`
5. **Player A is NOT subscribed to `/topic/game/{sessionId}`** and never sees the question
6. **Player A has no code path to navigate to `GameScreen`**

The `handleGameStatus` function in `AuthContext` receives `INVITATION_SENT` but only logs it:

```javascript
} else if (status.status === 'INVITATION_SENT') {
  console.log('[AuthContext] Invitation sent confirmation');
}
```

### Root Cause

The invitee flow was implemented (AuthContext handles `INVITATION`, calls `startGame()`, navigates to Game). But the inviter flow was never completed — the inviter sends the invitation and then has no way to know when the game starts.

### Theory: Event-Driven Navigation

The cleanest solution is to have the backend notify both players when the game starts. Currently, the backend sends the first question on `/topic/game/{sessionId}` which requires pre-subscription. Instead, we should:

1. Save the `sessionId` from `INVITATION_SENT` in AuthContext
2. When the partner accepts, the backend already broadcasts the first question to `/topic/game/{sessionId}`
3. The backend should ALSO send a `GAME_STARTED` event to both players' private queues with the `sessionId`
4. AuthContext handles `GAME_STARTED` for both players: calls `startGame()` and navigates to `GameScreen`

**However**, modifying the backend adds complexity to this sprint. A **frontend-only fix** is simpler and achieves the same result:

**Frontend-only approach:**
- When `INVITATION_SENT` arrives with a `sessionId`, store it and call `gameContextRef.current.startGame(sessionId)` — this subscribes to the game topic
- Navigate to `GameScreen` with the `sessionId`
- This mirrors exactly what we do for the invitee on `Accept`

This works because `startGame()` subscribes to `/topic/game/{sessionId}`, so when the backend broadcasts the first question, the inviter receives it.

### Fix

**File:** `OnlyYoursExpo/src/state/AuthContext.js`

**Update `handleGameStatus` to handle `INVITATION_SENT`:**

```javascript
const handleGameStatus = (status) => {
  console.log('[AuthContext] Game status:', status.status);
  
  if (status.status === 'INVITATION_DECLINED') {
    Alert.alert('Invitation Declined', status.message);
  } else if (status.status === 'INVITATION_SENT') {
    // Inviter flow: start game and navigate to GameScreen
    const sessionId = status.sessionId;
    if (sessionId && gameContextRef.current) {
      gameContextRef.current.startGame(sessionId);
    }
    if (sessionId && navigationRef.current) {
      navigationRef.current.navigate('Game', { sessionId });
    }
  }
};
```

**Why this works:** The backend `GameController.handleInvitation()` already sends the `sessionId` in the `GameStatusDto` for `INVITATION_SENT`. So `status.sessionId` is available. By calling `startGame(sessionId)`, the inviter subscribes to `/topic/game/{sessionId}` and will receive the first question when the partner accepts.

### Dependency on BUG-4

This fix calls `startGame()` which subscribes to `/user/queue/game-events` (BUG-4 collision). The BUG-4 fix must be done first to prevent the inviter's game-event subscription from overwriting the AuthContext invitation subscription.

### Checklist

- [x] Update `handleGameStatus` in AuthContext to handle `INVITATION_SENT` with navigation
- [x] Verify backend `GameStatusDto` includes `sessionId` field (it does — confirmed in GameController)
- [x] Write test: `INVITATION_SENT` status triggers `startGame()` and navigation
- [x] Write test: `INVITATION_SENT` without `sessionId` is handled gracefully
- [ ] Manual test scenario: Player A invites → Player B accepts → both see questions (requires running backend)

---

## 5. Task 4: Fix Subscription Collision Between Contexts (BUG-4)

### Problem

Both `AuthContext` and `GameContext` subscribe to `/user/queue/game-events`. `WebSocketService` uses a `Map` keyed by destination:

```javascript
// WebSocketService.js line 108
this.subscriptions.set(destination, sub);
```

When `GameContext.startGame()` subscribes to `/user/queue/game-events`, it **replaces** `AuthContext`'s subscription in the Map. When `endGame()` unsubscribes, `AuthContext`'s subscription is never restored. After one game, the user can't receive new invitations.

### Root Cause

The `WebSocketService.subscribe()` method uses a 1-to-1 mapping of destination to subscription. Multiple subscriptions to the same STOMP destination are not supported. This is a design limitation.

### Theory: Subscription Multiplexing

There are two approaches:

**Option A — Allow multiple subscriptions per destination:**  
Change the Map to store arrays of subscriptions per destination. Each `subscribe()` call returns a unique subscription object. `unsubscribe()` removes only that specific subscription.

**Option B — Use different destinations:**  
Change GameContext to use a unique subscription key so it doesn't collide. But STOMP destinations are server-defined, so we can't change the actual destination.

**Option C — Single subscriber with event routing:**  
Keep only `AuthContext` subscribed to `/user/queue/game-events`. AuthContext routes events to GameContext via the ref. GameContext never subscribes to this destination directly.

**Chosen approach: Option A** — It's the most correct fix because it makes `WebSocketService` behave like a proper pub/sub system. Multiple consumers should be able to subscribe to the same destination independently.

### Fix

**File:** `OnlyYoursExpo/src/services/WebSocketService.js`

**Change `subscriptions` from `Map<destination, subscription>` to `Map<destination, Map<id, subscription>>`:**

```javascript
constructor() {
  this.client = null;
  this.connected = false;
  this.connectionState = 'disconnected';
  this.subscriptions = new Map();       // destination → Map<subId, { stompSub, callback }>
  this.onConnectionStateChange = null;
  this._nextSubId = 1;
}
```

**Updated `subscribe()`:**
```javascript
subscribe(destination, callback) {
  if (!this.client || !this.connected) return null;
  
  const subId = this._nextSubId++;
  const stompSub = this.client.subscribe(destination, (message) => {
    try {
      const body = JSON.parse(message.body);
      callback(body);
    } catch (e) {
      callback(message.body);
    }
  });

  if (!this.subscriptions.has(destination)) {
    this.subscriptions.set(destination, new Map());
  }
  this.subscriptions.get(destination).set(subId, stompSub);

  return { id: subId, destination, unsubscribe: () => this._unsubscribeById(destination, subId) };
}
```

**Updated `unsubscribe()` (by destination — removes ALL for that destination):**
```javascript
unsubscribe(destination) {
  const subs = this.subscriptions.get(destination);
  if (subs) {
    for (const stompSub of subs.values()) {
      stompSub.unsubscribe();
    }
    this.subscriptions.delete(destination);
  }
}
```

**New `_unsubscribeById()` (removes ONE specific subscription):**
```javascript
_unsubscribeById(destination, subId) {
  const subs = this.subscriptions.get(destination);
  if (subs) {
    const stompSub = subs.get(subId);
    if (stompSub) {
      stompSub.unsubscribe();
      subs.delete(subId);
      if (subs.size === 0) {
        this.subscriptions.delete(destination);
      }
    }
  }
}
```

**Updated `disconnect()`:**
```javascript
disconnect() {
  if (this.client) {
    this.client.deactivate();
    this.client = null;
    this.connected = false;
    this.subscriptions.clear();
    this._emitConnectionState('disconnected');
  }
}
```

**Caller changes:**

`GameContext.endGame()` currently calls `subscription.unsubscribe()` directly on the STOMP subscription object. After this change, the returned subscription object has its own `unsubscribe()` method that delegates to `_unsubscribeById()`. No changes needed in GameContext — the `subscription.unsubscribe()` call works the same way.

`AuthContext.subscribeToGameEvents()` calls `WebSocketService.subscribe()` and doesn't store the return value. This is fine — the subscription lives until `disconnect()` clears all.

### Important Behavioral Change

Before: `GameContext.startGame()` subscribing to `/user/queue/game-events` would **replace** AuthContext's subscription. Now both coexist. Both callbacks will fire for every message on that destination.

This means `AuthContext`'s handler will also receive `GUESS_RESULT` events (which it currently ignores — it only checks for `INVITATION` and `STATUS`). And `GameContext`'s handler will also receive `INVITATION` events (which it ignores — it only checks for `GUESS_RESULT`). Both handlers already filter by `payload.type`, so this is safe.

### Checklist

- [x] Refactor `WebSocketService.subscriptions` to support multiple subscriptions per destination
- [x] Add `_nextSubId` counter for unique subscription IDs
- [x] Return subscription wrapper with `{ id, destination, unsubscribe }` from `subscribe()`
- [x] Add `_unsubscribeById()` method
- [x] Update `unsubscribe(destination)` to remove all subscriptions for a destination
- [x] Verify `disconnect()` clears all nested Maps
- [x] Verify `GameContext.endGame()` still works with new subscription wrapper
- [x] Verify `AuthContext.subscribeToGameEvents()` still works
- [x] Write test: two subscriptions to same destination both receive messages
- [x] Write test: unsubscribing one doesn't affect the other
- [x] Write test: `disconnect()` clears everything
- [x] GameContext tests work with new subscription wrapper (returns `{ unsubscribe }` same interface)

---

## 6. Task 5: Extract Hardcoded API URL to Config (ARCH-1)

### Problem

The API base URL `http://192.168.1.101:8080` is hardcoded in two files:

```javascript
// api.js line 5
const API_URL = 'http://192.168.1.101:8080/api';

// AuthContext.js line 8
const API_BASE = 'http://192.168.1.101:8080';
```

This means the app:
- Only works on one specific local network
- Can't switch between dev/staging/prod environments
- Has the URL duplicated (DRY violation)

### Theory: Expo Environment Configuration

Expo supports environment variables via the `EXPO_PUBLIC_` prefix. Any variable named `EXPO_PUBLIC_*` is inlined at build time and accessible via `process.env.EXPO_PUBLIC_*`. This is the idiomatic way to configure environment-specific values in Expo apps.

For local development, we can use a `.env` file (Expo SDK 49+ supports dotenv loading). For builds, EAS build profiles can set different env vars per environment.

However, since this project doesn't currently have `expo-env` or dotenv set up, the simplest approach is a **centralized config module** with a sensible default that can be overridden by env vars when they become available.

### Fix

**New file:** `OnlyYoursExpo/src/config.js`

```javascript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api`;

export { API_BASE_URL, API_URL };
```

**File:** `OnlyYoursExpo/src/services/api.js`
```javascript
// Before:
const API_URL = 'http://192.168.1.101:8080/api';

// After:
import { API_URL } from '../config';
```

**File:** `OnlyYoursExpo/src/state/AuthContext.js`
```javascript
// Before:
const API_BASE = 'http://192.168.1.101:8080';

// After:
import { API_BASE_URL } from '../config';
// ... use API_BASE_URL instead of API_BASE
```

**File:** `OnlyYoursExpo/.env` (gitignored)
```
EXPO_PUBLIC_API_URL=http://192.168.1.101:8080
```

**File:** `OnlyYoursExpo/.env.example` (committed)
```
EXPO_PUBLIC_API_URL=http://localhost:8080
```

**Update `.gitignore`** to ensure `.env` is ignored.

### Checklist

- [x] Create `OnlyYoursExpo/src/config.js` with `API_BASE_URL` and `API_URL` exports
- [x] Update `api.js` to import `API_URL` from config
- [x] Update `AuthContext.js` to import `API_BASE_URL` from config
- [x] Create `.env.example` with placeholder
- [x] Verify `.gitignore` includes `.env`
- [x] Remove hardcoded IP from both files
- [x] Config unit tests pass (3 tests for default/env/derivation)

---

## 7. Test Plan

### 7.1 Existing Tests to Update

The existing `GameContext.test.js` (10 tests) will break because they simulate the old (buggy) message format. They must be updated as part of Task 1.

| Test File | Current Tests | Changes Needed |
|-----------|--------------|----------------|
| `src/state/__tests__/GameContext.test.js` | 10 tests | Update all callbacks to pass parsed objects instead of `{ body: JSON.stringify(...) }` |
| `src/screens/__tests__/GameScreen.test.js` | 2 tests | May need updates if GameContext behavior changes |

### 7.2 New Unit Tests

| Test | File | Tests What |
|------|------|------------|
| WebSocket connect resolves on onConnect | `src/services/__tests__/WebSocketService.test.js` | BUG-3: Promise-based connect |
| WebSocket connect rejects on error | same | BUG-3: Error handling |
| WebSocket connect rejects on timeout | same | BUG-3: Timeout behavior |
| Multiple subscriptions to same destination | same | BUG-4: Both receive messages |
| Unsubscribe one doesn't affect other | same | BUG-4: Independent lifecycle |
| Disconnect clears all subscriptions | same | BUG-4: Clean shutdown |
| Subscribe returns wrapper with unsubscribe | same | BUG-4: API contract |
| GameContext receives parsed payload directly | `src/state/__tests__/GameContext.test.js` | BUG-1: No double-parse |
| INVITATION_SENT triggers navigation | `src/state/__tests__/AuthContext.test.js` | BUG-2: Inviter flow |
| Config exports correct URLs | `src/__tests__/config.test.js` | ARCH-1: Config module |

### 7.3 Integration Tests (Manual Verification Points)

These are end-to-end scenarios that verify the full flow works. They can't be automated without a running backend but should be tested manually.

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 1 | App starts → silent auth → WebSocket connects | No flash of SignIn screen, invitation subscription active |
| 2 | Player A invites → alert → Player B accepts | Both players see GameScreen with first question |
| 3 | Both answer 8 questions → Round 1 complete | Transition screen shows, Round 2 starts |
| 4 | Both guess 8 questions → Game complete | Results screen with animated scores |
| 5 | Player A goes back to dashboard → invites again | Second game works (subscriptions restored) |
| 6 | Player B declines invitation | Player A sees "Invitation Declined" alert |
| 7 | WebSocket drops mid-game → reconnects | Reconnection banner shows, game resumes |

### 7.4 Regression Tests

All existing tests must continue to pass after the changes:

- [x] All `GameContext.test.js` tests pass (11/11 — updated for BUG-1 fix + Alert mock fix)
- [x] All `WebSocketService.test.js` tests pass (19/19 — new test file)
- [x] All `config.test.js` tests pass (3/3 — new test file)
- [x] All `AuthContext.test.js` tests pass (5/5 — new test file for BUG-2)
- [ ] Screen tests skipped (pre-existing Expo SDK 54 compatibility issue with jest-expo, not related to P0 changes)

---

## 8. Implementation Order & Dependencies

```
Step 1: ARCH-1 — Create config.js, update api.js and AuthContext.js
   │     No dependencies. Foundational change.
   │
Step 2: BUG-1 — Fix GameContext double-parse
   │     No dependencies. Self-contained in GameContext.js + tests.
   │
Step 3: BUG-3 — Fix WebSocket connect() race condition  
   │     No dependencies. Self-contained in WebSocketService.js.
   │     Must be done before BUG-4 (subscribeToGameEvents must work).
   │
Step 4: BUG-4 — Fix subscription collision
   │     Depends on BUG-3 (subscriptions must actually succeed).
   │     Changes WebSocketService.js subscribe/unsubscribe API.
   │
Step 5: BUG-2 — Fix inviter navigation
         Depends on BUG-4 (inviter's startGame() must not clobber AuthContext's sub).
         Changes AuthContext.js handleGameStatus.
```

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Changing `subscribe()` return type breaks callers | High | `GameContext.endGame()` calls `subscription.unsubscribe()` — ensure new wrapper has same method name |
| Multiple callbacks for same destination cause duplicate handling | Medium | Both AuthContext and GameContext already filter by `payload.type` — verify no double-processing |
| Promise-based `connect()` changes reconnection behavior | Medium | Only the initial connect uses the Promise; `onConnect` for reconnects still fires normally |
| Config change breaks local development | Low | Default fallback to `localhost:8080`; `.env.example` provided |
| Existing test mocks may not match new API | Medium | Update all mocks as part of each task; run full suite after each change |

---

## Files Modified Summary

| File | Tasks |
|------|-------|
| `src/config.js` (NEW) | ARCH-1 |
| `src/services/api.js` | ARCH-1 |
| `src/state/AuthContext.js` | ARCH-1, BUG-2 |
| `src/state/GameContext.js` | BUG-1 |
| `src/services/WebSocketService.js` | BUG-3, BUG-4 |
| `src/state/__tests__/GameContext.test.js` | BUG-1 |
| `src/services/__tests__/WebSocketService.test.js` (NEW) | BUG-3, BUG-4 |
| `src/state/__tests__/AuthContext.test.js` (NEW) | BUG-2 |
| `src/__tests__/config.test.js` (NEW) | ARCH-1 |
| `.env.example` (NEW) | ARCH-1 |
| `.gitignore` | ARCH-1 |

---

*Awaiting approval before implementation begins.*
