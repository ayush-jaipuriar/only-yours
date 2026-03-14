import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../services/api';
import useTheme from '../theme/useTheme';
import { HAPTIC_EVENTS, useHaptics } from '../haptics';

// eslint-disable-next-line react/prop-types
const CustomQuestionEditorScreen = ({ route, navigation }) => {
  const existingQuestion = route?.params?.question || null;
  const { theme } = useTheme();
  const { triggerHaptic } = useHaptics();
  const [draft, setDraft] = useState({
    questionText: existingQuestion?.questionText || '',
    optionA: existingQuestion?.optionA || '',
    optionB: existingQuestion?.optionB || '',
    optionC: existingQuestion?.optionC || '',
    optionD: existingQuestion?.optionD || '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          padding: 18,
          paddingBottom: 30,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        title: {
          color: theme.colors.textPrimary,
          fontSize: 22,
          fontWeight: '700',
          marginBottom: 8,
        },
        subtitle: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 18,
        },
        label: {
          color: theme.colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 6,
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          backgroundColor: theme.colors.surfaceMuted,
          color: theme.colors.textPrimary,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 14,
          marginBottom: 12,
        },
        textArea: {
          minHeight: 110,
          textAlignVertical: 'top',
        },
        errorText: {
          color: theme.colors.danger,
          fontSize: 12,
          marginBottom: 10,
        },
        primaryButton: {
          backgroundColor: theme.colors.primary,
          borderRadius: 18,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 4,
        },
        primaryButtonText: {
          color: theme.colors.primaryContrast,
          fontSize: 16,
          fontWeight: '700',
        },
        secondaryButton: {
          marginTop: 10,
          borderRadius: 18,
          paddingVertical: 14,
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        secondaryButtonText: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [theme]
  );

  const updateField = (field, value) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  const validateDraft = () => {
    const nextError = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD']
      .find((field) => !draft[field]?.trim());
    if (nextError) {
      setErrorMessage('Please fill in the question and all four answer options.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleSave = async () => {
    if (!validateDraft() || saving) {
      triggerHaptic(HAPTIC_EVENTS.INVALID_ACTION);
      return;
    }

    setSaving(true);
    try {
      if (existingQuestion?.id) {
        await api.put(`/custom-questions/${existingQuestion.id}`, draft);
      } else {
        await api.post('/custom-questions', draft);
      }
      triggerHaptic(HAPTIC_EVENTS.SETTINGS_SAVED);
      navigation.goBack();
    } catch (error) {
      const message = error.response?.data?.message || 'We could not save this custom question right now.';
      setErrorMessage(message);
      triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
      Alert.alert(existingQuestion ? 'Update Failed' : 'Create Failed', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {existingQuestion ? 'Edit Custom Question' : 'Create Custom Question'}
          </Text>
          <Text style={styles.subtitle}>
            Only you can see this question outside gameplay, but it becomes part of the shared custom couple deck once saved.
          </Text>

          <Text style={styles.label}>Question</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={draft.questionText}
            onChangeText={(value) => updateField('questionText', value)}
            placeholder="Write the question prompt"
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            accessibilityLabel="Custom question text"
          />

          <Text style={styles.label}>Option A</Text>
          <TextInput
            style={styles.input}
            value={draft.optionA}
            onChangeText={(value) => updateField('optionA', value)}
            placeholder="First answer option"
            placeholderTextColor={theme.colors.textTertiary}
            accessibilityLabel="Option A"
          />

          <Text style={styles.label}>Option B</Text>
          <TextInput
            style={styles.input}
            value={draft.optionB}
            onChangeText={(value) => updateField('optionB', value)}
            placeholder="Second answer option"
            placeholderTextColor={theme.colors.textTertiary}
            accessibilityLabel="Option B"
          />

          <Text style={styles.label}>Option C</Text>
          <TextInput
            style={styles.input}
            value={draft.optionC}
            onChangeText={(value) => updateField('optionC', value)}
            placeholder="Third answer option"
            placeholderTextColor={theme.colors.textTertiary}
            accessibilityLabel="Option C"
          />

          <Text style={styles.label}>Option D</Text>
          <TextInput
            style={styles.input}
            value={draft.optionD}
            onChangeText={(value) => updateField('optionD', value)}
            placeholder="Fourth answer option"
            placeholderTextColor={theme.colors.textTertiary}
            accessibilityLabel="Option D"
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={existingQuestion ? 'Save custom question changes' : 'Create custom question'}
            accessibilityState={{ disabled: saving }}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? 'Saving...' : existingQuestion ? 'Save Changes' : 'Create Question'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Cancel and go back"
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CustomQuestionEditorScreen;
