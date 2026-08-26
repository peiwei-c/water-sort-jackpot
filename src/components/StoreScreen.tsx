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
import { BOBA, FONTS } from '../theme/boba';
import { BobaScene, BobaPill, WoodCounter, DockBtn } from './BobaScene';

export function StoreScreen() {
  const coins = useGameStore((s) => s.coins);
  const ownedItemIds = useGameStore((s) => s.ownedItemIds);
  const equippedPathId = useGameStore((s) => s.equippedPathId);
  const equippedVialId = useGameStore((s) => s.equippedVialId);
  const equippedPaletteId = useGameStore((s) => s.equippedPaletteId);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const buyItem = useGameStore((s) => s.buyItem);
  const equipItem = useGameStore((s) => s.equipItem);
  const goHome = useGameStore((s) => s.goHome);
  const [tab, setTab] = useState<StoreKind>('palette');

  const items = useMemo(() => itemsOfKind(tab), [tab]);
  const owned = useMemo(() => new Set(ownedItemIds), [ownedItemIds]);

  const isEquipped = (item: StoreItem) => {
    if (item.kind === 'path') return equippedPathId === item.id;
    if (item.kind === 'palette') return equippedPaletteId === item.id;
    return equippedVialId === item.id;
  };

  return (
    <BobaScene>
      <View style={styles.root}>
        <View style={styles.top}>
          <View style={styles.topCopy}>
            <Text style={styles.eyebrow}>Store</Text>
            <Text style={styles.title}>Back shelf</Text>
            <Text style={styles.sub}>
              Cosmetics · harder shops never help
            </Text>
          </View>
          <BobaPill mango>💰 {coins}</BobaPill>
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          <TabBtn
            label="Colors"
            active={tab === 'palette'}
            onPress={() => setTab('palette')}
          />
          <TabBtn
            label="Shops"
            active={tab === 'path'}
            onPress={() => setTab('path')}
          />
          <TabBtn
            label="Cups"
            active={tab === 'vial'}
            onPress={() => setTab('vial')}
          />
        </View>

        {lastMessage ? <Text style={styles.toast}>{lastMessage}</Text> : null}

        <WoodCounter menu="Back shelf · tap Buy then open Pour">
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
        </WoodCounter>

        <View style={styles.dock}>
          <DockBtn emoji="🏠" label="Home" onPress={goHome} />
        </View>
      </View>
    </BobaScene>
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
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} store tab`}
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
      <View style={[styles.swatch, { backgroundColor: swatch ?? BOBA.straw }]} />
      <View style={styles.cardBody}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemBlurb}>{item.blurb}</Text>
        {previewColors ? <PalettePreview colors={previewColors} /> : null}
      </View>
      <View style={styles.cardActions}>
        <Text style={styles.itemPrice}>
          {item.price === 0 ? 'Free' : `💰 ${item.price}`}
        </Text>
        {equipped ? (
          <View style={styles.equippedPill}>
            <Text style={styles.equippedText}>Equipped</Text>
          </View>
        ) : owned ? (
          <Pressable
            style={styles.equipBtn}
            onPress={onEquip}
            accessibilityRole="button"
            accessibilityLabel={`Equip ${item.name}`}
          >
            <Text style={styles.equipText}>Equip</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.buyBtn, !canAfford && styles.buyDisabled]}
            onPress={onBuy}
            accessibilityRole="button"
            accessibilityLabel={
              canAfford
                ? `Buy ${item.name} for ${item.price} coins`
                : `Cannot afford ${item.name}, costs ${item.price} coins`
            }
            accessibilityState={{ disabled: !canAfford }}
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  topCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: BOBA.sign,
    fontFamily: FONTS.ui,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: BOBA.cream,
    fontFamily: FONTS.displaySoft,
    fontSize: 22,
    marginTop: 2,
  },
  sub: {
    color: 'rgba(255,248,240,0.7)',
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,248,240,0.18)',
  },
  tabActive: {
    backgroundColor: BOBA.mango,
  },
  tabText: {
    color: BOBA.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  tabTextActive: {
    color: BOBA.ink,
  },
  toast: {
    color: BOBA.mango,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    marginVertical: 4,
    textAlign: 'center',
  },
  list: {
    gap: 8,
    padding: 8,
    paddingBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BOBA.cream,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#8a5a28',
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  cardBody: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  itemName: {
    color: BOBA.ink,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
  itemBlurb: {
    color: 'rgba(74,34,28,0.65)',
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
  },
  itemPrice: {
    color: BOBA.ink,
    fontFamily: FONTS.uiBlack,
    fontSize: 13,
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
  },
  cardActions: {
    minWidth: 86,
    alignItems: 'flex-end',
    gap: 6,
  },
  buyBtn: {
    backgroundColor: BOBA.straw,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  buyDisabled: {
    opacity: 0.45,
  },
  buyText: {
    color: BOBA.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  equipBtn: {
    backgroundColor: BOBA.mango,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  equipText: {
    color: BOBA.ink,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  equippedPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  equippedText: {
    color: BOBA.ink,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    opacity: 0.55,
  },
  dock: {
    flexDirection: 'row',
    marginTop: 8,
  },
});

