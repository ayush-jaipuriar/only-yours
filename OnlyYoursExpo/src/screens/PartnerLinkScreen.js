import React, { useState } from 'react';
import { View, Text, Button, TextInput, Alert, Share } from 'react-native';
import api from '../services/api';

const PartnerLinkScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);

  const generateCode = async () => {
    setLoadingGen(true);
    try {
      const res = await api.post('/couple/generate-code');
      setGeneratedCode(res.data.code);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate code');
    } finally {
      setLoadingGen(false);
    }
  };

  const shareCode = async () => {
    if (!generatedCode) return;
    try {
      await Share.share({ message: `Only Yours partner link code: ${generatedCode}` });
    } catch {}
  };

  const link = async () => {
    if (!code.trim()) return;
    setLoadingLink(true);
    try {
      await api.post('/couple/link', { code: code.trim() });
      Alert.alert('Success', 'Linked successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Invalid or already used code');
    } finally {
      setLoadingLink(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 12 }}>Link with Partner</Text>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Get a Code</Text>
        <Button title={loadingGen ? 'Generating...' : 'Generate Code'} onPress={generateCode} disabled={loadingGen} />
        {generatedCode ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 16 }}>Your code: {generatedCode}</Text>
            <View style={{ height: 8 }} />
            <Button title="Share" onPress={shareCode} />
          </View>
        ) : null}
      </View>

      <View>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Enter a Code</Text>
        <TextInput
          placeholder="Enter code"
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 8 }}
        />
        <Button title={loadingLink ? 'Connecting...' : 'Connect'} onPress={link} disabled={loadingLink} />
      </View>
    </View>
  );
};

export default PartnerLinkScreen;


