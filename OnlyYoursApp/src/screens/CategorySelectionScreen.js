import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

const CategoryCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={{ padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 12 }}
    onPress={() => onPress(item)}
  >
    <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
    {item.description ? <Text style={{ color: '#666', marginTop: 4 }}>{item.description}</Text> : null}
    {item.sensitive ? <Text style={{ color: '#c00', marginTop: 6 }}>Sensitive</Text> : null}
  </TouchableOpacity>
);

const CategorySelectionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/content/categories');
      setCategories(res.data);
    } catch (e) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSelect = (category) => {
    if (category.sensitive) {
      Alert.alert(
        'Sensitive Category',
        'This category contains sensitive topics. Do you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <CategoryCard item={item} onPress={handleSelect} />}
      />
    </View>
  );
};

export default CategorySelectionScreen;


