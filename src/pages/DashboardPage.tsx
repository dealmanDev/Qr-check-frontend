import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getCurrentManager, getRooms, createRoom, deleteRoom, logout, type Room, type RoomType } from '@/lib/store';
import { QrCode, Plus, Building2, GraduationCap, Calendar, Trash2, LogOut, ArrowRight, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const typeIcons: Record<RoomType, typeof Building2> = { company: Building2, school: GraduationCap, event: Calendar };

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', type: 'company' as RoomType });

  const typeLabels: Record<RoomType, string> = { company: t('dashboard.company'), school: t('dashboard.school'), event: t('dashboard.event') };

  useEffect(() => {
    const manager = getCurrentManager();
    if (!manager) { navigate('/login'); return; }
    setRooms(getRooms());
  }, [navigate]);

  const handleCreate = () => {
    if (!newRoom.name.trim()) { toast.error(t('dashboard.roomRequired')); return; }
    createRoom(newRoom.name, newRoom.type);
    setRooms(getRooms());
    setNewRoom({ name: '', type: 'company' });
    setDialogOpen(false);
    toast.success(t('dashboard.roomCreated'));
  };

  const handleDelete = (id: string) => {
    deleteRoom(id);
    setRooms(getRooms());
    toast.success(t('dashboard.roomDeleted'));
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const manager = getCurrentManager();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <QrCode className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          
          <span className="text-sm text-muted-foreground">{manager?.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('dashboard.rooms')}</h1>
            <p className="text-sm text-muted-foreground">{t('dashboard.manage')}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t('dashboard.createRoom')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('dashboard.createTitle')}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>{t('dashboard.roomName')}</Label><Input value={newRoom.name} onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))} placeholder="e.g. Acme Corp Q1 2026" /></div>
                <div>
                  <Label>{t('dashboard.roomType')}</Label>
                  <Select value={newRoom.type} onValueChange={(v: RoomType) => setNewRoom(r => ({ ...r, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">{t('dashboard.company')}</SelectItem>
                      <SelectItem value="school">{t('dashboard.school')}</SelectItem>
                      <SelectItem value="event">{t('dashboard.event')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreate}>{t('dashboard.createRoom')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {rooms.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t('dashboard.noRooms')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('dashboard.noRoomsDesc')}</p>
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> {t('dashboard.createRoom')}</Button>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            {rooms.map((room, i) => {
              const Icon = typeIcons[room.type];
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex items-center gap-4 p-4 rounded-lg ring-1 ring-border bg-card hover:shadow-[var(--shadow-md)] transition-all cursor-pointer"
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">{room.name}</h3>
                    <p className="text-xs text-muted-foreground">{typeLabels[room.type]} · {t('dashboard.created')} {new Date(room.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={e => { e.stopPropagation(); handleDelete(room.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
