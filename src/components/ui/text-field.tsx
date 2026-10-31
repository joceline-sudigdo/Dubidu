import Feather from '@expo/vector-icons/Feather';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius } from '@/constants/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  icon?: ComponentProps<typeof Feather>['name'];
  password?: boolean;
  error?: string;
};

export function TextField({ label, icon, password, error, ...inputProps }: Props) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}>
        {icon && <Feather name={icon} size={22} color={Colors.textSecondary} />}
        <TextInput
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={password && hidden}
          autoCapitalize={password ? 'none' : inputProps.autoCapitalize}
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={styles.input}
        />
        {password && (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}
            onPress={() => setHidden((h) => !h)}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={22} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>
      {!!error && (
        <AppText variant="caption" color={Colors.red} style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    marginLeft: 4,
  },
  field: {
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1.5,
    borderColor: Colors.inputBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  fieldFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  fieldError: {
    borderColor: Colors.red,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
  },
  error: {
    marginLeft: 8,
  },
});
