import { useMemo } from 'react';
import { getParticipants, getAttendance } from '@/lib/store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Props {
  roomId: string;
}

const RoomDashboard = ({ roomId }: Props) => {
  const { t } = useI18n();
  const participants = useMemo(() => getParticipants(roomId), [roomId]);
  const attendance = useMemo(() => getAttendance(roomId), [roomId]);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    attendance.forEach(a => {
      const day = a.checkIn.split('T')[0];
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  }, [attendance]);

  const byRole = useMemo(() => {
    const map = new Map<string, number>();
    participants.forEach(p => {
      const key = p.department || p.role || 'Other';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [participants]);

  const exportCSV = () => {
    const headers = 'Participant,Email,Date,Time,Status\n';
    const rows = attendance.map(a => {
      const p = participants.find(pp => pp.id === a.participantId);
      return `"${p?.name || ''}","${p?.email || ''}","${a.checkIn.split('T')[0]}","${new Date(a.checkIn).toLocaleTimeString()}","${a.status}"`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{t('analytics.overview')}</h3>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-3 w-3 mr-1" /> {t('analytics.export')}</Button>
      </div>

      {dailyData.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">{t('analytics.noData')}</div>
      )}

      {byRole.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-foreground">{t('analytics.byDept')}</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRole}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default RoomDashboard;
