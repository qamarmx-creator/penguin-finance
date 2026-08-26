/* eslint-disable forbidEmoji/no-emoji, react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/** Cute penguin emojis for saving success */
const PENGUIN_EMOJIS = [
  { emoji: '🐧', name: '记好了!' },
  { emoji: '🎉', name: '撒花!' },
  { emoji: '💃', name: '太棒了!' },
  { emoji: '🥰', name: '真乖!' },
  { emoji: '👏', name: '厉害!' },
  { emoji: '✨', name: '闪闪!' },
  { emoji: '', name: '星星!' },
  { emoji: '💖', name: '爱你!' },
];

/** Expense penguin for large amounts */
const EXPENSE_PENGUIN = { emoji: '😅', name: '花多了...' };

/** Income penguin */
const INCOME_PENGUIN = { emoji: '🎊', name: '赚钱啦!' };

interface PenguinCelebrationProps {
  visible: boolean;
  amount?: number;
  type?: 'income' | 'expense';
  onComplete?: () => void;
}

export function PenguinCelebration({ visible, amount, type, onComplete }: PenguinCelebrationProps) {
  const [selectedPenguin, setSelectedPenguin] = useState(PENGUIN_EMOJIS[0]);
  const [scaleAnim] = useState(() => new Animated.Value(0));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      return;
    }

    // Choose penguin based on context
    let penguin;
    if (type === 'income') {
      penguin = INCOME_PENGUIN;
    } else if (amount && amount > 1000) {
      penguin = EXPENSE_PENGUIN;
    } else {
      penguin = PENGUIN_EMOJIS[Math.floor(Math.random() * PENGUIN_EMOJIS.length)];
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPenguin(penguin);

    // Animate in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 50,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 1.5s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onComplete?.());
    }, 1500);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.container, animatedStyle]}>
        <Text style={styles.emoji}>{selectedPenguin.emoji}</Text>
        <Text style={styles.text}>{selectedPenguin.name}</Text>
      </Animated.View>
    </View>
  );
}

/** Empty state penguin */
export function EmptyPenguin({ text = '还没有记录哦' }: { text?: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🐧</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 240, 243, 0.85)',
    zIndex: 1000,
  },
  container: {
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 72,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5A4A4F',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyText: {
    fontSize: 15,
    color: '#9A8A8F',
  },
});
