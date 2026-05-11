import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
  ArrowLeft, Download, Users, UserCheck, Clock, TrendingUp,
  BarChart3, PieChart as PieChartIcon, FileText, QrCode,
} from 'lucide-react';
import { getCurrentManager, getRoom, getParticipants, getAttendance, type Room, type Participant, type AttendanceRecord } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(32, 95%, 44%)',
  'hsl(0, 84%, 60%)', 'hsl(270, 76%, 53%)', 'hsl(190, 80%, 42%)',
  'hsl(45, 93%, 47%)', 'hsl(330, 80%, 50%)',
];

const ReportsPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (!getCurrentManager()) { navigate('/login'); return; }
    if (!roomId) { navigate('/dashboard'); return; }
    const r = getRoom(roomId);
    if (!r) { navigate('/dashboard'); return; }
    setRoom(r);
    setParticipants(getParticipants(roomId));
    setAttendance(getAttendance(roomId));
  }, [roomId, navigate]);

  const today = new Date().toISOString().split('T')[0];
  const uniquePresentToday = new Set(attendance.filter(a => a.checkIn.startsWith(today)).map(a => a.participantId)).size;
  const attendanceRate = participants.length > 0 ? Math.round((uniquePresentToday / participants.length) * 100) : 0;

  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().split('T')[0], 0);
    }
    attendance.forEach(a => {
      const day = a.checkIn.split('T')[0];
      if (map.has(day)) map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date: date.slice(5), count }));
  }, [attendance]);

  const byDepartment = useMemo(() => {
    const map = new Map<string, number>();
    participants.forEach(p => {
      const key = p.department || p.role || p.jobPosition || 'Other';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [participants]);

  const hourlyDistribution = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, '0')}h`, count: 0 }));
    attendance.forEach(a => {
      const h = new Date(a.checkIn).getHours();
      hours[h].count++;
    });
    return hours.filter(h => h.count > 0 || (parseInt(h.hour) >= 6 && parseInt(h.hour) <= 22));
  }, [attendance]);

  const weeklyComparison = useMemo(() => {
    const weeks = new Map<string, number>();
    attendance.forEach(a => {
      const d = new Date(a.checkIn);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      weeks.set(key, (weeks.get(key) || 0) + 1);
    });
    return Array.from(weeks.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([week, count]) => ({ week: week.slice(5), count }));
  }, [attendance]);

  const exportCSV = () => {
    const headers = 'Participant,Email,Code,Date,Entry,Exit,Status\n';
    const rows = attendance.map(a => {
      const p = participants.find(pp => pp.id === a.participantId);
      return `"${p?.name || ''}","${p?.email || ''}","${p?.uniqueCode || ''}","${a.checkIn.split('T')[0]}","${new Date(a.checkIn).toLocaleTimeString()}","${a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : ''}","${a.status}"`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${room?.name || 'room'}-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!room) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-3 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/room/${roomId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <QrCode className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm">{room.name} — {t('reports.title')}</span>
        </div>
        <LanguageSwitcher />
        <ThemeToggle />
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('reports.title')}</h1>
            <p className="text-sm text-muted-foreground">{room.name}</p>
          </div>
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> {t('reports.exportAll')}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: t('reports.totalParticipants'), value: participants.length, color: 'text-primary' },
            { icon: UserCheck, label: t('reports.presentToday'), value: uniquePresentToday, color: 'text-success' },
            { icon: TrendingUp, label: t('reports.attendanceRate'), value: `${attendanceRate}%`, color: 'text-warning' },
            { icon: Clock, label: t('reports.totalRecords'), value: attendance.length, color: 'text-primary' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className="text-2xl font-bold text-foreground text-mono">{kpi.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" /> {t('reports.tab.overview')}
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5" /> {t('reports.tab.trends')}
            </TabsTrigger>
            <TabsTrigger value="distribution" className="gap-1.5 text-xs">
              <PieChartIcon className="h-3.5 w-3.5" /> {t('reports.tab.distribution')}
            </TabsTrigger>
            <TabsTrigger value="detailed" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> {t('reports.tab.detailed')}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">{t('reports.dailyAttendance')}</CardTitle></CardHeader>
                <CardContent>
                  {dailyTrend.some(d => d.count > 0) ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                          <defs>
                            <linearGradient id="gradOverview" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#gradOverview)" strokeWidth={2} name={t('reports.records')} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{t('analytics.noData')}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">{t('reports.byDepartment')}</CardTitle></CardHeader>
                <CardContent>
                  {byDepartment.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={byDepartment} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" nameKey="name" paddingAngle={2}>
                            {byDepartment.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{t('analytics.noData')}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">{t('reports.weeklyComparison')}</CardTitle></CardHeader>
                <CardContent>
                  {weeklyComparison.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyComparison}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t('reports.records')} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{t('analytics.noData')}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">{t('reports.hourlyDistribution')}</CardTitle></CardHeader>
                <CardContent>
                  {hourlyDistribution.some(h => h.count > 0) ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hourlyDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                          <Line type="monotone" dataKey="count" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ fill: 'hsl(142, 76%, 36%)' }} name={t('reports.records')} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{t('analytics.noData')}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Distribution */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">{t('reports.statusDistribution')}</CardTitle></CardHeader>
                <CardContent>
                  {attendance.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(() => {
                              const map = new Map<string, number>();
                              attendance.forEach(a => map.set(a.status, (map.get(a.status) || 0) + 1));
                              return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
                            })()}
                            cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}
                          >
                            {['present', 'absent', 'checked'].map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{t('analytics.noData')}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">{t('reports.byDepartment')}</CardTitle></CardHeader>
                <CardContent>
                  {byDepartment.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byDepartment}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t('reports.totalParticipants')} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{t('analytics.noData')}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Detailed */}
          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{t('reports.detailedRecords')}</CardTitle>
                  <Button size="sm" variant="outline" onClick={exportCSV}>
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {attendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t('reports.col.participant')}</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t('reports.col.code')}</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t('reports.col.date')}</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t('reports.col.entry')}</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t('reports.col.exit')}</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t('reports.col.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...attendance].sort((a, b) => b.checkIn.localeCompare(a.checkIn)).slice(0, 50).map((a) => {
                          const p = participants.find(pp => pp.id === a.participantId);
                          return (
                            <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                              <td className="py-2 px-3 text-foreground">{p?.name || '—'}</td>
                              <td className="py-2 px-3 text-mono text-muted-foreground">#{p?.uniqueCode || ''}</td>
                              <td className="py-2 px-3 text-foreground">{a.checkIn.split('T')[0]}</td>
                              <td className="py-2 px-3 text-foreground">{new Date(a.checkIn).toLocaleTimeString()}</td>
                              <td className="py-2 px-3 text-foreground">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</td>
                              <td className="py-2 px-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  a.status === 'present' ? 'bg-success/10 text-success' :
                                  a.status === 'checked' ? 'bg-primary/10 text-primary' :
                                  'bg-destructive/10 text-destructive'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {attendance.length > 50 && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        {t('reports.showing50', { total: attendance.length.toString() })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-16 text-center text-sm text-muted-foreground">{t('analytics.noData')}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportsPage;
