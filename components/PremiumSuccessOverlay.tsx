import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { Button } from './Button';
import { colors, radius, spacing, typography } from '../constants/theme';

const successSound = require('../assets/sounds/success.wav');

export function PremiumSuccessOverlay({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const player = useAudioPlayer(successSound);
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!visible) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // audio playback isn't critical to the purchase flow
    }

    scale.setValue(0.4);
    opacity.setValue(0);
    ring.setValue(0.6);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();
    Animated.timing(ring, {
      toValue: 1.6,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity }]}>
          <View style={styles.badgeWrap}>
            <Animated.View
              style={[
                styles.ring,
                { transform: [{ scale: ring }], opacity: ring.interpolate({ inputRange: [0.6, 1.6], outputRange: [0.5, 0] }) },
              ]}
            />
            <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
              <Ionicons name="checkmark" size={52} color={colors.white} />
            </Animated.View>
          </View>

          <Text style={styles.title}>Təbriklər! 🎉</Text>
          <Text style={styles.subtitle}>Premium abunəliyiniz aktivləşdi</Text>
          <Text style={styles.thanks}>Bizə dəstək olduğunuz üçün təşəkkür edirik</Text>

          <Button title="Davam et" onPress={onDone} style={{ marginTop: spacing.xl, width: '100%' }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,20,15,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  badgeWrap: { alignItems: 'center', justifyContent: 'center', width: 110, height: 110, marginBottom: spacing.lg },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  badge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  title: { ...typography.h1, fontSize: 24, color: colors.black, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.gray, marginTop: 4, textAlign: 'center' },
  thanks: {
    ...typography.h3,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 22,
  },
});
