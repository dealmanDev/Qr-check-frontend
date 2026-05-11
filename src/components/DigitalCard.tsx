import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { type Participant, type Room } from '@/lib/store';
import { Download, QrCode, ArrowLeft, ImagePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useI18n } from '@/lib/i18n';

interface Props {
  participant: Participant;
  room: Room;
  qrDataUrl: string;
  embedded?: boolean;
  fromSharedLink?: boolean;
}

const colorPalettes = [
  { name: 'Blue', bg: '#2563eb', fg: '#ffffff', accent: '#2563eb' },
  { name: 'Dark', bg: '#09090b', fg: '#ffffff', accent: '#09090b' },
  { name: 'Green', bg: '#16a34a', fg: '#ffffff', accent: '#16a34a' },
  { name: 'Orange', bg: '#ea580c', fg: '#ffffff', accent: '#ea580c' },
  { name: 'White', bg: '#ffffff', fg: '#09090b', accent: '#e5e7eb' },
];

const DigitalCard = ({ participant, room, qrDataUrl, embedded, fromSharedLink }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useI18n();
  const [palette, setPalette] = useState(0);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const p = colorPalettes[palette];
  const isCustom = customBg !== null;

  const handleCustomBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomBg(reader.result as string);
      setPalette(-1);
    };
    reader.readAsDataURL(file);
  };

  const activeBg = isCustom ? undefined : p?.bg;
  const activeFg = isCustom ? '#ffffff' : p?.fg;

  const download = async (format: 'pdf' | 'png' | 'jpg') => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });

    if (format === 'pdf') {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 3, canvas.height / 3] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
      pdf.save(`${participant.name}-card.pdf`);
    } else {
      const link = document.createElement('a');
      link.download = `${participant.name}-card.${format}`;
      link.href = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
      link.click();
    }
  };

  return (
    <div className={embedded ? 'flex flex-col items-center px-4 py-4' : 'min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8'}>
      <div className="max-w-lg w-full">
        {!embedded && (
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground">{t('card.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('card.subtitle')}</p>
          </div>
        )}

        {/* Color palette selector */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {colorPalettes.map((cp, i) => (
            <button
              key={cp.name}
              onClick={() => { setPalette(i); setCustomBg(null); }}
              className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all ${palette === i && !isCustom ? 'ring-primary scale-110' : 'ring-transparent'}`}
              style={{
                backgroundColor: cp.accent,
                border: cp.name === 'White' ? '1px solid hsl(var(--border))' : undefined,
              }}
              title={cp.name}
            />
          ))}
          {/* Custom photo palette */}
          <label
            className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all cursor-pointer flex items-center justify-center ${isCustom ? 'ring-primary scale-110' : 'ring-transparent'}`}
            style={{
              backgroundImage: customBg ? `url(${customBg})` : 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            title={t('card.customBg')}
          >
            {!customBg && <ImagePlus className="h-3.5 w-3.5 text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleCustomBg} />
          </label>
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          className="rounded-xl overflow-hidden shadow-lg relative"
          style={{
            backgroundColor: activeBg,
            minHeight: 220,
          }}
        >
          {/* Custom background image */}
          {isCustom && customBg && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${customBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/50" />
            </div>
          )}

          <div className="relative z-10 p-6">
            {/* Top section: photo + info */}
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                {participant.photo ? (
                  <img
                    src={participant.photo}
                    className="h-20 w-20 rounded-xl object-cover border-2"
                    style={{ borderColor: `${activeFg}33` }}
                    alt=""
                  />
                ) : (
                  <div
                    className="h-20 w-20 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${activeFg}15` }}
                  >
                    <span className="text-3xl font-bold" style={{ color: activeFg }}>
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-bold leading-tight"
                  style={{ color: activeFg, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                  {participant.name}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: activeFg, opacity: 0.8 }}>
                  {participant.institution || room.name}
                </p>
                {participant.role && (
                  <p className="text-xs mt-0.5 capitalize" style={{ color: activeFg, opacity: 0.6 }}>
                    {participant.role}
                  </p>
                )}
                {participant.department && (
                  <p className="text-xs" style={{ color: activeFg, opacity: 0.6 }}>
                    {participant.department}
                  </p>
                )}
                {participant.jobPosition && (
                  <p className="text-xs" style={{ color: activeFg, opacity: 0.6 }}>
                    {participant.jobPosition}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom section: code + QR */}
            <div className="flex items-end justify-between mt-5">
              <div>
                <p className="text-xs" style={{ color: activeFg, opacity: 0.6 }}>{t('card.code')}</p>
                <p className="text-xl font-mono font-bold" style={{ color: activeFg }}>
                  #{participant.uniqueCode}
                </p>
              </div>
              <img
                src={qrDataUrl}
                className="h-24 w-24 rounded-lg bg-white p-1.5"
                alt="QR Code"
                crossOrigin="anonymous"
              />
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center gap-2">
              <QrCode className="h-3 w-3" style={{ color: activeFg, opacity: 0.4 }} />
              <span className="text-[10px]" style={{ color: activeFg, opacity: 0.4 }}>
                {t('app.name')} · {room.name}
              </span>
            </div>
          </div>
        </div>

        {/* Download buttons */}
        <div className="flex gap-2 mt-6 justify-center">
          <Button size="sm" variant="outline" onClick={() => download('pdf')}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => download('png')}>
            <Download className="h-4 w-4 mr-1" /> PNG
          </Button>
          <Button size="sm" variant="outline" onClick={() => download('jpg')}>
            <Download className="h-4 w-4 mr-1" /> JPG
          </Button>
        </div>

        {!embedded && (
          <div className="text-center mt-6">
            <Button variant="ghost" size="sm" onClick={() => fromSharedLink ? navigate('/') : navigate(`/room/${room.id}`)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {fromSharedLink ? t('card.backHome') : t('card.backRegister')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalCard;
