import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import {
  useGameStore,
  listMissionViews,
  formatRewardLabel,
  countClaimableMissions,
  type MissionView,
} from '../store/gameStore';
import { BOBA, FONTS } from '../theme/boba';
import { BobaScene, BobaPill, WoodCounter, DockBtn } from './BobaScene';

export function MissionsScreen() {
  const missionBoard = useGameStore((s) => s.missionBoard);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const claimMissionReward = useGameStore((s) => s.claimMissionReward);
  const goHome = useGameStore((s) => s.goHome);
  const refreshMissions = useGameStore((s) => s.refreshMissions);

  const coins = useGameStore((s) => s.coins);

  const missions = useMemo(
    () => listMissionViews(missionBoard),
    [missionBoard],
  );
  const daily = missions.filter((m) => m.cadence === 'daily');
  const weekly = missions.filter((m) => m.cadence === 'weekly');
  const claimable = countClaimableMissions(missionBoard);

  const collectAll = () => {
    for (const mission of missions) {
      if (mission.claimable) claimMissionReward(mission.id);
    }
  };

  return (
    <BobaScene>
      <View style={styles.root}>
        <View style={styles.top}>
          <View style={styles.topCopy}>
            <Text style={styles.eyebrow}>Missions</Text>
            <Text style={styles.title}>Shift board</Text>
            <Text style={styles.sub}>Complete for coins · cups · spins</Text>
          </View>
          <BobaPill mango>💰 {coins}</BobaPill>
        </View>

        {lastMessage ? <Text style={styles.toast}>{lastMessage}</Text> : null}

        <WoodCounter menu="Shift board · today">
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.section}>Daily</Text>
            {daily.map((mission) => (
              <MissionRow
                key={mission.id}
                mission={mission}
                onClaim={() => claimMissionReward(mission.id)}
              />
            ))}

            <Text style={[styles.section, styles.sectionGap]}>Weekly</Text>
            {weekly.map((mission) => (
              <MissionRow
                key={mission.id}
                mission={mission}
                onClaim={() => claimMissionReward(mission.id)}
              />
            ))}
          </ScrollView>
        </WoodCounter>

        <View style={styles.dock}>
          <DockBtn emoji="🏠" label="Home" onPress={goHome} />
          {claimable > 0 ? (
            <DockBtn
              label="Collect all"
              prize
              onPress={collectAll}
            />
          ) : (
            <DockBtn emoji="🔄" label="Refresh" onPress={refreshMissions} />
          )}
        </View>
      </View>
    </BobaScene>
  );
}

function MissionRow({
  mission,
  onClaim,
}: {
  mission: MissionView;
  onClaim: () => void;
}) {
  const pct = Math.round((mission.progress / mission.target) * 100);
  return (
    <View
      style={[
        styles.card,
        mission.claimable && styles.cardReady,
        mission.claimed && styles.cardClaimed,
      ]}
      accessibilityLabel={`${mission.title}, ${mission.progress} of ${mission.target}, ${formatRewardLabel(mission.reward)}`}
    >
      <View style={styles.cardTop}>
        <Text style={styles.itemName}>{mission.title}</Text>
        <Text style={styles.reward}>{formatRewardLabel(mission.reward)}</Text>
      </View>
      <Text style={styles.itemBlurb}>{mission.blurb}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.cardFoot}>
        <Text style={styles.progressText}>
          {mission.progress}/{mission.target}
        </Text>
        {mission.claimed ? (
          <Text style={styles.claimedText}>Claimed</Text>
        ) : (
          <Pressable
            style={[styles.claimBtn, !mission.claimable && styles.claimDisabled]}
            disabled={!mission.claimable}
            onPress={onClaim}
            accessibilityRole="button"
            accessibilityLabel={
              mission.claimable
                ? `Claim reward for ${mission.title}`
                : `${mission.title} in progress`
            }
            accessibilityState={{ disabled: !mission.claimable }}
          >
            <Text
              style={[
                styles.claimText,
                !mission.claimable && styles.claimTextDisabled,
              ]}
            >
              {mission.claimable ? 'Claim' : 'In progress'}
            </Text>
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
  toast: {
    color: BOBA.mango,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    marginVertical: 4,
    textAlign: 'center',
  },
  list: {
    padding: 8,
    paddingBottom: 16,
    gap: 8,
  },
  section: {
    color: BOBA.menuText,
    fontFamily: FONTS.uiBlack,
    letterSpacing: 1.4,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  sectionGap: {
    marginTop: 8,
  },
  card: {
    backgroundColor: BOBA.cream,
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: '#8a5a28',
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardReady: {},
  cardClaimed: {
    opacity: 0.55,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemName: {
    color: BOBA.ink,
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    flex: 1,
  },
  reward: {
    color: BOBA.straw,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    textAlign: 'right',
    maxWidth: '46%',
  },
  itemBlurb: {
    color: 'rgba(74,34,28,0.65)',
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(74,34,28,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BOBA.straw,
    borderRadius: 999,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    color: 'rgba(74,34,28,0.65)',
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  claimedText: {
    color: 'rgba(74,34,28,0.5)',
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  claimBtn: {
    backgroundColor: BOBA.straw,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  claimDisabled: {
    backgroundColor: 'rgba(74,34,28,0.08)',
  },
  claimText: {
    color: BOBA.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  claimTextDisabled: {
    color: 'rgba(74,34,28,0.45)',
  },
  dock: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});

