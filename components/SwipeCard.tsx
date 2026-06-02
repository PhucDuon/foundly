import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { CardData } from '../data/cards';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 100;

type Props = {
  card: CardData;
  isTop: boolean;
  stackIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPress?: () => void;
  disabled?: boolean;
};

export type SwipeCardHandle = {
  swipe: (dir: 'left' | 'right') => void;
};

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { card, isTop, stackIndex, onSwipeLeft, onSwipeRight, onPress, disabled },
  ref
) {
  const position = useRef(new Animated.ValueXY()).current;

  const isTopRef = useRef(isTop);
  isTopRef.current = isTop;
  const onSwipeLeftRef = useRef(onSwipeLeft);
  onSwipeLeftRef.current = onSwipeLeft;
  const onSwipeRightRef = useRef(onSwipeRight);
  onSwipeRightRef.current = onSwipeRight;
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useImperativeHandle(ref, () => ({
    swipe(dir) {
      const toX = dir === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      Animated.timing(position, {
        toValue: { x: toX, y: 0 },
        duration: 300,
        useNativeDriver: true,
      }).start(dir === 'right' ? onSwipeRightRef.current : onSwipeLeftRef.current);
    },
  }));

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-25deg', '0deg', '25deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [40, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-120, -40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTopRef.current && !disabledRef.current,
      onMoveShouldSetPanResponder: () => isTopRef.current && !disabledRef.current,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.35 });
      },
      onPanResponderRelease: (_, gesture) => {
        const isTap = Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5;
        if (isTap) {
          onPressRef.current?.();
        } else if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH * 1.5, y: gesture.dy },
            duration: 300,
            useNativeDriver: true,
          }).start(onSwipeRightRef.current);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH * 1.5, y: gesture.dy },
            duration: 300,
            useNativeDriver: true,
          }).start(onSwipeLeftRef.current);
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const scale = stackIndex === 0 ? 1 : stackIndex === 1 ? 0.94 : 0.88;
  const translateYStack = stackIndex === 0 ? 0 : stackIndex === 1 ? 16 : 32;

  const cardAnimStyle = isTop
    ? { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }
    : { transform: [{ scale }, { translateY: translateYStack }] };

  return (
    <Animated.View
      style={[styles.card, cardAnimStyle, { zIndex: 3 - stackIndex }]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      {/* Full-bleed background */}
      {card.avatarUrl
        ? <Image source={{ uri: card.avatarUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        : <View style={[StyleSheet.absoluteFillObject, styles.emojiBg]}>
            <Text style={styles.emoji}>{card.emoji}</Text>
          </View>
      }

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* CONNECT / SKIP stamps */}
      {isTop && (
        <>
          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
            <Text style={[styles.stampText, { color: Colors.green }]}>CONNECT</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
            <Text style={[styles.stampText, { color: Colors.accent2 }]}>SKIP</Text>
          </Animated.View>
        </>
      )}

      {/* Info overlay at bottom */}
      <View style={styles.cardInfo}>
        {card.compatibilityScore !== undefined && (
          <View style={[
            styles.scoreBadge,
            card.compatibilityScore >= 70 ? styles.scoreHigh :
            card.compatibilityScore >= 40 ? styles.scoreMid : styles.scoreLow,
          ]}>
            <Text style={styles.scoreText}>⚡ {card.compatibilityScore}% match</Text>
          </View>
        )}
        <View style={styles.nameRow}>
          <Text style={styles.cardName}>{card.name}</Text>
          {card.age ? <Text style={styles.cardAge}>, {card.age}</Text> : null}
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText} numberOfLines={1}>{card.role}</Text>
        </View>
        {!!card.bio && (
          <Text style={styles.cardBio} numberOfLines={2}>{card.bio}</Text>
        )}
        <Text style={styles.tapHint}>Tap for full profile →</Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: '100%',
    height: 520,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  emojiBg: {
    flex: 1,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 120 },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
    gap: 6,
  },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  cardName: { fontWeight: '800', fontSize: 28, color: '#fff' },
  cardAge: { fontSize: 22, color: 'rgba(255,255,255,0.75)', fontWeight: '300' },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBio: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  tapHint: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  scoreBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  scoreHigh: { backgroundColor: 'rgba(0,212,170,0.2)', borderColor: 'rgba(0,212,170,0.6)' },
  scoreMid:  { backgroundColor: 'rgba(108,99,255,0.2)', borderColor: 'rgba(108,99,255,0.6)' },
  scoreLow:  { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' },
  scoreText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stamp: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 4,
  },
  stampLike: { right: 20, borderColor: Colors.green, transform: [{ rotate: '12deg' }] },
  stampNope: { left: 20, borderColor: Colors.accent2, transform: [{ rotate: '-12deg' }] },
  stampText: { fontWeight: '800', fontSize: 30, letterSpacing: 2 },
});
