import { Platform, StatusBar } from 'react-native';

/**
 * Android edge-to-edge often ignores RN SafeAreaView top inset.
 * Pad by the status bar height so content sits below it.
 */
export const ANDROID_TOP_INSET =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0;
