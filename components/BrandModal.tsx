import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Logo } from './Logo';
import { colors, radius, spacing, typography } from '../constants/theme';

type BrandModalProps = {
  visible: boolean;
  title: string;
  body: string;
  ctaLabel?: string | null;
  onCta?: () => void;
  onClose: () => void;
};

export function BrandModal({ visible, title, body, ctaLabel, onCta, onClose }: BrandModalProps) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.gray} />
          </Pressable>
          <Logo size={44} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          {ctaLabel && (
            <Button title={ctaLabel} onPress={onCta ?? onClose} style={{ width: '100%', marginTop: spacing.md }} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,19,16,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  closeBtn: { position: 'absolute', top: spacing.md, right: spacing.md, padding: spacing.xs },
  title: { ...typography.h2, color: colors.primaryDark, marginTop: spacing.md, textAlign: 'center' },
  body: { ...typography.body, color: colors.gray, textAlign: 'center', marginTop: spacing.sm, lineHeight: 21 },
});
