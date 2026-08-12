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
import { COLORS, LAB } from '../theme/colors';

export function MissionsScreen() {
  const missionBoard = useGameStore((s) => s.missionBoard);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const claimMissionReward = useGameStore((s) => s.claimMissionReward);
  const goHome = useGameStore((s) => s.goHome);
  const refreshMissions = useGameStore((s) => s.refreshMissions);

  const missions = useMemo(
    () => listMissionViews(missionBoard),
    [missionBoard],
  );
  const daily = missions.filter((m) => m.cadence === 'daily');
  const weekly = missions.filter((m) => m.cadence === 'weekly');
  const claimable = countClaimableMissions(missionBoard);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>HYDROLOGY LAB</Text>
        <Text style={styles.title}>Lab Missions</Text>
        <Text style={styles.sub}>
          Daily tasks reset at midnight. Weekly tasks reset each Monday. Claim
          coins, lives, vials, undos, and free spins.
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {claimable > 0 ? `${claimable} ready` : 'In progress'}
            </Text>
          </View>
          <Pressable
            style={styles.refreshBtn}
            onPress={refreshMissions}
            accessibilityLabel="Refresh missions"
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
      </View>

      {lastMessage ? <Text style={styles.toast}>{lastMessage}</Text> : null}

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>DAILY</Text>
        {daily.map((mission) => (
          <MissionRow
            key={mission.id}
            mission={mission}
            onClaim={() => claimMissionReward(mission.id)}
          />
        ))}

        <Text style={[styles.section, styles.sectionGap]}>WEEKLY</Text>
        {weekly.map((mission) => (
          <MissionRow
            key={mission.id}
            mission={mission}
            onClaim={() => claimMissionReward(mission.id)}
          />
        ))}
      </ScrollView>

      <Pressable
        style={styles.backBtn}
        onPress={goHome}
        accessibilityRole="button"
        accessibilityLabel="Back to path"
      >
        <Text style={styles.backText}>Back to Path</Text>
      </Pressable>
    </View>
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
    paddingHorizontal: 18,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  chip: {
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshText: {
    color: LAB.glassBright,
    fontWeight: '700',
    fontSize: 13,
  },
  toast: {
    color: LAB.reagent,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 20,
    gap: 10,
  },
  section: {
    color: LAB.label,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 12,
    marginBottom: 2,
  },
  sectionGap: {
    marginTop: 12,
  },
  card: {
    backgroundColor: LAB.benchMid,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.22)',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardReady: {
    borderColor: LAB.reagent,
  },
  cardClaimed: {
    opacity: 0.65,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemName: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
    flex: 1,
  },
  reward: {
    color: LAB.reagent,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'right',
    maxWidth: '46%',
  },
  itemBlurb: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: LAB.glassBright,
    borderRadius: 999,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    color: LAB.label,
    fontWeight: '700',
    fontSize: 13,
  },
  claimedText: {
    color: LAB.label,
    fontWeight: '700',
    fontSize: 13,
  },
  claimBtn: {
    backgroundColor: LAB.reagent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  claimDisabled: {
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.18)',
  },
  claimText: {
    color: '#1A1200',
    fontWeight: '800',
    fontSize: 13,
  },
  claimTextDisabled: {
    color: LAB.label,
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
