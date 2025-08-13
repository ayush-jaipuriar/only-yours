import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import api from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [couple, setCouple] = useState(null);

  const loadCouple = async () => {
    setLoading(true);
    try {
      const res = await api.get('/couple');
      setCouple(res.data);
    } catch (e) {
      setCouple(null); // 404 expected when not linked
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCouple);
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      {couple ? (
        <Text style={{ fontSize: 18 }}>You are connected with {couple.user1 && couple.user2 ? (couple.user1.name && couple.user2.name ? `${couple.user1.name === couple.user2.name ? couple.user1.name : (couple.user1.name || couple.user2.name)}` : (couple.user1.name || couple.user2.name)) : 'your partner'}</Text>
      ) : (
        <>
          <Text style={{ fontSize: 18, marginBottom: 8 }}>You are not linked yet</Text>
          <Button title="Link with Partner" onPress={() => navigation.navigate('PartnerLink')} />
        </>
      )}
      <View style={{ height: 8 }} />
      <Button title="Choose Category" onPress={() => navigation.navigate('CategorySelection')} />
    </View>
  );
};

export default DashboardScreen;


