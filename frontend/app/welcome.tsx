import { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

type FormType = 'login' | 'register';

export default function WelcomeScreen() {
  const [formType, setFormType] = useState<FormType>('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login, register, loading, error, clearError } = useAuth();
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.95)).current;
  const spinAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Start spinning animation for loading indicator
    Animated.loop(
      Animated.timing(spinAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleSubmit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!formData.username.trim() || !formData.password.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.username.length < 3) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (formData.password.length < 6) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    let success = false;

    if (formType === 'login') {
      success = await login({
        username: formData.username,
        password: formData.password,
      });
    } else {
      success = await register({
        username: formData.username,
        password: formData.password,
        first_name: formData.first_name.trim() || undefined,
        last_name: formData.last_name.trim() || undefined,
      });
    }

    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      first_name: '',
      last_name: '',
    });
    clearError();
  };

  const switchFormType = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newType = formType === 'login' ? 'register' : 'login';
    
    Animated.timing(slideAnimation, {
      toValue: newType === 'register' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setFormType(newType);
    resetForm();
  };

  const inputStyle = (fieldName: string) => [
    styles.input,
    {
      borderColor: focusedField === fieldName ? '#007AFF' : '#E5E5EA',
      backgroundColor: focusedField === fieldName ? '#F2F9FF' : '#F2F2F7',
    }
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Animated.View
          style={{
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }],
            width: '100%',
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="lock-closed" size={32} color="#007AFF" />
            </View>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              {formType === 'login' ? 'Sign in to continue' : 'Create your account'}
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  formType === 'login' && styles.activeTab
                ]}
                onPress={() => formType !== 'login' && switchFormType()}
              >
                <Text style={[
                  styles.tabText,
                  formType === 'login' && styles.activeTabText
                ]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  formType === 'register' && styles.activeTab
                ]}
                onPress={() => formType !== 'register' && switchFormType()}
              >
                <Text style={[
                  styles.tabText,
                  formType === 'register' && styles.activeTabText
                ]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={inputStyle('username')}
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                placeholder="Enter your username"
                placeholderTextColor="#8E8E93"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
              />

              <Text style={styles.label}>Password</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={inputStyle('password')}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Enter your password"
                  placeholderTextColor="#8E8E93"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPassword(!showPassword);
                  }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>

              {formType === 'register' && (
                <Animated.View
                  style={{
                    opacity: slideAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                    transform: [{
                      translateY: slideAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    }],
                  }}
                >
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={inputStyle('first_name')}
                    value={formData.first_name}
                    onChangeText={(value) => handleInputChange('first_name', value)}
                    placeholder="Enter your first name"
                    placeholderTextColor="#8E8E93"
                    autoCapitalize="words"
                    onFocus={() => setFocusedField('first_name')}
                    onBlur={() => setFocusedField(null)}
                  />

                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={inputStyle('last_name')}
                    value={formData.last_name}
                    onChangeText={(value) => handleInputChange('last_name', value)}
                    placeholder="Enter your last name"
                    placeholderTextColor="#8E8E93"
                    autoCapitalize="words"
                    onFocus={() => setFocusedField('last_name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </Animated.View>
              )}

              {error && (
                <Animated.View style={styles.errorContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                    <Text style={styles.errorText}>
                      {error}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.submitButtonText}>
                      Please wait
                    </Text>
                    <Animated.View 
                      style={[
                        styles.loadingIndicator,
                        {
                          transform: [{
                            rotate: spinAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            })
                          }]
                        }
                      ]} 
                    />
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {formType === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {formType === 'login' 
                ? "Don't have an account?" 
                : "Already have an account?"}
            </Text>
            <TouchableOpacity onPress={switchFormType}>
              <Text style={styles.footerLink}>
                {formType === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
  },
  fieldsContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  loadingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 4,
  },
  footerLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
});