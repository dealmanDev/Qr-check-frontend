import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Participant, type Room } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import QRCode from 'qrcode';
import DigitalCard from './DigitalCard';

interface Props {
  participant: Participant | null;
  room: Room;
  open: boolean;
  onClose: () => void;
}

const ParticipantCardPreview = ({ participant, room, open, onClose }: Props) => {
  const { t } = useI18n();
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!participant) return;
    QRCode.toDataURL(participant.qrSecret, { width: 256, margin: 1 }).then(setQrDataUrl);
  }, [participant]);

  if (!participant || !qrDataUrl) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{t('card.title')}</DialogTitle>
        </DialogHeader>
        <div className="pb-6">
          <DigitalCard participant={participant} room={room} qrDataUrl={qrDataUrl} embedded />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantCardPreview;
