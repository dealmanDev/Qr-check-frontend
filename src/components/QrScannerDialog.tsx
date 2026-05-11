import { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getParticipantByQr, getParticipants, checkIn, checkOut, getAttendance, type Participant, type Room } from '@/lib/store';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ScanLine, LogIn, LogOut, Hash, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

type ScanMode = 'entry' | 'exit';

type ScanPhase = 'choose-mode' | 'choose-method' | 'scanning' | 'code-input' | 'result';

interface Props {
  open: boolean;
  onClose: (confirmedParticipant?: Participant, mode?: ScanMode) => void;
  roomId: string;
  roomType: Room['type'];
}

const QrScannerDialog = ({ open, onClose, roomId, roomType }: Props) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { t } = useI18n();
  const [phase, setPhase] = useState<ScanPhase>('choose-mode');
  const [mode, setMode] = useState<ScanMode>('entry');
  const [resultStatus, setResultStatus] = useState<'success' | 'error'>('success');
  const [resultMessage, setResultMessage] = useState('');
  const [resultParticipant, setResultParticipant] = useState<Participant | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const containerId = 'qr-reader';

  const needsModeChoice = roomType === 'school' || roomType === 'company';

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPhase(needsModeChoice ? 'choose-mode' : 'choose-method');
      setMode('entry');
      setResultStatus('success');
      setResultMessage('');
      setResultParticipant(null);
      setCodeInput('');
    }
  }, [open, needsModeChoice]);

  const handleVerified = useCallback((participant: Participant) => {
    if (mode === 'entry') {
      checkIn(participant.id, roomId);
      setResultStatus('success');
      setResultMessage(`${participant.name} · ${t('scanner.entryAt')} ${new Date().toLocaleTimeString()}`);
      toast.success(`${participant.name} - ${t('scanner.entryRegistered')}`);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const records = getAttendance(roomId);
      const todayRecord = records.find(a => a.participantId === participant.id && a.checkIn.startsWith(today) && !a.checkOut);
      if (todayRecord) {
        checkOut(todayRecord.id);
        setResultStatus('success');
        setResultMessage(`${participant.name} · ${t('scanner.exitAt')} ${new Date().toLocaleTimeString()}`);
        toast.success(`${participant.name} - ${t('scanner.exitRegistered')}`);
      } else {
        setResultStatus('error');
        setResultMessage(`${participant.name} - ${t('scanner.noEntryFound')}`);
        toast.error(t('scanner.noEntryFound'));
      }
    }
    if (navigator.vibrate) navigator.vibrate(200);
    setResultParticipant(participant);
    setPhase('result');
  }, [mode, roomId, t]);

  const handleNotFound = useCallback(() => {
    setResultStatus('error');
    setResultMessage(t('scanner.unknown'));
    setResultParticipant(null);
    setPhase('result');
  }, [t]);

  // For events (no mode choice), just do check-in
  const handleVerifiedEvent = useCallback((participant: Participant) => {
    checkIn(participant.id, roomId);
    setResultStatus('success');
    setResultMessage(`${participant.name} · ${t('scanner.verified')} ${new Date().toLocaleTimeString()}`);
    toast.success(`${participant.name} ${t('scanner.checkedIn')}`);
    if (navigator.vibrate) navigator.vibrate(200);
    setResultParticipant(participant);
    setPhase('result');
  }, [roomId, t]);

  const processResult = needsModeChoice ? handleVerified : handleVerifiedEvent;

  // QR Scanner
  useEffect(() => {
    if (!open || phase !== 'scanning') return;

    let mounted = true;
    const timeout = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!mounted) return;
            // Stop scanner immediately after first read
            scanner.stop().catch(() => {});
            scannerRef.current = null;

            const participant = getParticipantByQr(decodedText);
            if (participant) {
              processResult(participant);
            } else {
              handleNotFound();
            }
          },
          () => {}
        );
      } catch (err) {
        console.error('Scanner error:', err);
        toast.error(t('scanner.cameraError'));
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, phase, processResult, handleNotFound, t]);

  const handleCodeSubmit = () => {
    const cleanCode = codeInput.replace('#', '').trim();
    if (!cleanCode) return;
    const participants = getParticipants(roomId);
    const participant = participants.find(p => p.uniqueCode === cleanCode);
    if (participant) {
      processResult(participant);
    } else {
      handleNotFound();
    }
  };

  const handleClose = () => {
    if (resultStatus === 'success' && resultParticipant) {
      onClose(resultParticipant, mode);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" /> {t('scanner.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Choose entry/exit (school/company only) */}
        {phase === 'choose-mode' && (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground text-center">{t('scanner.chooseMode')}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 text-success border-success/30 hover:bg-success/10"
                onClick={() => { setMode('entry'); setPhase('choose-method'); }}
              >
                <LogIn className="h-8 w-8" />
                <span className="font-medium">{t('scanner.entry')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => { setMode('exit'); setPhase('choose-method'); }}
              >
                <LogOut className="h-8 w-8" />
                <span className="font-medium">{t('scanner.exit')}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Choose verification method */}
        {phase === 'choose-method' && (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground text-center">{t('scanner.chooseMethod')}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setPhase('scanning')}
              >
                <Camera className="h-8 w-8" />
                <span className="font-medium">{t('scanner.qrScan')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setPhase('code-input')}
              >
                <Hash className="h-8 w-8" />
                <span className="font-medium">{t('scanner.codeInput')}</span>
              </Button>
            </div>
          </div>
        )}

        {/* QR Scanning */}
        {phase === 'scanning' && (
          <div className="relative">
            <div id={containerId} className="rounded-lg overflow-hidden" />
            <p className="text-xs text-muted-foreground text-center mt-2">{t('scanner.hint')}</p>
          </div>
        )}

        {/* Code Input */}
        {phase === 'code-input' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">{t('scanner.enterCode')}</p>
            <div className="flex gap-2">
              <Input
                placeholder="#000000"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                autoFocus
                className="text-center text-lg font-mono"
              />
            </div>
            <Button className="w-full" onClick={handleCodeSubmit}>
              {t('scanner.verify')}
            </Button>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="py-8">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center"
              >
                {resultStatus === 'success' ? (
                  <>
                    <div className="relative">
                      <CheckCircle2 className="h-20 w-20 text-success" />
                      <div className="absolute inset-0 rounded-full border-2 border-success animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-foreground mt-4 text-center">{resultMessage}</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-20 w-20 text-destructive" />
                    <p className="text-sm font-medium text-foreground mt-4 text-center">{resultMessage}</p>
                  </>
                )}
                <Button className="mt-6" onClick={handleClose}>
                  {t('scanner.close')}
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QrScannerDialog;
