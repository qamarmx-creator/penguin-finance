/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

// Import penguin icons
const penguin01 = require('@/assets/penguins/penguin_01.png');
const penguin02 = require('@/assets/penguins/penguin_02.png');
const penguin03 = require('@/assets/penguins/penguin_03.png');
const penguin04 = require('@/assets/penguins/penguin_04.png');
const penguin05 = require('@/assets/penguins/penguin_05.png');
const penguin06 = require('@/assets/penguins/penguin_06.png');
const penguin07 = require('@/assets/penguins/penguin_07.png');
const penguin08 = require('@/assets/penguins/penguin_08.png');
const penguin09 = require('@/assets/penguins/penguin_09.png');
const penguin10 = require('@/assets/penguins/penguin_10.png');
const penguin11 = require('@/assets/penguins/penguin_11.png');
const penguin12 = require('@/assets/penguins/penguin_12.png');

// All penguin icons for random selection
export const PENGUIN_ICONS = [
  penguin01, penguin02, penguin03, penguin04,
  penguin05, penguin06, penguin07, penguin08,
  penguin09, penguin10, penguin11, penguin12,
];

// Main penguin icon (the biggest one)
export const MAIN_PENGUIN = penguin07;

// Celebration messages based on context
const getCelebrationText = (type?: 'income' | 'expense', amount?: number) => {
  if (type === 'income') return '赚钱啦!';
  if (amount && amount > 1000) return '花多了...';
  const texts = ['记好了!', '太棒了!', '真乖!', '厉害!', '完成!'];
  return texts[Math.floor(Math.random() * texts.length)];
};

interface PenguinCelebrationProps {
  visible: boolean;
  amount?: number;
  type?: 'income' | 'expense';
  onComplete?: () => void;
}

export function PenguinCelebration({ visible, amount, type, onComplete }: PenguinCelebrationProps) {
  const [celebrationText, setCelebrationText] = useState('记好了!');
  const [randomPenguin, setRandomPenguin] = useState(MAIN_PENGUIN);
  const [scaleAnim] = useState(() => new Animated.Value(0));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      return;
    }

    setCelebrationText(getCelebrationText(type, amount));
    // Random penguin for celebration
    setRandomPenguin(PENGUIN_ICONS[Math.floor(Math.random() * PENGUIN_ICONS.length)]);

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

    // Auto dismiss after 1.8s
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
    }, 1800);

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
        <Image source={randomPenguin} style={styles.penguinImage} resizeMode="contain" />
        <Text style={styles.text}>{celebrationText}</Text>
      </Animated.View>
    </View>
  );
}

/** Empty state penguin with real image */
export function EmptyPenguin({ text = '还没有记录哦' }: { text?: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Image source={MAIN_PENGUIN} style={styles.emptyPenguinImage} resizeMode="contain" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/** Small penguin icon for headers */
export function PenguinIcon({ size = 32, index }: { size?: number; index?: number }) {
  const source = index !== undefined ? PENGUIN_ICONS[index % PENGUIN_ICONS.length] : MAIN_PENGUIN;
  return (
    <Image 
      source={source} 
      style={{ width: size, height: size }} 
      resizeMode="contain" 
    />
  );
}

/** Category penguin icon - use different penguins for different categories */
export function CategoryPenguinIcon({ categoryId, size = 24 }: { categoryId: string; size?: number }) {
  // Use category ID to deterministically select a penguin
  const hash = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const source = PENGUIN_ICONS[hash % PENGUIN_ICONS.length];
  return (
    <Image 
      source={source} 
      style={{ width: size, height: size }} 
      resizeMode="contain" 
    />
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
    backgroundColor: 'rgba(245, 240, 243, 0.9)',
    zIndex: 1000,
  },
  container: {
    alignItems: 'center',
    gap: 16,
  },
  penguinImage: {
    width: 120,
    height: 120,
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5A4A4F',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyPenguinImage: {
    width: 100,
    height: 100,
  },
  emptyText: {
    fontSize: 15,
    color: '#9A8A8F',
  },
});
