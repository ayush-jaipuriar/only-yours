import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../state/AuthContext';

const ProfileScreen = () => {
  const { logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/me');
        setProfile(res.data);
      } catch (e) {
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>{profile?.name}</Text>
      <Text style={{ fontSize: 16, color: '#555' }}>{profile?.email}</Text>
      <View style={{ height: 12 }} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
};

export default ProfileScreen;


