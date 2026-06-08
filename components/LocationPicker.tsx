import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { CITIES } from '../constants/cities';

type Props = {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
};

export function LocationPicker({ value, onChange, placeholder = 'Search city...' }: Props) {
  const [query, setQuery] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = query.length >= 2
    ? CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const handleSelect = (city: string) => {
    setQuery(city);
    onChange(city);
    setShowSuggestions(false);
  };

  const handleChange = (text: string) => {
    setQuery(text);
    onChange(text);
    setShowSuggestions(true);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={item => item}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.item, index < suggestions.length - 1 && styles.itemBorder]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.itemIcon}>📍</Text>
                <Text style={styles.itemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 100 },
  input: {
    backgroundColor: Colors.surface2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemIcon: { fontSize: 14 },
  itemText: { fontSize: 14, color: Colors.text },
});
