# Sprint 5: Core Gameplay - Round 2 (Guessing) & Results

**Sprint Goal**: Complete the core gameplay loop by implementing the guessing round (Round 2) and displaying the final scores. After this sprint, a couple will be able to play a full game end-to-end.

**Estimated Duration**: 6-8 days  
**Status**: PLANNING  
**Date**: February 21, 2026

---

## Table of Contents

1. [Sprint Overview](#1-sprint-overview)
2. [Architecture & Design Decisions](#2-architecture--design-decisions)
3. [Game Flow: End-to-End](#3-game-flow-end-to-end)
4. [Backend Implementation Plan](#4-backend-implementation-plan)
5. [Frontend Implementation Plan](#5-frontend-implementation-plan)
6. [Database Changes](#6-database-changes)
7. [WebSocket Message Catalog (New)](#7-websocket-message-catalog-new)
8. [Testing Strategy](#8-testing-strategy)
9. [Implementation Checklist](#9-implementation-checklist)
10. [Risk Assessment & Mitigations](#10-risk-assessment--mitigations)

---

## 1. Sprint Overview

### What Exists Today (Sprint 4 Complete)

A couple can:
1. Sign in with Google → receive JWT
2. Link accounts via invite code
3. Select a question category → send invitation to partner
4. Partner accepts/declines invitation
5. Both players answer 8 questions synchronously (Round 1)
6. See "Round 1 Complete" message → navigate back to Dashboard

### What Sprint 5 Adds

After Round 1 completes, the game **continues seamlessly**:
7. **Round 2 auto-starts**: The same 8 questions are replayed, but the prompt changes to "How did [Partner's Name] answer?"
8. **Guess submission**: Each player guesses what their partner answered in Round 1
9. **Per-question feedback**: After each guess, the player immediately sees whether they were right or wrong, along with what their partner actually answered
10. **Synchronization**: Both players must guess before advancing (same pattern as Round 1)
11. **Scoring**: When all 8 guesses are submitted, each player's score = number of correct guesses
12. **Results Screen**: A dedicated screen shows both scores, comparison, and "Play Again" / "Dashboard" buttons

### User Story

> *As a couple, after completing Round 1, I want to guess how my partner answered each question so that I can see how well I know them and compare scores.*

---

## 2. Architecture & Design Decisions

### Decision 1: Round 2 Transition — Automatic vs. Manual

**Options**:
- **(A) Automatic**: Server immediately starts Round 2 after broadcasting `ROUND1_COMPLETE`, sending the first Round 2 question
- **(B) Manual**: Frontend shows a "Start Round 2" button; player taps to trigger Round 2

**Chosen**: **(A) Automatic** with a brief client-side delay

**Rationale**: The game is a continuous experience. Adding a manual step breaks flow and introduces coordination complexity (who taps first?). Instead, the server auto-broadcasts the first Round 2 question alongside the `ROUND1_COMPLETE` status. The frontend can show a brief transition animation (1-2 seconds) before rendering the first Round 2 question.

**How it works**:
- When the last Round 1 answer is submitted and both players have answered:
  1. Server transitions status to `ROUND2`, resets `currentQuestionIndex` to 0
  2. Server broadcasts `ROUND1_COMPLETE` status to `/topic/game/{sessionId}`
  3. After a 500ms delay (server-side), server broadcasts the first Round 2 question to the same topic
- The frontend detects `ROUND1_COMPLETE`, shows a transition screen ("Get ready to guess!"), then receives the first Round 2 question and renders it

### Decision 2: Per-Question Feedback — Immediate vs. End-of-Round

**Options**:
- **(A) Immediate feedback**: After each guess, show "Correct! Partner chose C" or "Wrong, partner chose A"
- **(B) Batch feedback**: Reveal all results only at the end

**Chosen**: **(A) Immediate feedback**

**Rationale**: Immediate feedback creates excitement and engagement. Each question becomes a mini-moment of tension and revelation. This is the core emotional hook of the game — discovering how well you know your partner, one question at a time. It also mirrors popular quiz game patterns (e.g., Kahoot, HQ Trivia).

**How it works**:
- After submitting a guess, the server sends a **private** message to the guesser via `/user/queue/game-events` with:
  - `type: "GUESS_RESULT"`
  - `correct: true/false`
  - `yourGuess: "B"`
  - `partnerAnswer: "C"`
  - `questionText: "What is your favorite season?"` (for context)
- The frontend shows this result for ~2 seconds before both players advance to the next question

### Decision 3: Scoring Model

**Formula**: Each player's score = number of their correct guesses out of 8.

**Details**:
- Player A guesses Player B's answers. Each correct guess = +1 for Player A.
- Player B guesses Player A's answers. Each correct guess = +1 for Player B.
- Max score for each player = 8. Min = 0.
- Scores are independent (your score depends on how well YOU know your partner).

**Stored in**: `game_sessions.player1_score` and `game_sessions.player2_score` (columns already exist).

**Who is player1 vs player2**: Maps to `couple.user1` and `couple.user2` respectively (the one who generated the link code is user1, the one who redeemed it is user2).

### Decision 4: Guess Deduplication & Round2 Synchronization

**Pattern**: Identical to Round 1's synchronization approach.
- Guess deduplication: Check if `round2_guess` is already set for (session, question, user). If so, ignore duplicate.
- Synchronization: Count how many guesses exist for a question in this session (by checking `round2_guess IS NOT NULL`). When count >= 2, advance.

### Decision 5: New WebSocket Endpoint vs. Reusing `/game.answer`

**Options**:
- **(A) New `/game.guess` endpoint**: Separate message mapping for guesses
- **(B) Reuse `/game.answer`**: Detect round from session status and handle accordingly

**Chosen**: **(A) New `/game.guess` endpoint**

**Rationale**: Separation of concerns. The guess handler has fundamentally different logic (lookup partner's answer, return feedback, scoring). Mixing both into one handler would create a messy conditional. A separate endpoint also makes the WebSocket API clearer and easier to test.

---

## 3. Game Flow: End-to-End

### Complete Game State Machine

```
INVITED → [Accept] → ROUND1 → [8 questions answered] → ROUND2 → [8 guesses submitted] → COMPLETED
                  ↘ [Decline] → DECLINED
```

### Round 2 Sequence Diagram

```
                       ROUND 2 FLOW
┌──────────┐                                    ┌──────────┐
│ Player A │                                    │ Player B │
└────┬─────┘                                    └────┬─────┘
     │                                               │
     │       ROUND1_COMPLETE (broadcast)              │
     │◄──────────────────────────────────────────────►│
     │                                               │
     │       (brief transition: "Time to guess!")     │
     │                                               │
     │       ROUND2 Question 1 (broadcast)            │
     │       {round: "ROUND2",                        │
     │        questionText: "What is...",              │
     │        prompt: "How did [Partner] answer?"}     │
     │◄──────────────────────────────────────────────►│
     │                                               │
     │  /app/game.guess {guess:"B"}                  │
     │──────────────►┌──────┐                        │
     │               │Server│                        │
     │◄──────────────┤      │                        │
     │ GUESS_RESULT  │      │                        │
     │ {correct:false,│     │                        │
     │  partnerAnswer:│     │                        │
     │  "C"}         └──────┘                        │
     │                                               │
     │                       ┌──────┐                │
     │                       │Server│◄───────────────│ /app/game.guess {guess:"A"}
     │                       │      │───────────────►│
     │                       └──┬───┘  GUESS_RESULT  │
     │                          │      {correct:true, │
     │                          │       partnerAnswer:│
     │                          │       "A"}          │
     │                          │                     │
     │  Question 2 (broadcast)  │                     │
     │◄─────────────────────────┴────────────────────►│
     │                                               │
     │         ... repeat for 8 questions ...         │
     │                                               │
     │  GAME_COMPLETED (broadcast)                   │
     │  {player1Name:"Alice", player1Score:6,         │
     │   player2Name:"Bob", player2Score:5,           │
     │   totalQuestions:8}                            │
     │◄──────────────────────────────────────────────►│
```

### Guess Validation Logic (Per Question)

```
Player A submits guess for Question X:
  1. Validate: session status == ROUND2
  2. Validate: guess is A/B/C/D
  3. Check dedup: round2_guess already set? → ignore
  4. Find partner's Round 1 answer for this question
     → SELECT round1_answer FROM game_answers 
        WHERE session_id=? AND question_id=? AND user_id=partner_id
  5. Compare: guess == partner's answer → correct=true/false
  6. Record guess: UPDATE game_answers SET round2_guess=guess 
     WHERE session_id=? AND question_id=? AND user_id=playerA
  7. Send private GUESS_RESULT to Player A
  8. Count guesses for this question (both players)
  9. If count >= 2: advance to next question (broadcast)
  10. If last question: calculate scores → COMPLETED → broadcast results
```

---

## 4. Backend Implementation Plan

### 4.1 New DTO: GuessRequestDto

**File**: `backend/src/main/java/com/onlyyours/dto/GuessRequestDto.java`

**Purpose**: Incoming guess submission from client via WebSocket.

**Fields**:
- `sessionId` (UUID, @NotNull)
- `questionId` (Integer, @NotNull)
- `guess` (String, @NotNull, @Pattern "^[A-D]$")

**Theory — Why a Separate DTO**: Even though `GuessRequestDto` has the same fields as `AnswerRequestDto`, creating a separate DTO maintains semantic clarity. When reading the code 6 months from now, `GuessRequestDto` immediately communicates "this is a Round 2 guess" vs. "this is a Round 1 answer". It also allows the DTOs to diverge independently if we later add fields like `confidence` to guesses.

### 4.2 New DTO: GuessResultDto

**File**: `backend/src/main/java/com/onlyyours/dto/GuessResultDto.java`

**Purpose**: Private feedback sent to the guessing player after each guess.

**Fields**:
- `type` (String, default "GUESS_RESULT")
- `sessionId` (UUID)
- `questionId` (Integer)
- `questionNumber` (Integer) — 1-based for display
- `questionText` (String) — the question, for context in the feedback
- `yourGuess` (String) — the player's guess (A/B/C/D)
- `partnerAnswer` (String) — what the partner actually answered in Round 1
- `correct` (boolean) — whether the guess matches
- `correctCount` (Integer) — running total of correct guesses so far

**Theory — Running Score**: Including `correctCount` in each result lets the frontend show a running score without needing to track it separately. This follows the principle of "the server is the source of truth for game state."

### 4.3 New DTO: GameResultsDto

**File**: `backend/src/main/java/com/onlyyours/dto/GameResultsDto.java`

**Purpose**: Final results broadcast to both players when the game completes.

**Fields**:
- `type` (String, default "GAME_RESULTS")
- `sessionId` (UUID)
- `player1Name` (String)
- `player1Score` (Integer)
- `player2Name` (String)
- `player2Score` (Integer)
- `totalQuestions` (Integer) — always 8
- `message` (String) — e.g., "You know each other well!" or "Room for improvement!"

**Theory — Result Messages**: Including a computed message based on combined scores adds personality. Example tiers:
- 14-16 combined: "Soulmates! You know each other perfectly!"
- 10-13 combined: "Great connection! You really know each other."
- 6-9 combined: "Good start! Keep playing to learn more."
- 0-5 combined: "Lots to discover about each other!"

### 4.4 GameService Modifications

**File**: `backend/src/main/java/com/onlyyours/service/GameService.java`

**Changes**:

#### 4.4.1 Modify `submitAnswer()` — Trigger Round 2 Start

Currently, when the last Round 1 answer is submitted:
```java
if (nextIndex >= QUESTIONS_PER_GAME) {
    session.setStatus(GameSession.GameStatus.ROUND2);
    session.setCurrentQuestionIndex(0);
    gameSessionRepository.save(session);
    return Optional.empty();
}
```

**Change**: Return a signal that Round 1 is complete so the controller can initiate Round 2. We'll use the existing return pattern — `Optional.empty()` means "don't broadcast a next question" — and the controller already checks `session.getStatus() == ROUND2` to broadcast `ROUND1_COMPLETE`. We'll enhance the controller to also broadcast the first Round 2 question.

#### 4.4.2 New Method: `getFirstRound2Question(UUID sessionId)`

Returns the first question for Round 2 with `round="ROUND2"` in the payload.

```java
@Transactional
public QuestionPayloadDto getFirstRound2Question(UUID sessionId) {
    GameSession session = getGameSession(sessionId);
    String[] questionIdsArray = session.getQuestionIds().split(",");
    Integer firstQuestionId = Integer.parseInt(questionIdsArray[0]);
    Question firstQuestion = questionRepository.findById(firstQuestionId).orElseThrow();
    return buildQuestionPayload(session, firstQuestion, 1, "ROUND2");
}
```

**Theory — Replaying Questions**: Round 2 uses the exact same questions in the exact same order as Round 1. This is by design — the player is recalling the question context and guessing what their partner chose. We read the `questionIds` from the session (stored as comma-separated IDs) and iterate through them again.

#### 4.4.3 New Method: `submitGuess(UUID sessionId, UUID userId, Integer questionId, String guess)`

The core new business logic:

```java
@Transactional
public GuessResultDto submitGuess(UUID sessionId, UUID userId, Integer questionId, String guess) {
    // 1. Validate guess format (A-D)
    // 2. Validate session is in ROUND2
    // 3. Check for duplicate guess (idempotency)
    // 4. Find the existing GameAnswer for this user+question (created in Round 1)
    // 5. Set round2_guess on that GameAnswer
    // 6. Find partner's GameAnswer for same question → get round1_answer
    // 7. Compare: guess == partner's round1_answer → correct
    // 8. Count total correct guesses so far for this user
    // 9. Return GuessResultDto with feedback
}
```

**Returns**: `GuessResultDto` (always, since we always send feedback)

**Side effect**: Updates `GameAnswer.round2Guess` field.

**Key insight**: We don't create a new `GameAnswer` row for Round 2. Instead, we **update** the existing row that was created in Round 1 by setting the `round2_guess` column. Each row represents one player's interaction with one question across both rounds.

#### 4.4.4 New Method: `areBothPlayersGuessed(UUID sessionId, Integer questionId)`

Counts how many players have guessed for a given question:

```java
public boolean areBothPlayersGuessed(UUID sessionId, Integer questionId) {
    long count = gameAnswerRepository.countByGameSession_IdAndQuestion_IdAndRound2GuessIsNotNull(sessionId, questionId);
    return count >= 2;
}
```

#### 4.4.5 New Method: `getNextRound2Question(UUID sessionId)`

Advances `currentQuestionIndex` and returns the next question with `round="ROUND2"`. Returns `Optional.empty()` if all questions are done.

#### 4.4.6 New Method: `calculateAndCompleteGame(UUID sessionId)`

Final scoring logic:

```java
@Transactional
public GameResultsDto calculateAndCompleteGame(UUID sessionId) {
    GameSession session = getGameSession(sessionId);
    Couple couple = session.getCouple();
    User player1 = couple.getUser1();
    User player2 = couple.getUser2();
    
    List<GameAnswer> allAnswers = gameAnswerRepository.findByGameSession_IdOrderByQuestion_Id(sessionId);
    
    int player1Score = 0;
    int player2Score = 0;
    
    // Group answers by question
    Map<Integer, List<GameAnswer>> byQuestion = allAnswers.stream()
        .collect(Collectors.groupingBy(a -> a.getQuestion().getId()));
    
    for (List<GameAnswer> questionAnswers : byQuestion.values()) {
        GameAnswer p1Answer = questionAnswers.stream()
            .filter(a -> a.getUser().getId().equals(player1.getId()))
            .findFirst().orElse(null);
        GameAnswer p2Answer = questionAnswers.stream()
            .filter(a -> a.getUser().getId().equals(player2.getId()))
            .findFirst().orElse(null);
        
        if (p1Answer != null && p2Answer != null) {
            // Player 1's guess vs Player 2's actual answer
            if (p1Answer.getRound2Guess() != null && 
                p1Answer.getRound2Guess().equals(p2Answer.getRound1Answer())) {
                player1Score++;
            }
            // Player 2's guess vs Player 1's actual answer
            if (p2Answer.getRound2Guess() != null && 
                p2Answer.getRound2Guess().equals(p1Answer.getRound1Answer())) {
                player2Score++;
            }
        }
    }
    
    session.setPlayer1Score(player1Score);
    session.setPlayer2Score(player2Score);
    session.setStatus(GameSession.GameStatus.COMPLETED);
    session.setCompletedAt(new Date());
    gameSessionRepository.save(session);
    
    return GameResultsDto.builder()
        .sessionId(sessionId)
        .player1Name(player1.getName())
        .player1Score(player1Score)
        .player2Name(player2.getName())
        .player2Score(player2Score)
        .totalQuestions(QUESTIONS_PER_GAME)
        .message(getResultMessage(player1Score + player2Score))
        .build();
}
```

**Theory — Scoring Correctness**: The scoring logic iterates over all answers grouped by question. For each question, it cross-references:
- Player 1's `round2_guess` against Player 2's `round1_answer`
- Player 2's `round2_guess` against Player 1's `round1_answer`

This is an O(n) operation where n = number of answers (16 for an 8-question game: 2 players × 8 questions). Extremely efficient.

#### 4.4.7 Modify `buildQuestionPayload()` — Accept Round Parameter

Add a `round` parameter so it can generate both ROUND1 and ROUND2 payloads:

```java
private QuestionPayloadDto buildQuestionPayload(
        GameSession session, Question question, int questionNumber, String round) {
    return QuestionPayloadDto.builder()
        .sessionId(session.getId())
        .questionId(question.getId())
        .questionNumber(questionNumber)
        .totalQuestions(QUESTIONS_PER_GAME)
        .questionText(question.getText())
        .optionA(question.getOptionA())
        .optionB(question.getOptionB())
        .optionC(question.getOptionC())
        .optionD(question.getOptionD())
        .round(round)
        .build();
}
```

### 4.5 GameController Modifications

**File**: `backend/src/main/java/com/onlyyours/controller/GameController.java`

#### 4.5.1 Modify `handleAnswer()` — Trigger Round 2 Start

When the controller detects `ROUND1_COMPLETE`, it should also broadcast the first Round 2 question:

```java
if (session.getStatus() == GameSession.GameStatus.ROUND2) {
    String gameTopic = "/topic/game/" + request.getSessionId();
    
    // 1. Broadcast Round 1 complete status
    messagingTemplate.convertAndSend(gameTopic,
        GameStatusDto.builder()
            .sessionId(request.getSessionId())
            .status("ROUND1_COMPLETE")
            .message("Round 1 complete! Now guess your partner's answers...")
            .build()
    );
    
    // 2. Brief delay, then broadcast first Round 2 question
    // Using a scheduled task or Thread.sleep (simple for MVP)
    QuestionPayloadDto firstRound2Question = 
        gameService.getFirstRound2Question(request.getSessionId());
    messagingTemplate.convertAndSend(gameTopic, firstRound2Question);
}
```

**Theory — Server-Side Delay**: A brief delay between `ROUND1_COMPLETE` and the first Round 2 question gives the frontend time to display a transition animation. In production, we'd use `ScheduledExecutorService` or Spring's `@Async` for non-blocking delay. For MVP, a simple approach works. Alternatively, the frontend can handle the delay client-side by buffering the first ROUND2 question and displaying it after showing a transition UI.

#### 4.5.2 New Method: `handleGuess(@Payload GuessRequestDto request, Principal principal)`

```java
@MessageMapping("/game.guess")
public void handleGuess(@Payload GuessRequestDto request, Principal principal) {
    try {
        String userEmail = principal.getName();
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        
        // 1. Submit guess and get result
        GuessResultDto result = gameService.submitGuess(
            request.getSessionId(), user.getId(), 
            request.getQuestionId(), request.getGuess()
        );
        
        // 2. Send private feedback to this player
        messagingTemplate.convertAndSendToUser(
            userEmail, "/queue/game-events", result
        );
        
        // 3. Check if both players have guessed this question
        if (gameService.areBothPlayersGuessed(request.getSessionId(), request.getQuestionId())) {
            // Try to get next question
            Optional<QuestionPayloadDto> nextQuestion = 
                gameService.getNextRound2Question(request.getSessionId());
            
            String gameTopic = "/topic/game/" + request.getSessionId();
            
            if (nextQuestion.isPresent()) {
                messagingTemplate.convertAndSend(gameTopic, nextQuestion.get());
            } else {
                // All questions guessed — calculate scores
                GameResultsDto results = 
                    gameService.calculateAndCompleteGame(request.getSessionId());
                messagingTemplate.convertAndSend(gameTopic, results);
            }
        }
        // Else: waiting for partner to guess (no broadcast)
        
    } catch (Exception e) {
        log.error("Error handling guess from {}: {}", principal.getName(), e.getMessage(), e);
        sendErrorToUser(principal.getName(), "Failed to submit guess: " + e.getMessage());
    }
}
```

### 4.6 GameAnswerRepository Additions

**File**: `backend/src/main/java/com/onlyyours/repository/GameAnswerRepository.java`

**New Methods**:

```java
long countByGameSession_IdAndQuestion_IdAndRound2GuessIsNotNull(
    UUID gameSessionId, Integer questionId
);

List<GameAnswer> findByGameSession_IdAndUser_IdAndRound2GuessIsNotNull(
    UUID gameSessionId, UUID userId
);
```

**Theory — JPA Derived Queries**: Spring Data JPA supports `IsNotNull` as a keyword in method names. `countByGameSession_IdAndQuestion_IdAndRound2GuessIsNotNull` translates to:

```sql
SELECT COUNT(*) FROM game_answers 
WHERE game_session_id = ? AND question_id = ? AND round2_guess IS NOT NULL
```

This elegantly counts only the guesses (not the answers) without needing a custom `@Query`.

---

## 5. Frontend Implementation Plan

### 5.1 GameContext.js Modifications

**File**: `OnlyYoursApp/src/state/GameContext.js`

**New State Variables**:
- `round` (string: 'round1' | 'round2' | null) — current round
- `guessResult` (object | null) — latest guess feedback from server
- `scores` (object | null) — final game results
- `partnerName` (string | null) — partner's name for Round 2 prompt
- `correctCount` (number) — running count of correct guesses
- `isTransitioning` (boolean) — true during Round 1→2 transition

**New Methods**:
- `submitGuess(guess)` — sends guess via `/app/game.guess`
- `clearGuessResult()` — clears feedback after display timeout

**Modified Behavior**:

In the `startGame` subscription handler, handle new message types:

```javascript
const sub = WebSocketService.subscribe(gameTopic, (message) => {
    const payload = JSON.parse(message.body);
    
    if (payload.type === 'QUESTION') {
        if (payload.round === 'ROUND2') {
            setRound('round2');
            setIsTransitioning(false);
        }
        setCurrentQuestion(payload);
        setMyAnswer(null);
        setWaitingForPartner(false);
        setGuessResult(null);
    } else if (payload.type === 'STATUS' && payload.status === 'ROUND1_COMPLETE') {
        setIsTransitioning(true);
        // Frontend shows transition UI for ~2 seconds
        // First ROUND2 question will arrive shortly after
    } else if (payload.type === 'GAME_RESULTS') {
        setScores(payload);
        setGameStatus('completed');
    }
});
```

Also subscribe to private queue for guess results:
```javascript
WebSocketService.subscribe('/user/queue/game-events', (message) => {
    const payload = JSON.parse(message.body);
    if (payload.type === 'GUESS_RESULT') {
        setGuessResult(payload);
        setCorrectCount(payload.correctCount);
        setWaitingForPartner(true);
    }
});
```

**Theory — Subscription Multiplexing**: The game topic subscription handles broadcast messages (questions, status, results), while the private queue subscription handles individual feedback (guess results). This separation is critical — guess results are private to each player (you shouldn't see your partner's feedback).

### 5.2 GameScreen.js Modifications

**File**: `OnlyYoursApp/src/screens/GameScreen.js`

**Major Changes**:

1. **Round-aware header**: Show "Round 1: Answer" or "Round 2: Guess" in the progress area
2. **Dynamic prompt**: 
   - Round 1: "What would you answer?" (implicit, just show question)
   - Round 2: "How did [Partner's Name] answer this?" (explicit prompt above question)
3. **Guess feedback overlay**: After submitting a guess, show a result card:
   - Green checkmark + "Correct! Your partner chose [C]" 
   - Red X + "Not quite. Your partner chose [A]"
   - Auto-dismiss after 2 seconds or when next question arrives
4. **Transition screen**: Between Round 1 and Round 2, show:
   - "Great job! Now let's see how well you know your partner..."
   - Brief animation (e.g., pulsing heart or spinning card)
   - Auto-dismissed when first Round 2 question arrives
5. **Score display**: Show running correct count during Round 2 ("3/5 correct so far")
6. **Submit button text**: "Submit Answer" in Round 1, "Submit Guess" in Round 2

**Conditional Rendering Flow**:

```
if (isTransitioning)     → Transition UI ("Get ready for Round 2!")
if (guessResult)         → Guess feedback overlay (2-second auto-dismiss)
if (!currentQuestion)    → Loading spinner
else                     → Question + Options + Submit
```

**Visual Design for Round 2**:
- Header background changes from purple (#6200ea) to teal (#03dac6) to visually distinguish rounds
- Question card shows a "Round 2" badge
- Options show partner's icon instead of letter badges (optional polish)

### 5.3 New Screen: ResultsScreen.js

**File**: `OnlyYoursApp/src/screens/ResultsScreen.js`

**Purpose**: Display final game scores after Round 2 completes.

**UI Structure**:

```
┌─────────────────────────────┐
│       🎉 Game Complete!      │
│                               │
│   ┌─────────┐  ┌─────────┐   │
│   │  Alice   │  │   Bob   │   │
│   │  ♥️ 6/8  │  │  ♥️ 5/8  │   │
│   └─────────┘  └─────────┘   │
│                               │
│   "Great connection!          │
│    You really know            │
│    each other."               │
│                               │
│   Combined: 11/16             │
│                               │
│   ┌──────────────────────┐    │
│   │     Play Again       │    │
│   └──────────────────────┘    │
│   ┌──────────────────────┐    │
│   │   Back to Dashboard  │    │
│   └──────────────────────┘    │
└─────────────────────────────┘
```

**Features**:
- Score cards for each player with animated count-up (0 → final score)
- Result message based on combined score tier
- "Play Again" button → navigates to `CategorySelectionScreen`
- "Back to Dashboard" button → navigates to `Dashboard`
- Calls `endGame()` from GameContext on navigation

**Score Display Tiers** (based on combined score out of 16):
- 14-16: "Soulmates! You know each other perfectly!"
- 10-13: "Great connection! You really know each other."
- 6-9: "Good start! Keep playing to learn more."
- 0-5: "Lots to discover about each other!"

### 5.4 AppNavigator.js Modifications

**File**: `OnlyYoursApp/src/navigation/AppNavigator.js`

**Changes**:
- Import `ResultsScreen`
- Add `Results` route to Stack.Navigator
- Configure with `headerLeft: null` and `gestureEnabled: false` (prevent back-navigation to game)

### 5.5 GameScreen.js — Handling Game Completion (Navigation to Results)

When `gameStatus === 'completed'` and `scores` is set:
- Navigate to `Results` screen, passing `scores` as route params
- This replaces the current "Round 1 Complete → Dashboard" navigation

---

## 6. Database Changes

### No New Migration Required

All necessary columns already exist:

| Column | Table | Type | Added In | Purpose in Sprint 5 |
|--------|-------|------|----------|---------------------|
| `round2_guess` | `game_answers` | VARCHAR(255) | V1 (Sprint 0) | Stores player's guess for partner's answer |
| `player1_score` | `game_sessions` | INTEGER | V1 (Sprint 0) | Final score for player 1 |
| `player2_score` | `game_sessions` | INTEGER | V1 (Sprint 0) | Final score for player 2 |
| `completed_at` | `game_sessions` | TIMESTAMP | V3 (Sprint 4) | When game finished |
| `current_question_index` | `game_sessions` | INTEGER | V3 (Sprint 4) | Tracks Round 2 progress (reset to 0 at start of Round 2) |

**Theory — Forward-Looking Schema Design**: The initial schema (V1) was designed with the complete game flow in mind. Columns like `round2_guess`, `player1_score`, and `player2_score` were created in Sprint 0 even though they weren't used until Sprint 5. This is a common pattern in Flyway-based projects — design the schema holistically upfront to minimize migration churn.

### Question Seeding Prerequisite

**Issue**: Categories with fewer than 8 questions cannot be used for games. Currently:
- Getting to Know You: 4 questions (needs 4 more)
- Daily Habits: 4 questions (needs 4 more)
- Memories: 4 questions (needs 4 more)
- Intimacy: 4 questions (needs 4 more)

**Action**: Create `V4__Seed_Additional_Questions.sql` to add more questions to these categories. This is a Sprint 4 carryover item but should be done at the start of Sprint 5 to avoid game crashes.

---

## 7. WebSocket Message Catalog (New for Sprint 5)

### New Messages

| Direction | Destination | Payload Type | When |
|-----------|-------------|-------------|------|
| Server→Both | `/topic/game/{sessionId}` | `QuestionPayloadDto` {round:"ROUND2"} | First Round 2 question (auto after ROUND1_COMPLETE) |
| Client→Server | `/app/game.guess` | `GuessRequestDto` {sessionId, questionId, guess} | Player submits a guess |
| Server→Client | `/user/queue/game-events` | `GuessResultDto` {correct, partnerAnswer, yourGuess, correctCount} | Private feedback after each guess |
| Server→Both | `/topic/game/{sessionId}` | `QuestionPayloadDto` {round:"ROUND2"} | Next Round 2 question (when both guessed) |
| Server→Both | `/topic/game/{sessionId}` | `GameResultsDto` {player1Score, player2Score, ...} | Game complete, final scores |

### Updated Message Flow Summary

```
Round 1:
  /app/game.answer → ANSWER_RECORDED (private) → QUESTION (broadcast) × 7 → ROUND1_COMPLETE (broadcast)

Round 2:
  QUESTION round=ROUND2 (broadcast, auto) 
  → /app/game.guess → GUESS_RESULT (private) 
  → [both guessed] → QUESTION round=ROUND2 (broadcast) × 7
  → [last guess] → GAME_RESULTS (broadcast)
```

---

## 8. Testing Strategy

### 8.1 Backend Unit Tests

**File**: `backend/src/test/java/com/onlyyours/service/GameServiceTest.java` (extend existing)

**New Test Cases** (estimated 18 new tests):

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| 1 | `testSubmitGuess_Success` | Happy path: guess recorded, correct result returned |
| 2 | `testSubmitGuess_IncorrectGuess` | Guess doesn't match partner's answer → `correct=false` |
| 3 | `testSubmitGuess_InvalidFormat` | Rejects guess not in [A-D] |
| 4 | `testSubmitGuess_WrongGameStatus` | Rejects guess when status != ROUND2 |
| 5 | `testSubmitGuess_DuplicateGuess_Idempotent` | Second guess for same question ignored |
| 6 | `testAreBothPlayersGuessed_NoneGuessed` | Returns false when no guesses |
| 7 | `testAreBothPlayersGuessed_OneGuessed` | Returns false when one player guessed |
| 8 | `testAreBothPlayersGuessed_BothGuessed` | Returns true when both guessed |
| 9 | `testGetFirstRound2Question` | Returns question 1 with round="ROUND2" |
| 10 | `testGetNextRound2Question_HasMore` | Returns next question, advances index |
| 11 | `testGetNextRound2Question_LastQuestion` | Returns empty when no more questions |
| 12 | `testCalculateAndCompleteGame_AllCorrect` | Both players score 8/8 |
| 13 | `testCalculateAndCompleteGame_AllWrong` | Both players score 0/8 |
| 14 | `testCalculateAndCompleteGame_Mixed` | Realistic mixed scores |
| 15 | `testCalculateAndCompleteGame_SetsCompleted` | Status=COMPLETED, completedAt set |
| 16 | `testFullGameLifecycle_Round1ThroughScoring` | Complete game from invitation to scores |
| 17 | `testGetResultMessage_HighScore` | Correct tier message for high combined score |
| 18 | `testGetResultMessage_LowScore` | Correct tier message for low combined score |

### 8.2 Backend Integration Tests (WebSocket)

**File**: `backend/src/test/java/com/onlyyours/controller/GameControllerWebSocketTest.java` (extend existing)

**New Test Cases** (estimated 6 new tests):

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| 1 | `testRound2_FirstQuestionBroadcastedAfterRound1Complete` | Auto-transition broadcasts Round 2 Q1 |
| 2 | `testGuess_PrivateFeedbackReceived` | GUESS_RESULT sent only to guessing player |
| 3 | `testGuess_BothGuessed_NextQuestionBroadcasted` | Next question sent when both guess |
| 4 | `testGuess_LastQuestion_ResultsBroadcasted` | GAME_RESULTS sent after last guess |
| 5 | `testFullGame_Round1AndRound2_EndToEnd` | Complete 16-step game flow |
| 6 | `testGuess_InvalidSession_ErrorReturned` | Error on wrong session ID |

### 8.3 Frontend Unit Tests

**File**: `OnlyYoursApp/src/screens/__tests__/GameScreen.test.js` (extend existing)

**New Test Cases** (estimated 10 new tests):

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| 1 | `renders Round 2 prompt with partner name` | Shows "How did [Name] answer?" |
| 2 | `shows transition screen between rounds` | Transition UI on ROUND1_COMPLETE |
| 3 | `shows guess result overlay - correct` | Green checkmark, partner's answer |
| 4 | `shows guess result overlay - incorrect` | Red X, partner's answer |
| 5 | `auto-dismisses guess result after timeout` | Result clears after 2 seconds |
| 6 | `shows running correct count in Round 2` | "3/5 correct so far" display |
| 7 | `submit button says Submit Guess in Round 2` | Button text changes per round |
| 8 | `navigates to Results on game completion` | GameStatus=completed → Results screen |
| 9 | `round indicator shows correct round` | Header shows Round 1 vs Round 2 |
| 10 | `disables options after guess submitted` | Options disabled during waiting state |

**File**: `OnlyYoursApp/src/screens/__tests__/ResultsScreen.test.js` (new)

**New Test Cases** (estimated 6 new tests):

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| 1 | `renders both player names and scores` | Names and scores displayed |
| 2 | `shows correct result message tier` | Message matches combined score |
| 3 | `Play Again navigates to CategorySelection` | Button navigation works |
| 4 | `Back to Dashboard navigates to Dashboard` | Button navigation works |
| 5 | `calls endGame on navigation` | GameContext cleanup triggered |
| 6 | `renders combined score` | Shows "Combined: X/16" |

### 8.4 Regression Tests

Ensure all existing Sprint 4 tests still pass:
- 54 backend tests (unchanged behavior for Round 1)
- 14 frontend tests (GameContext, GameScreen basic functionality)

### 8.5 Integration Test: Full Game Lifecycle

One comprehensive test that runs the complete flow:
1. Create invitation → Accept
2. Both players answer 8 questions (Round 1)
3. Verify ROUND1_COMPLETE received
4. Both players guess 8 questions (Round 2)
5. Verify GUESS_RESULT feedback for each guess
6. Verify GAME_RESULTS with correct scores
7. Verify database state (session COMPLETED, scores set, all answers and guesses recorded)

---

## 9. Implementation Checklist

### Phase 1: Backend DTOs & Data Layer
- [x] Create `GuessRequestDto.java`
- [x] Create `GuessResultDto.java`
- [x] Create `GameResultsDto.java`
- [x] Add `countByGameSession_IdAndQuestion_IdAndRound2GuessIsNotNull` to `GameAnswerRepository`
- [x] Create `V4__Seed_Additional_Questions.sql` (prerequisite: categories need 8+ questions)

### Phase 2: Backend Service Layer
- [x] Modify `GameService.buildQuestionPayload()` to accept round parameter
- [x] Update existing `buildQuestionPayload()` callers to pass "ROUND1"
- [x] Add `getFirstRound2Question()` method
- [x] Add `submitGuess()` method with validation, dedup, partner answer lookup
- [x] Add `areBothPlayersGuessed()` method
- [x] Add `getNextRound2Question()` method
- [x] Add `calculateAndCompleteGame()` method with scoring logic
- [x] Add `getResultMessage()` helper method

### Phase 3: Backend Controller Layer
- [x] Modify `handleAnswer()` to broadcast first Round 2 question after ROUND1_COMPLETE
- [x] Add `handleGuess()` method with `@MessageMapping("/game.guess")`
- [x] Wire guess result (private), next question (broadcast), and game results (broadcast)

### Phase 4: Backend Testing
- [x] Write 16 new unit tests in `GameServiceTest.java` (70 total, 0 failures)
- [x] Run full test suite — verify all 54 existing + 16 new tests pass
- [x] Fixed off-by-one in `testGetNextRound2Question_LastQuestion` during testing

### Phase 5: Frontend Context & State
- [x] Add new state variables to `GameContext.js` (round, guessResult, scores, correctCount, isTransitioning)
- [x] Add `submitGuess()` method to GameContext
- [x] Add `clearGuessResult()` method to GameContext
- [x] Handle `GUESS_RESULT` messages in private queue subscription
- [x] Handle `GAME_RESULTS` messages in game topic subscription
- [x] Handle `ROUND1_COMPLETE` → transition state
- [x] Handle ROUND2 questions (set round to 'round2')
- [x] Update context value export with new fields

### Phase 6: Frontend GameScreen Modifications
- [x] Add round-aware header with "Round 1" / "Round 2" indicator
- [x] Add Round 2 prompt: "How did your partner answer?"
- [x] Add transition screen between rounds
- [x] Add guess result overlay (correct/incorrect feedback)
- [x] Add running correct count display for Round 2
- [x] Change submit button text by round
- [x] Navigate to Results screen on game completion
- [x] Reset `selectedOption` when new question arrives (both rounds)

### Phase 7: Frontend ResultsScreen
- [x] Create `ResultsScreen.js` with score display
- [x] Add player name and score cards with animated scores
- [x] Add result message based on combined score tier
- [x] Add "Play Again" button → CategorySelectionScreen
- [x] Add "Back to Dashboard" button
- [x] Call `endGame()` on navigation away
- [x] Style with celebratory design (colors, layout, typography)

### Phase 8: Frontend Navigation & Integration
- [x] Add Results screen route to `AppNavigator.js`
- [x] Configure Results with `headerLeft: null`, `gestureEnabled: false`
- [x] Import ResultsScreen in AppNavigator

### Phase 9: Frontend Testing
- [x] Write 2 GameScreen tests (loading state, initial badge)
- [x] Write 8 ResultsScreen tests (render, navigation, scores)
- [x] Write 11 GameContext tests (round2, guess, results, error handling)
- [x] Run full frontend test suite — 21 tests, 3 suites, 0 failures
- [x] Fixed Jest config (RN test environment hang, babel preset, react-test-renderer version)

### Phase 10: Regression & Final Validation
- [x] Run all backend tests: 70 tests, 0 failures
- [x] Run all frontend tests: 21 tests, 0 failures
- [x] Update `DEVELOPMENT_PLAN.md` with Sprint 5 completion status
- [x] Update `PROJECT_STATUS.md` with Sprint 5 details
- [x] Create `SPRINT_5_IMPLEMENTATION.md` with detailed report

---

## 10. Risk Assessment & Mitigations

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Race condition in guess counting (same as Round 1) | Medium | Low | `@Transactional` + database-level counting; acceptable for MVP |
| Round 2 question arrives before frontend shows transition | Medium | Medium | Frontend buffers ROUND2 questions during transition state |
| Partner disconnects during Round 2 | High | Low | Same as Round 1 — out of scope for Sprint 5; addressed in Sprint 6 |
| Guess result message arrives out of order | Low | Low | Results keyed by questionId; frontend ignores stale results |
| Categories with <8 questions crash game | High | High | **Mitigated**: V4 migration seeds additional questions |
| Score calculation wrong if answer rows missing | Medium | Low | Defensive null checks in scoring logic; log warnings |

### Dependencies
- All Sprint 4 code must be stable (it is — 54 tests passing)
- V4 migration must run before games use small categories
- WebSocket infrastructure unchanged from Sprint 3/4

### Out of Scope (Sprint 6)
- Game history / past results viewing
- Reconnection UI during game
- Session timeout for abandoned games
- Push notifications for invitations
- Animations and polish

---

## Appendix: File Changes Summary

### New Files (7)
| File | Type | Purpose |
|------|------|---------|
| `backend/src/main/java/com/onlyyours/dto/GuessRequestDto.java` | Backend DTO | Guess submission payload |
| `backend/src/main/java/com/onlyyours/dto/GuessResultDto.java` | Backend DTO | Private guess feedback |
| `backend/src/main/java/com/onlyyours/dto/GameResultsDto.java` | Backend DTO | Final game results |
| `backend/src/main/resources/db/migration/V4__Seed_Additional_Questions.sql` | Migration | Seed questions for small categories |
| `OnlyYoursApp/src/screens/ResultsScreen.js` | Frontend Screen | Game results display |
| `OnlyYoursApp/src/screens/__tests__/ResultsScreen.test.js` | Frontend Test | ResultsScreen tests |
| `SPRINT_5_IMPLEMENTATION.md` | Documentation | Sprint 5 report |

### Modified Files (7)
| File | Changes |
|------|---------|
| `backend/src/main/java/com/onlyyours/service/GameService.java` | +6 new methods, modify buildQuestionPayload |
| `backend/src/main/java/com/onlyyours/controller/GameController.java` | +handleGuess, modify handleAnswer |
| `backend/src/main/java/com/onlyyours/repository/GameAnswerRepository.java` | +2 query methods |
| `OnlyYoursApp/src/state/GameContext.js` | +6 state vars, +2 methods, handle new messages |
| `OnlyYoursApp/src/screens/GameScreen.js` | Round 2 UI, transition, feedback overlay |
| `OnlyYoursApp/src/navigation/AppNavigator.js` | +Results route |
| `backend/src/test/java/com/onlyyours/service/GameServiceTest.java` | +18 test cases |

### Updated Documentation (3)
| File | Changes |
|------|---------|
| `DEVELOPMENT_PLAN.md` | Sprint 5 checkboxes updated |
| `PROJECT_STATUS.md` | Sprint 5 details added |
| `SPRINT_5_IMPLEMENTATION.md` | Created with detailed report |

---

**Document Version**: 2.0  
**Status**: COMPLETED  
**Author**: Development Team  
**Completed**: February 21, 2026
