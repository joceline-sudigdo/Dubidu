import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';

// Mulai langganan Dubidu Plus: buat tagihan di server lalu lanjut ke layar transfer (/pembayaran/[id])
export default function CheckoutScreen() {
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  const validPlan = plan === 'bulanan' || plan === 'tahunan';
  const [failure, setFailure] = useState('');
  const error = validPlan ? failure : 'Paket tidak dikenal.';

  useEffect(() => {
    if (!validPlan) return;
    api<{ payment: { id: string } }>('/subscription', { body: { plan: plan === 'tahunan' ? 'YEARLY' : 'MONTHLY' } })
      .then(({ payment }) => router.replace({ pathname: '/pembayaran/[id]', params: { id: payment.id } }))
      .catch((e) => setFailure(errorMessage(e)));
  }, [plan, validPlan]);

  return (
    <Screen header={<ScreenHeader title="Pembayaran" />} edges={['top', 'bottom']}>
      {error ? (
        <>
          <ClayCard>
            <AppText variant="body">{error}</AppText>
          </ClayCard>
          <PrimaryButton title="Kembali" onPress={() => router.back()} />
        </>
      ) : (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 48,
  },
});
