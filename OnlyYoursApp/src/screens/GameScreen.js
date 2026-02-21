import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useGame } from '../state/GameContext';

/**
 * GameScreen displays questions and handles answer submission during gameplay.
 * 
 * Features:
 * - Progress indicator (question X of Y)
 * - Question text display
 * - Four multiple-choice options (A, B, C, D)
 * - Submit button (enabled when option selected)
 * - Waiting indicator after submission
 * - Auto-advance to next question
 * 
 * Lifecycle:
 * 1. User arrives after accepting invitation
 * 2. First question loads from WebSocket
 * 3. User selects option and submits
 * 4. Shows "waiting for partner" state
 * 5. When both answer, next question appears
 * 6. Repeat until Round 1 complete
 */
const GameScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const { 
    currentQuestion, 
    myAnswer, 
    waitingForPartner, 
    submitAnswer, 
    gameStatus,
    endGame 
  } = useGame();
  
  const [selectedOption, setSelectedOption] = useState(null);

  /**
   * Handle game completion - navigate back to dashboard.
   */
  useEffect(() => {
    if (gameStatus === 'complete') {
      Alert.alert(
        'Round 1 Complete!',
        'Get ready for Round 2...',
        [
          { 
            text: 'OK', 
            onPress: () => {
              endGame();
              navigation.navigate('Dashboard');
            }
          }
        ]
      );
    }
  }, [gameStatus, navigation, endGame]);

  /**
   * Handle option selection.
   * Disabled if already submitted answer.
   */
  const handleOptionSelect = (option) => {
    if (waitingForPartner || myAnswer) {
      return; // Already submitted, can't change
    }
    setSelectedOption(option);
  };

  /**
   * Handle answer submission.
   * Validates selection and submits to backend.
   */
  const handleSubmit = () => {
    if (!selectedOption) {
      Alert.alert('Select an Answer', 'Please select an option before submitting.');
      return;
    }

    submitAnswer(selectedOption);
    // selectedOption remains set for visual feedback
  };

  /**
   * Render a single answer option card.
   */
  const renderOption = (letter, text) => {
    const isSelected = selectedOption === letter;
    const isMyAnswer = myAnswer === letter;
    const isDisabled = waitingForPartner || myAnswer;

    return (
      <TouchableOpacity
        key={letter}
        style={[
          styles.optionCard,
          isSelected && styles.selectedOption,
          isMyAnswer && styles.submittedOption,
          isDisabled && styles.disabledOption,
        ]}
        onPress={() => handleOptionSelect(letter)}
        disabled={isDisabled}
        activeOpacity={0.7}>
        <View style={styles.optionLetter}>
          <Text style={styles.optionLetterText}>{letter}</Text>
        </View>
        <Text style={styles.optionText}>{text}</Text>
      </TouchableOpacity>
    );
  };

  // Loading state while waiting for first question
  if (!currentQuestion) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={styles.loadingText}>Loading question...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Progress Indicator */}
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(currentQuestion.questionNumber / currentQuestion.totalQuestions) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Question Text */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
      </View>

      {/* Answer Options */}
      <View style={styles.optionsContainer}>
        {renderOption('A', currentQuestion.optionA)}
        {renderOption('B', currentQuestion.optionB)}
        {renderOption('C', currentQuestion.optionC)}
        {renderOption('D', currentQuestion.optionD)}
      </View>

      {/* Submit Button / Waiting Indicator */}
      <View style={styles.footer}>
        {waitingForPartner ? (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color="#6200ea" />
            <Text style={styles.waitingText}>Waiting for partner...</Text>
          </View>
        ) : myAnswer ? (
          <Text style={styles.waitingText}>Answer submitted!</Text>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              !selectedOption && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedOption}
            activeOpacity={0.8}>
            <Text style={styles.submitButtonText}>Submit Answer</Text>
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
  
  // Header - Progress
  header: {
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200ea',
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
    backgroundColor: '#6200ea',
    borderRadius: 4,
  },
  
  // Question Display
  questionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
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
    marginBottom: 12,
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
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
  
  // Footer - Submit / Waiting
  footer: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  submitButton: {
    backgroundColor: '#6200ea',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6200ea',
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
});

export default GameScreen;
