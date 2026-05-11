import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HeroGrid } from '@/components/HeroGrid';
import { Button } from '@/components/ui/button';
import { QrCode, Shield, BarChart3, Users, Zap, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const features = [
    { icon: QrCode, title: t('welcome.features.qr.title'), desc: t('welcome.features.qr.desc') },
    { icon: Shield, title: t('welcome.features.secure.title'), desc: t('welcome.features.secure.desc') },
    { icon: BarChart3, title: t('welcome.features.analytics.title'), desc: t('welcome.features.analytics.desc') },
    { icon: Users, title: t('welcome.features.multi.title'), desc: t('welcome.features.multi.desc') },
    { icon: Zap, title: t('welcome.features.instant.title'), desc: t('welcome.features.instant.desc') },
    { icon: Globe, title: t('welcome.features.everywhere.title'), desc: t('welcome.features.everywhere.desc') },
  ];

  const stats = [
    { value: '50+', label: t('welcome.stats.countries') },
    { value: '12K+', label: t('welcome.stats.rooms') },
    { value: '2M+', label: t('welcome.stats.scans') },
    { value: '99.9%', label: t('welcome.stats.uptime') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-screen flex flex-col">
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>{t('nav.login')}</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>{t('nav.getStarted')}</Button>
          </div>
        </nav>

        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="text-sm font-medium text-primary mb-4 tracking-wide uppercase">{t('welcome.badge')}</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1] mb-6">
                {t('welcome.title1')}<br />{t('welcome.title2')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
                {t('welcome.subtitle')}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button size="lg" onClick={() => navigate('/signup')} className="px-8">{t('welcome.cta')}</Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')}>{t('welcome.signin')}</Button>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-0 -z-0 overflow-hidden">
          <HeroGrid />
        </div>
      </section>

      <section className="border-t border-border bg-muted/50">
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <p className="text-3xl font-bold text-foreground text-mono">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('welcome.features.title')}</h2>
          <p className="text-muted-foreground mt-2">{t('welcome.features.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="p-6 rounded-lg ring-1 ring-border bg-card hover:shadow-[var(--shadow-md)] transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-24">
        <div className="max-w-2xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-foreground mb-4">{t('welcome.cta2.title')}</h2>
          <p className="text-muted-foreground mb-8">{t('welcome.cta2.subtitle')}</p>
          <Button size="lg" onClick={() => navigate('/signup')} className="px-8">{t('welcome.cta2.button')}</Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <QrCode className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>{t('app.name')}</span>
          </div>
          <p>{t('welcome.footer', { year: new Date().getFullYear().toString() })}</p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
