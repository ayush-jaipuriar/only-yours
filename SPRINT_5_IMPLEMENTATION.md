# Sprint 5 Implementation Report

**Sprint:** 5 - Core Gameplay: Round 2 (Guessing) & Results  
**Completed:** February 21, 2026  
**Status:** ✅ COMPLETE  
**Backend Tests:** 70 (0 failures)  
**Frontend Tests:** 21 (0 failures)  

---

## 1. Overview

Sprint 5 completes the core gameplay loop by implementing:
- **Round 2 (Guessing):** Players guess how their partner answered each question from Round 1
- **Per-guess feedback:** Immediate private feedback after each guess (correct/incorrect + partner's actual answer)
- **Scoring:** Each correct guess earns 1 point per player (max 8 each, 16 combined)
- **Results Screen:** Celebratory display of both players' scores with tier-based messages

## 2. Architecture Decisions

### Automatic Round 2 Transition
After both players answer the last Round 1 question, the server automatically broadcasts `ROUND1_COMPLETE` followed by the first Round 2 question. The frontend shows a brief transition screen ("Round 1 Complete! Now guess your partner's answers...") before displaying the Round 2 question.

### Separate Guess Endpoint
A new `@MessageMapping("/game.guess")` endpoint was added instead of reusing the existing `/game.answer` endpoint. This provides clear separation of concerns and makes the message contract explicit.

### Private Feedback via User Queue
Each player receives their `GUESS_RESULT` as a private message on `/user/queue/game-events`, ensuring they can't see each other's guesses. The next question is broadcast on `/topic/game/{sessionId}` after both players have guessed.

### Idempotent Guess Submission
Like Round 1 answers, Round 2 guesses use database-level deduplication. If a player submits a guess for a question they've already guessed, the original guess is preserved and the duplicate is ignored.

---

## 3. Backend Implementation

### 3.1 New DTOs

| DTO | Purpose |
|-----|---------|
| `GuessRequestDto` | Client → Server: `{ sessionId, questionId, guess }` with `@Pattern("^[A-D]$")` validation |
| `GuessResultDto` | Server → Client (private): `{ correct, yourGuess, partnerAnswer, correctCount, questionText }` |
| `GameResultsDto` | Server → All (broadcast): `{ player1Name, player1Score, player2Name, player2Score, message }` |

### 3.2 GameService New Methods

| Method | Description |
|--------|-------------|
| `getFirstRound2Question(sessionId)` | Resets question index to 0, returns first question with `round="ROUND2"` |
| `submitGuess(sessionId, userId, questionId, guess)` | Records guess, looks up partner's answer, returns `GuessResultDto` |
| `areBothPlayersGuessed(sessionId, questionId)` | Counts non-null `round2_guess` entries for synchronization |
| `getNextRound2Question(sessionId)` | Advances question index, returns next question or empty (last question) |
| `calculateAndCompleteGame(sessionId)` | Scores all guesses, sets COMPLETED status, returns `GameResultsDto` |
| `getResultMessage(combinedScore)` | Returns tier-based message: Soulmates (14+), Great (10+), Good (6+), Lots to discover (<6) |
| `buildQuestionPayload(session, question, number, round)` | Modified to accept `round` parameter (was hardcoded "ROUND1") |

### 3.3 GameController Changes

**Modified `handleAnswer()`:**
After `ROUND1_COMPLETE` status broadcast, the controller now also calls `gameService.getFirstRound2Question()` and broadcasts the first Round 2 question automatically.

**New `handleGuess()`:**
1. Validates user and calls `gameService.submitGuess()`
2. Sends private `GuessResultDto` to the guessing player
3. If `areBothPlayersGuessed()` → broadcasts next question or final `GameResultsDto`

### 3.4 Repository Additions

```java
long countByGameSession_IdAndQuestion_IdAndRound2GuessIsNotNull(UUID sessionId, Integer questionId);
List<GameAnswer> findByGameSession_IdAndUser_IdAndRound2GuessIsNotNull(UUID sessionId, UUID userId);
```

### 3.5 Database Migration

`V4__Seed_Additional_Questions.sql` adds 5 questions each to 4 categories that previously had only 4 questions:
- Getting to Know You: 4 → 9
- Daily Habits: 4 → 9  
- Memories: 4 → 9
- Intimacy: 4 → 9

This ensures all categories have enough questions for an 8-question game.

---

## 4. Frontend Implementation

### 4.1 GameContext.js Changes

**New State Variables:**
- `round` — tracks current round (`'round1'` / `'round2'`)
- `guessResult` — holds the latest `GuessResultDto` for overlay display
- `scores` — holds `GameResultsDto` when game completes
- `correctCount` — running tally of correct guesses
- `isTransitioning` — true during Round 1 → Round 2 transition

**New Methods:**
- `submitGuess(guess)` — sends guess via `/app/game.guess`
- `clearGuessResult()` — clears feedback overlay after display timeout

**New Message Handlers:**
- `GUESS_RESULT` on `/user/queue/game-events` — stores feedback, updates correct count
- `GAME_RESULTS` on `/topic/game/{sessionId}` — stores scores, sets `gameStatus='completed'`
- `ROUND1_COMPLETE` — sets `isTransitioning=true`, clears current question
- ROUND2 `QUESTION` — sets `round='round2'`, clears transition state

### 4.2 GameScreen.js Overhaul

**Round-Aware UI:**
- Round badge: "Round 1: Answer" (purple) or "Round 2: Guess" (teal) with running score
- Dynamic prompt: "How did your partner answer?" shown in Round 2
- Submit button: "Submit Answer" → "Submit Guess"
- Color theming: Purple for Round 1, teal for Round 2

**Transition Screen:**
Between rounds, displays a full-screen teal view with "Round 1 Complete!" title, "Now guess your partner's answers..." subtitle, and a loading spinner.

**Guess Result Overlay:**
After each guess in Round 2, shows a card for 2.5 seconds with:
- ✅ "Correct!" or ❌ "Not quite!"
- "Your partner chose [letter]"
- Question text (italic)
- Running correct count

**Navigation:**
When `gameStatus === 'completed'`, navigates to `Results` screen with scores.

### 4.3 ResultsScreen.js (New)

**Features:**
- Animated score counters (spring animation)
- Player name cards with score circles
- "vs" separator between players
- Tier-based emoji header (💕/🎉/👍/💪)
- Combined score display
- "Play Again" → CategorySelection
- "Back to Dashboard" → Dashboard

### 4.4 AppNavigator.js

Added `Results` screen with `headerLeft: null` and `gestureEnabled: false` to prevent premature exit.

---

## 5. Test Results

### Backend: 70 tests, 0 failures

**Sprint 5 New Tests (16):**
| Test | Description |
|------|-------------|
| `testGetFirstRound2Question` | Verifies first Round 2 question returned with `round="ROUND2"` |
| `testSubmitGuess_CorrectGuess` | Correct guess returns `correct=true` with proper counts |
| `testSubmitGuess_IncorrectGuess` | Wrong guess returns `correct=false` with partner's actual answer |
| `testSubmitGuess_InvalidFormat` | Rejects non-A/B/C/D guesses |
| `testSubmitGuess_WrongGameStatus` | Rejects guesses when not in ROUND2 |
| `testSubmitGuess_DuplicateGuess_Idempotent` | Second guess for same question preserves original |
| `testAreBothPlayersGuessed_NoneGuessed` | Returns false with 0 guesses |
| `testAreBothPlayersGuessed_OneGuessed` | Returns false with 1 guess |
| `testAreBothPlayersGuessed_BothGuessed` | Returns true with 2 guesses |
| `testGetNextRound2Question_HasMore` | Returns next question with correct number and round |
| `testGetNextRound2Question_LastQuestion` | Returns empty after all 8 questions |
| `testCalculateAndCompleteGame_AllCorrect` | 8/8 for both → "Soulmates!" |
| `testCalculateAndCompleteGame_AllWrong` | 0/0 → "Lots to discover!" |
| `testCalculateAndCompleteGame_MixedScores` | Asymmetric scores calculated correctly |
| `testFullGameLifecycle_Round1ThroughScoring` | End-to-end: invite → R1 → R2 → scores → COMPLETED |
| `testGetResultMessage_AllTiers` | All 4 message tiers verified |

### Frontend: 21 tests, 0 failures (3 suites)

**GameContext (11 tests):**
- useGame outside provider, start game, submit answer, end game cleanup
- ROUND1_COMPLETE transition, ROUND2 question handling
- submitGuess, GUESS_RESULT handling, GAME_RESULTS handling
- Submit without session (answer and guess)

**GameScreen (2 tests):**
- Loading state, initial badge rendering

**ResultsScreen (8 tests):**
- Player names, result message, title, combined score
- Play Again and Back to Dashboard button rendering and navigation

---

## 6. Bug Fixes During Implementation

| Bug | Fix |
|-----|-----|
| `testGetNextRound2Question_LastQuestion` off-by-one | Loop needed 7 iterations (not 6) after `getFirstRound2Question()` to reach end |
| Jest hanging with `react-native` preset | Switched to custom jest config with `moduleNameMapper` for RN mock |
| `react-test-renderer` version mismatch | Pinned to 18.3.1 to match React 18.3.1 |
| `@testing-library/react-hooks` renderer detection | Used `/native` sub-path import |
| Missing `metro-react-native-babel-preset` | Installed as devDependency |
| `AtomicInteger` import unused | Removed (was from initial draft) |

---

## 7. WebSocket Message Flow (Complete)

```
Round 1 (existing):
  Both → /app/game.answer → QUESTION broadcast (or ROUND1_COMPLETE)

Round 2 (new):
  [Server auto-sends first ROUND2 QUESTION after ROUND1_COMPLETE]
  Player → /app/game.guess
    → GUESS_RESULT to that player (private /user/queue/game-events)
    → If both guessed: next QUESTION broadcast (or GAME_RESULTS)
```

---

## 8. Known Limitations

- **No partner name in prompts:** Round 2 shows "How did your partner answer?" instead of partner's actual name (would require additional state)
- **No reconnection handling:** If a player disconnects during Round 2, the game cannot resume (Sprint 6)
- **No game history:** Past game results are not viewable (Sprint 6)
- **Jest slow cold start:** First test run takes ~50s due to Babel transform warming; subsequent runs use cache (~1s)

---

## 9. Next Sprint Preview: Sprint 6

Sprint 6 focuses on testing, polish, and MVP release preparation:
- Integration testing for auth flow
- Spring Boot Actuator for monitoring
- Environment-based configuration
- Dockerization
- E2E testing across devices
