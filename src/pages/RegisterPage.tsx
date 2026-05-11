import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRoom, addParticipant, type Room } from '@/lib/store';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import DigitalCard from '@/components/DigitalCard';
import { useI18n } from '@/lib/i18n';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const RegisterPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [room, setRoom] = useState<Room | null>(null);
  const [step, setStep] = useState<'form' | 'card'>('form');
  const [schoolRole, setSchoolRole] = useState<'student' | 'professor'>('student');
  const [eventRole, setEventRole] = useState('none');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [photo, setPhoto] = useState('');

  const [form, setForm] = useState<Record<string, string>>({
    name: '', email: '', phone: '', institution: '', department: '', jobPosition: '',
    course: '', studentId: '', period: '', professorCode: '', courses: '', subjects: '',
    eventName: '', institutionName: '',
  });

  useEffect(() => {
    if (!roomId) return;
    const r = getRoom(roomId);
    if (!r) { toast.error(t('register.roomNotFound')); return; }
    setRoom(r);
  }, [roomId, t]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const [participant, setParticipantResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !room) return;
    if (!form.name || !form.email) { toast.error(t('register.nameEmailRequired')); return; }

    try {
      const p = addParticipant({
        roomId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        photo,
        institution: form.institution,
        role: room.type === 'school' ? schoolRole : room.type === 'event' ? eventRole : undefined,
        department: form.department,
        jobPosition: form.jobPosition,
        course: form.course,
        studentId: form.studentId,
        period: form.period,
        professorCode: form.professorCode,
        courses: form.courses ? form.courses.split(',').map(s => s.trim()) : undefined,
        subjects: form.subjects ? form.subjects.split(',').map(s => s.trim()) : undefined,
        eventName: form.eventName,
      });

      const url = await QRCode.toDataURL(p.qrSecret, { margin: 2, color: { dark: '#09090b', light: '#ffffff' }, width: 256 });
      setQrDataUrl(url);
      setParticipantResult(p);
      setStep('card');
      toast.success(t('register.success'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">{t('register.roomNotFound')}</p>
    </div>
  );

  // Detect if user came from a shared link (no internal navigation history)
  const isSharedLink = window.history.length <= 2;

  if (step === 'card' && participant) {
    return <DigitalCard participant={participant} room={room} qrDataUrl={qrDataUrl} fromSharedLink={isSharedLink} />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
            <QrCode className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{room.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('register.title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('register.photo')} {room.type === 'event' && t('register.optional')}</Label>
            <Input type="file" accept="image/*" onChange={handlePhoto} />
            {photo && <img src={photo} className="mt-2 h-20 w-20 rounded-lg object-cover ring-1 ring-border" alt="" />}
          </div>

          <div><Label>{t('register.fullName')}</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('auth.fullName')} /></div>
          <div><Label>{t('register.email')}</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" /></div>
          <div><Label>{t('register.phone')}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+351 912 345 678" /></div>

          {room.type === 'company' && (
            <>
              <div><Label>{t('register.institution')}</Label><Input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} /></div>
              <div><Label>{t('register.jobPosition')}</Label><Input value={form.jobPosition} onChange={e => setForm(f => ({ ...f, jobPosition: e.target.value }))} /></div>
              <div><Label>{t('register.department')}</Label><Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
            </>
          )}

          {room.type === 'school' && (
            <>
              <div>
                <Label>{t('register.iAm')}</Label>
                <Select value={schoolRole} onValueChange={(v: 'student' | 'professor') => setSchoolRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">{t('register.student')}</SelectItem>
                    <SelectItem value="professor">{t('register.professor')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t('register.institution')}</Label><Input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} /></div>

              {schoolRole === 'student' ? (
                <>
                  <div><Label>{t('register.course')}</Label><Input value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} /></div>
                  <div><Label>{t('register.studentId')}</Label><Input value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} /></div>
                  <div><Label>{t('register.period')}</Label><Input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} /></div>
                </>
              ) : (
                <>
                  <div><Label>{t('register.courses')}</Label><Input value={form.courses} onChange={e => setForm(f => ({ ...f, courses: e.target.value }))} /></div>
                  <div><Label>{t('register.subjects')}</Label><Input value={form.subjects} onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))} /></div>
                  <div><Label>{t('register.professorCode')}</Label><Input value={form.professorCode} onChange={e => setForm(f => ({ ...f, professorCode: e.target.value }))} /></div>
                </>
              )}
            </>
          )}

          {room.type === 'event' && (
            <>
              <div><Label>{t('register.eventName')}</Label><Input value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} /></div>
              <div>
                <Label>{t('register.role')}</Label>
                <Select value={eventRole} onValueChange={setEventRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrepreneur">{t('register.entrepreneur')}</SelectItem>
                    <SelectItem value="worker">{t('register.worker')}</SelectItem>
                    <SelectItem value="student">{t('register.student')}</SelectItem>
                    <SelectItem value="none">{t('register.none')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {eventRole !== 'none' && (
                <div><Label>{t('register.institutionName')}</Label><Input value={form.institutionName} onChange={e => setForm(f => ({ ...f, institutionName: e.target.value }))} /></div>
              )}
            </>
          )}

          <Button type="submit" className="w-full">{t('register.submit')}</Button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
