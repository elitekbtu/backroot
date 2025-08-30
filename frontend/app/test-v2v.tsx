import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import V2VComponent from '../components/V2VComponent';

export default function TestV2VPage() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <V2VComponent
        userId="test_user_123"
        serverUrl="ws://localhost:8000"
        onClose={() => console.log('V2V closed')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
