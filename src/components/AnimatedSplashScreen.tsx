import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image } from 'react-native';
import { colors } from '@/src/theme/colors';

// Matches the icon Android's own splash screen draws (measured on device), so
// the hand-over from the system splash to this one shows a single, still icon
// instead of two overlapping ones.
const ICON_SIZE = 156;
// Same colour as the system splash (app.json → splash.backgroundColor), not the theme background.
const SPLASH_BACKGROUND = '#FAFAF5';

interface AnimatedSplashScreenProps {
  isReady: boolean;
  onFinish: () => void;
}

/**
 * Full-screen overlay drawn on top of the app while it starts. It is a sibling
 * of the navigator, not a wrapper, so removing it never remounts the app.
 */
export function AnimatedSplashScreen({ isReady, onFinish }: AnimatedSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Entrance animation — the icon stays still (it continues the system splash), only the text comes in.
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isReady) {
      // Exit animation
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(onFinish);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  return (
    <Animated.View
      style={[styles.splash, { opacity: fadeAnim }]}
      pointerEvents={isReady ? 'none' : 'auto'}
    >
      {/* Icon sits at the exact centre of the screen, where the system splash puts it. */}
      <View style={styles.centered}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.textBlock,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Animated.Text style={styles.appName}>Hisab Pagar</Animated.Text>
        <Animated.Text style={styles.tagline}>Staff Attendance & Salary Tracker</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BACKGROUND,
  },
  centered: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  textBlock: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: ICON_SIZE / 2 + 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
});
