import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { getAdService } from '../services/AdService';
import { AdMobAdService } from '../services/AdMobAdService';
import { adsDisabled } from '../services/monetizationGate';

/**
 * Renders an AdMob banner when the AdMob provider has shown the banner slot.
 * No-op for mock / fail-closed providers and on web.
 */
export function AdBanner() {
  const disabled = adsDisabled();
  const ads = getAdService();
  const isAdMob = !disabled && ads instanceof AdMobAdService;
  const [visible, setVisible] = useState(
    () => isAdMob && ads.isBannerVisible() && ads.isReady('banner'),
  );
  const [BannerView, setBannerView] = useState<React.ComponentType<{
    unitId: string;
    size: string;
  }> | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [size, setSize] = useState<string>('BANNER');

  useEffect(() => {
    if (!isAdMob) return;
    if (Platform.OS === 'web') return;

    return ads.subscribeBannerVisibility((next) => {
      setVisible(next && ads.isReady('banner'));
    });
  }, [ads, isAdMob]);

  useEffect(() => {
    if (!isAdMob || !visible) return;
    if (Platform.OS === 'web') return;

    try {
      // Lazy load native banner component
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sdk = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
      setBannerView(() => sdk.BannerAd);
      setSize(sdk.BannerAdSize.ANCHORED_ADAPTIVE_BANNER);
      setUnitId(ads.getBannerUnitId());
    } catch (e) {
      console.warn('[AdBanner] Failed to load BannerAd', e);
      setBannerView(null);
      setUnitId(null);
    }
  }, [ads, isAdMob, visible]);

  if (disabled || !visible || !BannerView || !unitId) return null;

  return (
    <View style={styles.wrap}>
      <BannerView unitId={unitId} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
});
