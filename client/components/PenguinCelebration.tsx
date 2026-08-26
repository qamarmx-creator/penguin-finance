/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

// Import all 18 penguin images
const penguin01 = require('@/assets/penguins/penguin_01.png'); // success_confetti - celebration
const penguin02 = require('@/assets/penguins/penguin_02.png'); // network_error - tangled cables
const penguin03 = require('@/assets/penguins/penguin_03.png'); // no_result - magnifying glass
const penguin04 = require('@/assets/penguins/penguin_04.png'); // empty_box - empty state
const penguin05 = require('@/assets/penguins/penguin_05.png'); // shy_peek - shy
const penguin06 = require('@/assets/penguins/penguin_06.png'); // sad_cry - crying
const penguin07 = require('@/assets/penguins/penguin_07.png'); // slide_belly - sliding happy
const penguin08 = require('@/assets/penguins/penguin_08.png'); // thumbs_up - winking thumbs up
const penguin09 = require('@/assets/penguins/penguin_09.png'); // hold_heart - holding heart
const penguin10 = require('@/assets/penguins/penguin_10.png'); // jump_joy - jumping with stars
const penguin11 = require('@/assets/penguins/penguin_11.png'); // notification_bell - bell
const penguin12 = require('@/assets/penguins/penguin_12.png'); // tasks_checklist - checklist
const penguin13 = require('@/assets/penguins/penguin_13.png'); // music_headphone - headphones
const penguin14 = require('@/assets/penguins/penguin_14.png'); // diary_book - book
const penguin15 = require('@/assets/penguins/penguin_15.png'); // camera_photo - camera
const penguin16 = require('@/assets/penguins/penguin_16.png'); // calendar - calendar
const penguin17 = require('@/assets/penguins/penguin_17.png'); // favorite_heart - heart with penguin
const penguin18 = require('@/assets/penguins/penguin_18.png'); // search_snow - magnifying glass

export const PENGUIN_ICONS = [
  penguin01, penguin02, penguin03, penguin04,
  penguin05, penguin06, penguin07, penguin08,
  penguin09, penguin10, penguin11, penguin12,
  penguin13, penguin14, penguin15, penguin16,
  penguin17, penguin18,
];

// Main celebration penguin (success with confetti)
export const MAIN_PENGUIN = penguin01;
// Empty state penguin (looking at empty box)
export const EMPTY_PENGUIN = penguin04;
// Search penguin (with magnifying glass)
export const SEARCH_PENGUIN = penguin03;

// Category-to-penguin mapping for deterministic icon assignment
export const CATEGORY_PENGUIN_MAP: Record<string, number> = {
  // Expense categories
  exp_food: 7,        // slide_belly - happy eating
  exp_transport: 8,   // thumbs_up - on the go
  exp_shopping: 9,    // hold_heart - love shopping
  exp_fun: 14,        // diary_book - entertainment
  exp_medical: 6,     // sad_cry - medical bills hurt
  exp_edu: 13,        // music_headphone - studying
  exp_home: 16,       // calendar - monthly rent
  exp_comm: 15,       // camera_photo - communication
  exp_other: 5,       // shy_peek - miscellaneous
  // Income categories
  inc_salary: 10,     // jump_joy - got paid!
  inc_parttime: 11,   // notification_bell - part-time work
  inc_invest: 12,     // tasks_checklist - investment tracking
  inc_other: 17,      // favorite_heart - other income
};

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
    // Random penguin for celebration (use indices 0-17)
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
      <Image source={EMPTY_PENGUIN} style={styles.emptyPenguinImage} resizeMode="contain" />
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

/** Category penguin icon - uses explicit mapping for each category */
export function CategoryPenguinIcon({ categoryId, size = 24 }: { categoryId: string; size?: number }) {
  const penguinIndex = CATEGORY_PENGUIN_MAP[categoryId];
  const source = penguinIndex !== undefined 
    ? PENGUIN_ICONS[penguinIndex] 
    : PENGUIN_ICONS[0]; // fallback to first penguin
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
