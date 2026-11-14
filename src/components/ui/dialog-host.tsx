import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, Keyframe, SlideInDown } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { closeDialog, useDialog, type DialogButton, type DialogState } from '@/lib/dialog';

// muncul halus: sedikit membesar + fade, tanpa efek mantul
const popIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.95 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.out(Easing.cubic) },
}).duration(200);

const sheetIn = SlideInDown.duration(320).easing(Easing.out(Easing.cubic));

const VARIANT_ICON = {
  info: { icon: 'info', bg: Colors.primarySoft, fg: Colors.primary },
  success: { icon: 'check', bg: Colors.greenSoft, fg: Colors.green },
  confirm: { icon: 'help-circle', bg: Colors.yellowSoft, fg: Colors.yellowDark },
} as const;

// dipasang sekali di root layout
export function DialogHost() {
  const dialog = useDialog();

  return (
    <Modal visible={!!dialog} transparent animationType="none" statusBarTranslucent onRequestClose={closeDialog}>
      {dialog && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDialog} />
          {dialog.kind === 'sheet' ? (
            <Sheet dialog={dialog} />
          ) : (
            <KeyboardAvoidingView behavior="padding" style={styles.center} pointerEvents="box-none">
              {dialog.kind === 'alert' ? <AlertCard dialog={dialog} /> : <PromptCard key={dialog.title} dialog={dialog} />}
            </KeyboardAvoidingView>
          )}
        </Animated.View>
      )}
    </Modal>
  );
}

function press(button?: DialogButton) {
  closeDialog();
  button?.onPress?.();
}

function AlertCard({ dialog }: { dialog: Extract<DialogState, { kind: 'alert' }> }) {
  const meta = dialog.variant === 'soon' ? null : VARIANT_ICON[dialog.variant];
  const cancel = dialog.buttons.find((b) => b.style === 'cancel');
  const actions = dialog.buttons.filter((b) => b.style !== 'cancel');

  return (
    <Animated.View entering={popIn} style={[styles.card, Shadow.clay]}>
      {!meta ? (
        <>
          <View style={styles.bearCircle}>
            <Image source={require('@/assets/images/mascot/wait.png')} style={styles.bear} contentFit="contain" />
          </View>
          <View style={styles.soonPill}>
            <Feather name="clock" size={13} color={Colors.primaryDark} />
            <AppText style={styles.soonText}>Segera Hadir</AppText>
          </View>
        </>
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
          <Feather name={meta.icon} size={28} color={meta.fg} />
        </View>
      )}
      <AppText style={styles.title}>{dialog.title}</AppText>
      {!!dialog.message && (
        <AppText variant="body" color={Colors.textSecondary} style={styles.message}>
          {dialog.message}
        </AppText>
      )}
      <View style={styles.buttons}>
        {actions.map((b) => (
          <Pressable
            key={b.text}
            onPress={() => press(b)}
            style={[styles.button, { backgroundColor: b.style === 'destructive' ? Colors.red : Colors.primary }, Shadow.button]}>
            <AppText style={styles.buttonText}>{b.text}</AppText>
          </Pressable>
        ))}
        {cancel && (
          <Pressable onPress={() => press(cancel)} style={[styles.button, styles.cancel]}>
            <AppText style={[styles.buttonText, { color: Colors.textSecondary }]}>{cancel.text}</AppText>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

function PromptCard({ dialog }: { dialog: Extract<DialogState, { kind: 'prompt' }> }) {
  const [value, setValue] = useState(dialog.value);

  return (
    <Animated.View entering={popIn} style={[styles.card, styles.left, Shadow.clay]}>
      <AppText style={[styles.title, styles.textLeft]}>{dialog.title}</AppText>
      {!!dialog.message && (
        <AppText variant="caption" style={styles.textLeft}>
          {dialog.message}
        </AppText>
      )}
      <TextInput
        autoFocus
        value={value}
        onChangeText={setValue}
        placeholder={dialog.placeholder}
        placeholderTextColor={Colors.placeholder}
        multiline={dialog.multiline}
        keyboardType={dialog.keyboardType}
        secureTextEntry={dialog.secure}
        autoCapitalize={dialog.secure || dialog.keyboardType === 'email-address' ? 'none' : undefined}
        style={[styles.input, dialog.multiline && styles.inputMulti]}
      />
      <View style={styles.row}>
        <Pressable onPress={closeDialog} style={[styles.button, styles.cancel, styles.flex]}>
          <AppText style={[styles.buttonText, { color: Colors.textSecondary }]}>Batal</AppText>
        </Pressable>
        <Pressable
          disabled={!value.trim()}
          onPress={() => {
            closeDialog();
            dialog.onSubmit(value.trim());
          }}
          style={[styles.button, styles.flex, { backgroundColor: value.trim() ? Colors.primary : Colors.disabled }]}>
          <AppText style={styles.buttonText}>{dialog.submitText ?? 'Simpan'}</AppText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function Sheet({ dialog }: { dialog: Extract<DialogState, { kind: 'sheet' }> }) {
  return (
    <Animated.View entering={sheetIn} style={[styles.sheet, Shadow.clay]}>
      <View style={styles.handle} />
      {!!dialog.title && <AppText style={styles.sheetTitle}>{dialog.title}</AppText>}
      {dialog.options.map((o) => (
        <Pressable
          key={o.label}
          onPress={() => {
            closeDialog();
            o.onPress();
          }}
          style={({ pressed }) => [styles.option, pressed && { backgroundColor: Colors.surface }]}>
          <View style={[styles.optionIcon, { backgroundColor: o.destructive ? Colors.redSoft : Colors.primarySoft }]}>
            <Feather name={o.icon} size={18} color={o.destructive ? Colors.red : Colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText style={[styles.optionLabel, o.destructive && { color: Colors.red }]} numberOfLines={1}>
              {o.label}
            </AppText>
            {!!o.sublabel && (
              <AppText variant="caption" numberOfLines={1}>
                {o.sublabel}
              </AppText>
            )}
          </View>
        </Pressable>
      ))}
      <Pressable onPress={closeDialog} style={[styles.button, styles.cancel, styles.sheetCancel]}>
        <AppText style={[styles.buttonText, { color: Colors.textSecondary }]}>Tutup</AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 50, 80, 0.45)',
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 4,
    borderColor: Colors.border,
    padding: 24,
  },
  left: {
    alignItems: 'stretch',
  },
  textLeft: {
    textAlign: 'left',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bearCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bear: {
    width: 110,
    height: 80,
  },
  soonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.blueSoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  soonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  buttons: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 8,
  },
  button: {
    height: 50,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    backgroundColor: Colors.inputBackground,
  },
  buttonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  input: {
    minHeight: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
  },
  inputMulti: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 4,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.disabled,
    marginBottom: 10,
  },
  sheetTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.text,
  },
  sheetCancel: {
    marginTop: 8,
  },
});
