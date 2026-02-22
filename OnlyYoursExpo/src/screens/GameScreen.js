import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useGame } from '../state/GameContext';

const GUESS_RESULT_DISPLAY_MS = 2500;

const GameScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const {
    currentQuestion,
    myAnswer,
    waitingForPartner,
    submitAnswer,
    submitGuess,
    gameStatus,
    endGame,
    round,
    guessResult,
    scores,
    correctCount,
    isTransitioning,
    clearGuessResult,
  } = useGame();

  const [selectedOption, setSelectedOption] = useState(null);
  const [showingResult, setShowingResult] = useState(false);

  useEffect(() => {
    if (gameStatus === 'completed' && scores) {
      navigation.replace('Results', { scores });
    }
  }, [gameStatus, scores, navigation]);

  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(null);
      setShowingResult(false);
    }
  }, [currentQuestion?.questionId]);

  useEffect(() => {
    if (guessResult && round === 'round2') {
      setShowingResult(true);
      const timer = setTimeout(() => {
        setShowingResult(false);
        clearGuessResult();
      }, GUESS_RESULT_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
  }, [guessResult, round, clearGuessResult]);

  const handleOptionSelect = useCallback((option) => {
    if (waitingForPartner || myAnswer) return;
    setSelectedOption(option);
  }, [waitingForPartner, myAnswer]);

  const handleSubmit = useCallback(() => {
    if (!selectedOption) return;
    if (round === 'round2') {
      submitGuess(selectedOption);
    } else {
      submitAnswer(selectedOption);
    }
  }, [selectedOption, round, submitAnswer, submitGuess]);

  const renderOption = (letter, text) => {
    const isSelected = selectedOption === letter;
    const isMyAnswer = myAnswer === letter;
    const isDisabled = waitingForPartner || myAnswer;

    const optionLetterBg = round === 'round2'
      ? styles.optionLetterRound2
      : styles.optionLetterRound1;

    return (
      <TouchableOpacity
        key={letter}
        style={[
          styles.optionCard,
          isSelected && (round === 'round2' ? styles.selectedOptionR2 : styles.selectedOption),
          isMyAnswer && styles.submittedOption,
          isDisabled && styles.disabledOption,
        ]}
        onPress={() => handleOptionSelect(letter)}
        disabled={isDisabled}
        activeOpacity={0.7}>
        <View style={[styles.optionLetter, optionLetterBg]}>
          <Text style={styles.optionLetterText}>{letter}</Text>
        </View>
        <Text style={styles.optionText}>{text}</Text>
      </TouchableOpacity>
    );
  };

  if (isTransitioning) {
    return (
      <View style={styles.transitionContainer}>
        <Text style={styles.transitionEmoji}>🎯</Text>
        <Text style={styles.transitionTitle}>Round 1 Complete!</Text>
        <Text style={styles.transitionSubtitle}>
          Now guess how your partner answered...
        </Text>
        <ActivityIndicator
          size="large"
          color="#03dac6"
          style={styles.transitionSpinner}
        />
      </View>
    );
  }

  if (showingResult && guessResult && round === 'round2') {
    return (
      <View style={styles.resultOverlay}>
        <View
          style={[
            styles.resultCard,
            guessResult.correct ? styles.resultCorrect : styles.resultWrong,
          ]}>
          <Text style={styles.resultEmoji}>
            {guessResult.correct ? '✅' : '❌'}
          </Text>
          <Text style={styles.resultTitle}>
            {guessResult.correct ? 'Correct!' : 'Not quite!'}
          </Text>
          <Text style={styles.resultDetail}>
            Your partner chose{' '}
            <Text style={styles.resultBold}>{guessResult.partnerAnswer}</Text>
          </Text>
          {guessResult.questionText && (
            <Text style={styles.resultQuestion} numberOfLines={2}>
              "{guessResult.questionText}"
            </Text>
          )}
          <Text style={styles.resultScore}>
            {guessResult.correctCount} correct so far
          </Text>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={styles.loadingText}>Loading question...</Text>
      </View>
    );
  }

  const isRound2 = round === 'round2';
  const primaryColor = isRound2 ? '#03dac6' : '#6200ea';
  const progressPercent =
    (currentQuestion.questionNumber / currentQuestion.totalQuestions) * 100;

  return (
    <View style={styles.container}>
      {/* Round Badge */}
      <View style={[styles.roundBadge, isRound2 && styles.roundBadgeR2]}>
        <Text style={[styles.roundBadgeText, isRound2 && styles.roundBadgeTextR2]}>
          {isRound2 ? 'Round 2: Guess' : 'Round 1: Answer'}
        </Text>
        {isRound2 && (
          <Text style={styles.runningScore}>
            {correctCount}/{currentQuestion.questionNumber - 1} correct
          </Text>
        )}
      </View>

      {/* Progress */}
      <View style={styles.header}>
        <Text style={[styles.questionNumber, { color: primaryColor }]}>
          Question {currentQuestion.questionNumber} of{' '}
          {currentQuestion.totalQuestions}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: primaryColor },
            ]}
          />
        </View>
      </View>

      {/* Round 2 Prompt */}
      {isRound2 && (
        <View style={styles.guessPrompt}>
          <Text style={styles.guessPromptText}>
            How did your partner answer this?
          </Text>
        </View>
      )}

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {renderOption('A', currentQuestion.optionA)}
        {renderOption('B', currentQuestion.optionB)}
        {renderOption('C', currentQuestion.optionC)}
        {renderOption('D', currentQuestion.optionD)}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {waitingForPartner ? (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={primaryColor} />
            <Text style={styles.waitingText}>Waiting for partner...</Text>
          </View>
        ) : myAnswer ? (
          <Text style={styles.waitingText}>
            {isRound2 ? 'Guess submitted!' : 'Answer submitted!'}
          </Text>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: primaryColor },
              !selectedOption && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedOption}
            activeOpacity={0.8}>
            <Text style={styles.submitButtonText}>
              {isRound2 ? 'Submit Guess' : 'Submit Answer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },

  // Round badge
  roundBadge: {
    alignSelf: 'center',
    backgroundColor: '#f3e5f5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundBadgeR2: {
    backgroundColor: '#e0f7fa',
  },
  roundBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6200ea',
  },
  roundBadgeTextR2: {
    color: '#00796b',
  },
  runningScore: {
    fontSize: 13,
    color: '#00796b',
    marginLeft: 10,
    fontWeight: '600',
  },

  // Header
  header: {
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Guess prompt
  guessPrompt: {
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#03dac6',
  },
  guessPromptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00796b',
    textAlign: 'center',
  },

  // Question
  questionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    lineHeight: 28,
    textAlign: 'center',
  },

  // Options
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedOption: {
    borderColor: '#6200ea',
    backgroundColor: '#f3e5f5',
  },
  selectedOptionR2: {
    borderColor: '#03dac6',
    backgroundColor: '#e0f7fa',
  },
  submittedOption: {
    borderColor: '#03dac6',
    backgroundColor: '#e0f7fa',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionLetterRound1: {
    backgroundColor: '#6200ea',
  },
  optionLetterRound2: {
    backgroundColor: '#03dac6',
  },
  optionLetterText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },

  // Footer
  footer: {
    paddingTop: 16,
    paddingBottom: 10,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#b0b0b0',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  waitingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    textAlign: 'center',
  },

  // Transition screen
  transitionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    padding: 40,
  },
  transitionEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  transitionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: 12,
    textAlign: 'center',
  },
  transitionSubtitle: {
    fontSize: 18,
    color: '#00897b',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
  },
  transitionSpinner: {
    marginTop: 10,
  },

  // Guess result overlay
  resultOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 30,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 3,
  },
  resultCorrect: {
    borderColor: '#4caf50',
  },
  resultWrong: {
    borderColor: '#f44336',
  },
  resultEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultDetail: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultBold: {
    fontWeight: 'bold',
    color: '#333',
  },
  resultQuestion: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#03dac6',
    marginTop: 12,
  },
});

export default GameScreen;
