import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BOBA } from '../theme/boba';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render crashes so a blank white screen is never the only failure mode.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root}>
        <Text style={styles.title}>Shop glitch</Text>
        <Text style={styles.body}>
          Something went wrong. Your progress should still be saved — try again.
        </Text>
        <Pressable style={styles.btn} onPress={this.retry}>
          <Text style={styles.btnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BOBA.skyTop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  title: {
    color: BOBA.cream,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  body: {
    color: BOBA.sign,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },
  btn: {
    backgroundColor: BOBA.straw,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnText: {
    color: BOBA.cream,
    fontWeight: '800',
  },
});
