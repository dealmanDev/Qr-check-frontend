import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode } from 'lucide-react';
import { login } from '@/lib/store';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      login(form.email, form.password);
      toast.success(t('auth.welcomeBack'));
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-xl border bg-card text-card-foreground shadow-lg p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <QrCode className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">{t('app.name')}</span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{t('auth.welcomeBack')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('auth.signinSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">{t('auth.email')}</Label><Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" /></div>
            <div className="space-y-2"><Label htmlFor="password">{t('auth.password')}</Label><Input id="password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? t('auth.signingIn') : t('auth.signIn')}</Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t('auth.noAccount')} <Link to="/signup" className="text-primary hover:underline">{t('auth.createOne')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
