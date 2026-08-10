import React, { useMemo, useState } from 'react';
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
} from '../services/IapService';
import { COLORS, LAB } from '../theme/colors';

export function StoreScreen() {
  const coins = useGameStore((s) => s.coins);
  const ownedItemIds = useGameStore((s) => s.ownedItemIds);
  const equippedPathId = useGameStore((s) => s.equippedPathId);
  const equippedVialId = useGameStore((s) => s.equippedVialId);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const isNoAdsPurchased = useGameStore((s) => s.isNoAdsPurchased);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const buyItem = useGameStore((s) => s.buyItem);
  const equipItem = useGameStore((s) => s.equipItem);
  const purchaseRemoveAds = useGameStore((s) => s.purchaseRemoveAds);
  const goHome = useGameStore((s) => s.goHome);
  const [tab, setTab] = useState<StoreKind>('path');

  const items = useMemo(() => itemsOfKind(tab), [tab]);
  const owned = useMemo(() => new Set(ownedItemIds), [ownedItemIds]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>HYDROLOGY LAB</Text>
        <Text style={styles.title}>Supply Store</Text>
        <Text style={styles.sub}>
          Vials are cosmetic only. Paths are exclusive challenges with fewer
          moves — never an advantage. The free Standard Lab path always works.
        </Text>
        <View style={styles.balance}>
          <Text style={styles.balanceText}>🪙 {coins}</Text>
        </View>
      </View>

      <View style={styles.removeAdsCard}>
        <Text style={styles.removeAdsTitle}>Remove Ads</Text>
        <Text style={styles.removeAdsSub}>
          Hide banner & forced interstitials. Rewarded ads for hints/tubes stay
          available. {REMOVE_ADS_PRICE_LABEL}
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
                : `Buy · ${REMOVE_ADS_PRICE_LABEL}`}
          </Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <TabBtn label="Paths" active={tab === 'path'} onPress={() => setTab('path')} />
        <TabBtn label="Vials" active={tab === 'vial'} onPress={() => setTab('vial')} />
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
            equipped={
              item.kind === 'path'
                ? equippedPathId === item.id
                : equippedVialId === item.id
            }
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
      : item.vialTheme?.selectGlow;

  return (
    <View style={styles.card}>
      <View style={[styles.swatch, { backgroundColor: swatch ?? LAB.glassBright }]} />
      <View style={styles.cardBody}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemBlurb}>{item.blurb}</Text>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  eyebrow: {
    color: LAB.label,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 6,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 13,
    maxWidth: 280,
  },
  balance: {
    marginTop: 12,
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  balanceText: {
    color: LAB.reagent,
    fontWeight: '800',
    fontSize: 16,
  },
  removeAdsCard: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(240, 180, 41, 0.35)',
  },
  removeAdsTitle: {
    color: LAB.reagent,
    fontWeight: '800',
    fontSize: 16,
  },
  removeAdsSub: {
    marginTop: 4,
    marginBottom: 10,
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
    fontSize: 15,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.2)',
  },
  tabActive: {
    backgroundColor: LAB.reagent,
    borderColor: 'rgba(255, 230, 150, 0.4)',
  },
  tabText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#1A1200',
  },
  toast: {
    textAlign: 'center',
    color: LAB.reagent,
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 13,
  },
  list: {
    paddingBottom: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: LAB.benchMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    padding: 12,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cardBody: {
    flex: 1,
  },
  itemName: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 15,
  },
  itemBlurb: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    color: LAB.label,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 4,
  },
  cardActions: {
    minWidth: 84,
    alignItems: 'flex-end',
  },
  buyBtn: {
    backgroundColor: LAB.glassBright,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buyDisabled: {
    opacity: 0.45,
  },
  buyText: {
    color: '#062018',
    fontWeight: '800',
  },
  equipBtn: {
    backgroundColor: LAB.reagent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  equipText: {
    color: '#1A1200',
    fontWeight: '800',
  },
  equippedPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.4)',
    backgroundColor: LAB.glassDim,
  },
  equippedText: {
    color: LAB.glassBright,
    fontWeight: '700',
    fontSize: 12,
  },
  backBtn: {
    marginBottom: 20,
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backText: {
    color: COLORS.text,
    fontWeight: '800',
  },
});
