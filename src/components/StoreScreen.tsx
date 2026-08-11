import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import {
  itemsOfKind,
  type StoreKind,
  type StoreItem,
} from '../engines/StoreCatalog';
import {
  REMOVE_ADS_PRICE_LABEL,
  getRemoveAdsPriceLabel,
} from '../services/IapService';
import { COLORS, LAB } from '../theme/colors';

export function StoreScreen() {
  const coins = useGameStore((s) => s.coins);
  const ownedItemIds = useGameStore((s) => s.ownedItemIds);
  const equippedPathId = useGameStore((s) => s.equippedPathId);
  const equippedVialId = useGameStore((s) => s.equippedVialId);
  const equippedPaletteId = useGameStore((s) => s.equippedPaletteId);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const isNoAdsPurchased = useGameStore((s) => s.isNoAdsPurchased);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const buyItem = useGameStore((s) => s.buyItem);
  const equipItem = useGameStore((s) => s.equipItem);
  const purchaseRemoveAds = useGameStore((s) => s.purchaseRemoveAds);
  const restorePurchases = useGameStore((s) => s.restorePurchases);
  const goHome = useGameStore((s) => s.goHome);
  const [tab, setTab] = useState<StoreKind>('palette');
  const [priceLabel, setPriceLabel] = useState(REMOVE_ADS_PRICE_LABEL);

  const items = useMemo(() => itemsOfKind(tab), [tab]);
  const owned = useMemo(() => new Set(ownedItemIds), [ownedItemIds]);

  useEffect(() => {
    let cancelled = false;
    void getRemoveAdsPriceLabel().then((label) => {
      if (!cancelled) setPriceLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isEquipped = (item: StoreItem) => {
    if (item.kind === 'path') return equippedPathId === item.id;
    if (item.kind === 'palette') return equippedPaletteId === item.id;
    return equippedVialId === item.id;
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>HYDROLOGY LAB</Text>
        <Text style={styles.title}>Supply Store</Text>
        <Text style={styles.sub}>
          Buy color themes with coins for new liquid looks. Vials are cosmetic.
          Paths are exclusive challenges with fewer moves — never an advantage.
        </Text>
        <View style={styles.balance}>
          <Text style={styles.balanceText}>🪙 {coins}</Text>
        </View>
      </View>

      <View style={styles.removeAdsCard}>
        <Text style={styles.removeAdsTitle}>Remove Ads</Text>
        <Text style={styles.removeAdsSub}>
          Hide banner & forced interstitials. Rewarded ads for hints/tubes stay
          available. {priceLabel}
        </Text>
        <Pressable
          style={[
            styles.removeAdsBtn,
            (isNoAdsPurchased || isAdLoading) && styles.removeAdsBtnDisabled,
          ]}
          disabled={isNoAdsPurchased || isAdLoading}
          onPress={() => void purchaseRemoveAds()}
        >
          <Text style={styles.removeAdsBtnText}>
            {isNoAdsPurchased
              ? 'Owned'
              : isAdLoading
                ? 'Processing…'
                : `Buy · ${priceLabel}`}
          </Text>
        </Pressable>
        {!isNoAdsPurchased ? (
          <Pressable
            style={styles.restoreBtn}
            disabled={isAdLoading}
            onPress={() => void restorePurchases()}
          >
            <Text style={styles.restoreBtnText}>Restore Purchases</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabs}>
        <TabBtn
          label="Colors"
          active={tab === 'palette'}
          onPress={() => setTab('palette')}
        />
        <TabBtn
          label="Paths"
          active={tab === 'path'}
          onPress={() => setTab('path')}
        />
        <TabBtn
          label="Vials"
          active={tab === 'vial'}
          onPress={() => setTab('vial')}
        />
      </View>

      {lastMessage ? <Text style={styles.toast}>{lastMessage}</Text> : null}

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <StoreRow
            key={item.id}
            item={item}
            owned={owned.has(item.id)}
            equipped={isEquipped(item)}
            canAfford={coins >= item.price}
            onBuy={() => buyItem(item.id)}
            onEquip={() => equipItem(item.id)}
          />
        ))}
      </ScrollView>

      <Pressable style={styles.backBtn} onPress={goHome}>
        <Text style={styles.backText}>Back to Path</Text>
      </Pressable>
    </View>
  );
}

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function PalettePreview({ colors }: { colors: string[] }) {
  return (
    <View style={styles.palettePreview}>
      {colors.map((c, i) => (
        <View
          key={`${c}-${i}`}
          style={[styles.paletteDot, { backgroundColor: c }]}
        />
      ))}
    </View>
  );
}

function StoreRow({
  item,
  owned,
  equipped,
  canAfford,
  onBuy,
  onEquip,
}: {
  item: StoreItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const swatch =
    item.kind === 'path'
      ? item.pathTheme?.glassBright
      : item.kind === 'palette'
        ? item.waterPalette?.[1]
        : item.vialTheme?.selectGlow;

  const previewColors =
    item.kind === 'palette' && item.waterPalette
      ? [1, 2, 3, 4, 5, 6].map((id) => item.waterPalette![id])
      : null;

  return (
    <View style={styles.card}>
      <View style={[styles.swatch, { backgroundColor: swatch ?? LAB.glassBright }]} />
      <View style={styles.cardBody}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemBlurb}>{item.blurb}</Text>
        {previewColors ? <PalettePreview colors={previewColors} /> : null}
        <Text style={styles.itemPrice}>
          {item.price === 0 ? 'Free' : `🪙 ${item.price}`}
          {item.kind === 'path' && item.moveScale != null && item.moveScale < 1
            ? ` · −${Math.round((1 - item.moveScale) * 100)}% moves`
            : ''}
        </Text>
      </View>
      <View style={styles.cardActions}>
        {equipped ? (
          <View style={styles.equippedPill}>
            <Text style={styles.equippedText}>Equipped</Text>
          </View>
        ) : owned ? (
          <Pressable style={styles.equipBtn} onPress={onEquip}>
            <Text style={styles.equipText}>Equip</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.buyBtn, !canAfford && styles.buyDisabled]}
            onPress={onBuy}
          >
            <Text style={styles.buyText}>Buy</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LAB.benchDeep,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 10,
  },
  eyebrow: {
    color: LAB.label,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  sub: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  balance: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  balanceText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },
  removeAdsCard: {
    backgroundColor: LAB.benchMid,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  removeAdsTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
  },
  removeAdsSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  removeAdsBtn: {
    backgroundColor: LAB.reagent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  removeAdsBtnDisabled: {
    opacity: 0.5,
  },
  removeAdsBtnText: {
    color: '#1A1200',
    fontWeight: '800',
    fontSize: 14,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  restoreBtnText: {
    color: LAB.glassBright,
    fontWeight: '700',
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.18)',
  },
  tabActive: {
    backgroundColor: LAB.reagent,
    borderColor: 'rgba(255, 230, 150, 0.4)',
  },
  tabText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#1A1200',
    fontWeight: '800',
  },
  toast: {
    color: LAB.reagent,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: LAB.benchMid,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.22)',
    borderRadius: 16,
    padding: 12,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 15,
  },
  itemBlurb: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  itemPrice: {
    color: LAB.label,
    fontWeight: '700',
    fontSize: 12,
  },
  palettePreview: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  paletteDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cardActions: {
    minWidth: 84,
    alignItems: 'flex-end',
  },
  buyBtn: {
    backgroundColor: LAB.reagent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buyDisabled: {
    opacity: 0.45,
  },
  buyText: {
    color: '#1A1200',
    fontWeight: '800',
    fontSize: 13,
  },
  equipBtn: {
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  equipText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 13,
  },
  equippedPill: {
    backgroundColor: 'rgba(126, 227, 214, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  equippedText: {
    color: LAB.glassBright,
    fontWeight: '800',
    fontSize: 12,
  },
  backBtn: {
    marginTop: 8,
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 15,
  },
});
