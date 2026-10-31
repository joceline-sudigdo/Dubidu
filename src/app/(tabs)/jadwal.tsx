import { ReportCalendar } from '@/components/parent/report-calendar';
import { Screen } from '@/components/parent/screen';
import { TabHeader } from '@/components/parent/screen-header';

export default function JadwalScreen() {
  return (
    <Screen>
      <TabHeader title="Jadwal" />
      <ReportCalendar />
    </Screen>
  );
}
