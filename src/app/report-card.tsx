import { ReportCalendar } from '@/components/parent/report-calendar';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';

export default function ReportCardScreen() {
  return (
    <Screen header={<ScreenHeader title="Report Card" />} edges={['top', 'bottom']}>
      <ReportCalendar />
    </Screen>
  );
}
