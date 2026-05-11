import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getRoom, getParticipants, getAttendance, getCurrentManager, updateParticipant, deleteParticipant, type Room, type Participant, type AttendanceRecord } from '@/lib/store';
import { QrCode, UserPlus, ScanLine, BarChart3, ArrowLeft, Link as LinkIcon, Users, Clock, UserCheck, Copy, Pencil, Trash2, Search, Filter, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import QrScannerDialog from '@/components/QrScannerDialog';
import RoomDashboard from '@/components/RoomDashboard';
import ParticipantCardPreview from '@/components/ParticipantCardPreview';
import { useI18n } from '@/lib/i18n';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastConfirmed, setLastConfirmed] = useState<{ participant: Participant; mode?: string } | null>(null);
  
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);
  const [previewParticipant, setPreviewParticipant] = useState<Participant | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');

  const refresh = useCallback(() => {
    if (!roomId) return;
    setParticipants(getParticipants(roomId));
    setAttendance(getAttendance(roomId));
  }, [roomId]);

  useEffect(() => {
    if (!getCurrentManager()) { navigate('/login'); return; }
    if (!roomId) return;
    const r = getRoom(roomId);
    if (!r) { navigate('/dashboard'); return; }
    setRoom(r);
    refresh();
  }, [roomId, navigate, refresh]);

  const openEdit = (p: Participant) => {
    setEditingParticipant(p);
    setEditForm({
      name: p.name,
      email: p.email,
      phone: p.phone || '',
      institution: p.institution || '',
      department: p.department || '',
      jobPosition: p.jobPosition || '',
      course: p.course || '',
      studentId: p.studentId || '',
      period: p.period || '',
      professorCode: p.professorCode || '',
      courses: p.courses?.join(', ') || '',
      subjects: p.subjects?.join(', ') || '',
      eventName: p.eventName || '',
    });
  };

  const handleEditSave = () => {
    if (!editingParticipant) return;
    updateParticipant(editingParticipant.id, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      institution: editForm.institution,
      department: editForm.department,
      jobPosition: editForm.jobPosition,
      course: editForm.course,
      studentId: editForm.studentId,
      period: editForm.period,
      professorCode: editForm.professorCode,
      courses: editForm.courses ? editForm.courses.split(',').map(s => s.trim()) : undefined,
      subjects: editForm.subjects ? editForm.subjects.split(',').map(s => s.trim()) : undefined,
      eventName: editForm.eventName,
    });
    setEditingParticipant(null);
    refresh();
    toast.success(t('room.participantUpdated'));
  };

  const handleDelete = () => {
    if (!deletingParticipant) return;
    deleteParticipant(deletingParticipant.id);
    setDeletingParticipant(null);
    refresh();
    toast.success(t('room.participantDeleted'));
  };
  const today = new Date().toISOString().split('T')[0];
  const presentToday = attendance.filter(a => a.checkIn.startsWith(today)).length;

  const filteredParticipants = useMemo(() => {
    let list = participants;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.uniqueCode.includes(q) ||
        (p.institution && p.institution.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(p => {
        const isPresent = attendance.some(a => a.participantId === p.id && a.checkIn.startsWith(today));
        return statusFilter === 'present' ? isPresent : !isPresent;
      });
    }
    return list;
  }, [participants, searchQuery, statusFilter, attendance, today]);

  if (!room) return null;

  const registrationLink = `${window.location.origin}/register/${room.id}`;
  const copyLink = () => { navigator.clipboard.writeText(registrationLink); toast.success(t('room.linkCopied')); };

  const editFields = (): { key: string; label: string }[] => {
    const base = [
      { key: 'name', label: t('register.fullName') },
      { key: 'email', label: t('register.email') },
      { key: 'phone', label: t('register.phone') },
    ];
    if (room.type === 'company') {
      return [...base,
        { key: 'institution', label: t('register.institution') },
        { key: 'jobPosition', label: t('register.jobPosition') },
        { key: 'department', label: t('register.department') },
      ];
    }
    if (room.type === 'school') {
      const role = editingParticipant?.role;
      if (role === 'professor') {
        return [...base,
          { key: 'institution', label: t('register.institution') },
          { key: 'courses', label: t('register.courses') },
          { key: 'subjects', label: t('register.subjects') },
          { key: 'professorCode', label: t('register.professorCode') },
        ];
      }
      return [...base,
        { key: 'institution', label: t('register.institution') },
        { key: 'course', label: t('register.course') },
        { key: 'studentId', label: t('register.studentId') },
        { key: 'period', label: t('register.period') },
      ];
    }
    return [...base, { key: 'eventName', label: t('register.eventName') }];
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-3 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex items-center gap-2 flex-1">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <QrCode className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm">{room.name}</span>
        </div>
        <LanguageSwitcher />
        <ThemeToggle />
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Users, label: t('room.participants'), value: participants.length },
            { icon: UserCheck, label: t('room.presentToday'), value: presentToday },
            { icon: Clock, label: t('room.absentToday'), value: participants.length - presentToday },
            { icon: BarChart3, label: t('room.totalRecords'), value: attendance.length },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-lg ring-1 ring-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground text-mono">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Button size="sm" onClick={() => navigate(`/register/${room.id}`)}><UserPlus className="h-4 w-4 mr-1" /> {t('room.register')}</Button>
          <Button size="sm" variant="outline" onClick={() => setScannerOpen(true)}><ScanLine className="h-4 w-4 mr-1" /> {t('room.scanQr')}</Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/room/${room.id}/reports`)}><BarChart3 className="h-4 w-4 mr-1" /> {t('reports.title')}</Button>
          <Button size="sm" variant="outline" onClick={copyLink}><Copy className="h-4 w-4 mr-1" /> {t('room.copyLink')}</Button>
        </div>

        {/* Confirmation banner after scan */}
        <AnimatePresence>
          {lastConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-lg bg-success/10 ring-1 ring-success/30 flex items-center gap-3"
            >
              <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{lastConfirmed.participant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {lastConfirmed.mode === 'exit' ? t('scanner.exitRegistered') : t('scanner.entryRegistered')} · {new Date().toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-3 rounded-lg bg-muted ring-1 ring-border mb-8 flex items-center gap-3">
          <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <code className="text-xs text-muted-foreground truncate flex-1 text-mono">{registrationLink}</code>
          <Button size="sm" variant="ghost" onClick={copyLink}>{t('room.copyLink')}</Button>
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-4">{t('room.participants')} ({participants.length})</h2>

        {/* Search & Filters */}
        {participants.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('room.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-muted-foreground mr-1" />
              {(['all', 'present', 'absent'] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={statusFilter === f ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(f)}
                  className="text-xs"
                >
                  {t(`room.filter.${f}`)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {participants.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('room.noParticipants')}</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('room.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredParticipants.map((p, i) => {
              const todayRecord = attendance.find(a => a.participantId === p.id && a.checkIn.startsWith(today));
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-lg ring-1 ring-border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setPreviewParticipant(p)}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden ring-1 ring-border shrink-0">
                    {p.photo ? <img src={p.photo} className="h-full w-full object-cover" alt="" /> : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-medium text-muted-foreground">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">{p.name}</h4>
                    <p className="text-xs text-muted-foreground">{p.email} · {p.role || room.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-mono text-xs text-muted-foreground">#{p.uniqueCode}</span>
                    <div className={`h-2 w-2 rounded-full ${todayRecord ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingParticipant(p); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingParticipant} onOpenChange={(open) => !open && setEditingParticipant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('room.editParticipant')}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {editFields().map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input value={editForm[f.key] || ''} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingParticipant(null)}>{t('room.cancel')}</Button>
            <Button onClick={handleEditSave}>{t('room.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingParticipant} onOpenChange={(open) => !open && setDeletingParticipant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('room.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('room.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('room.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('room.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {scannerOpen && (
        <QrScannerDialog
          open={scannerOpen}
          onClose={(confirmedParticipant, mode) => {
            setScannerOpen(false);
            refresh();
            if (confirmedParticipant) {
              setLastConfirmed({ participant: confirmedParticipant, mode });
              setTimeout(() => setLastConfirmed(null), 4000);
            }
          }}
          roomId={room.id}
          roomType={room.type}
        />
      )}
      

      {room && (
        <ParticipantCardPreview
          participant={previewParticipant}
          room={room}
          open={!!previewParticipant}
          onClose={() => setPreviewParticipant(null)}
        />
      )}
    </div>
  );
};

export default RoomPage;
