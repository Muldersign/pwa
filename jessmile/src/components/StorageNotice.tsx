import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { isIOS, isStandalone } from '../lib/install';

const KEY = 'jessmile-storage-notice-dismissed';

/**
 * iOS keeps Safari and the home-screen app in separate storage, and the preview page may not keep
 * storage at all. Registrations made in one place are invisible in the other, which looks like data loss.
 */
export function StorageNotice() {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });
  if (isStandalone()) return null;
  const preview = __SINGLE_FILE__;
  const mobile = isIOS() || /android/i.test(navigator.userAgent);
  if (!preview && (!mobile || hidden)) return null;

  return (
    <div className="notice notice-warn" role="note">
      <Smartphone size={18} />
      <div>
        {preview ? (
          <p>
            <strong>Dit is een voorbeeldweergave.</strong> Registraties worden hier mogelijk niet bewaard als je de pagina sluit. Gebruik voor echt bijhouden
            Jessmile vanaf je beginscherm.
          </p>
        ) : (
          <p>
            <strong>Je gebruikt Jessmile nu in de browser.</strong>{' '}
            {isIOS()
              ? 'Safari en de app op je beginscherm bewaren hun gegevens apart. Tik op Deel → Zet op beginscherm en gebruik daarna alleen dat icoon.'
              : 'Installeer Jessmile via het browsermenu (App installeren) en gebruik daarna alleen dat icoon, zodat al je registraties op één plek staan.'}
          </p>
        )}
      </div>
      {!preview && (
        <button
          className="notice-close"
          aria-label="Melding sluiten"
          onClick={() => {
            try {
              localStorage.setItem(KEY, '1');
            } catch {
              /* ignore */
            }
            setHidden(true);
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
