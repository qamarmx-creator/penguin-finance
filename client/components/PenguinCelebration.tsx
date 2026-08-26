/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

// Penguin image assets
const penguinIcons = require('@/assets/penguin_icons.png');
const penguinPreview = require('@/assets/penguin_preview.jpg');

interface PenguinCelebrationProps {
  visible: boolean;
  amount?: number;
  type?: 'income' | 'expense';
  onComplete?: () => void;
}

/** Celebration messages based on context */
const getcelebrationText = (type?: 'income' | 'expense', amount?: number) => {
  if (type === 'income') return '赚钱啦!';
  if (amount && amount > 1000) return '花多了...';
  const texts = ['记好了!', '太棒了!', '真乖!', '厉害!', '完成!'];
  return texts[Math.floor(Math.random() * texts.length)];
};

export function PenguinCelebration({ visible, amount, type, onComplete }: PenguinCelebrationProps) {
  const [celebrationText, setCelebrationText] = useState('记好了!');
  const [scaleAnim] = useState(() => new Animated.Value(0));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      return;
    }

    setCelebrationText(getcelebrationText(type, amount));

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
        <Image source={penguinPreview} style={styles.penguinImage} resizeMode="contain" />
        <Text style={styles.text}>{celebrationText}</Text>
      </Animated.View>
    </View>
  );
}

/** Empty state penguin with real image */
export function EmptyPenguin({ text = '还没有记录哦' }: { text?: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Image source={penguinIcons} style={styles.emptyPenguinImage} resizeMode="contain" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/** Small penguin icon for headers */
export function PenguinIcon({ size = 32 }: { size?: number }) {
  return (
    <Image 
      source={penguinPreview} 
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
