import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import CalculoPage from './pages/CalculoPage';
import ClientesPage from './pages/ClientesPage';
import ConfigPage from './pages/ConfigPage';
import HistoricoPage from './pages/HistoricoPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import './index.css';

const LOGO_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" height="30"
    viewBox="0 0 10164.01 2350.66" style={{ display: 'block' }}>
    <style>{`.lf0{fill:#A53692;fill-rule:nonzero}.lf1{fill:#ffffff;fill-rule:nonzero}.lf2{fill:#00AFEF;fill-rule:nonzero}.lf3{fill:#ffffff;fill-rule:nonzero}.lf4{fill:#ffffff;fill-rule:nonzero}`}</style>
    <path className="lf4" d="M1410.17 256.07c-73.02,0 -115.96,27.93 -139.6,98.79l-278.8 755.91c-23.64,64.42 -45.1,126.69 -68.74,204l-30.06 0c0,-73 -2.16,-139.58 -10.73,-210.44l-83.75 -738.74c-6.44,-70.87 -45.1,-111.65 -115.96,-111.65l-306.75 0c-79.44,0 -115.96,36.5 -128.85,115.96l-246.94 1365.78 309.23 0 212.6 -1226.21 36.14 0 105.23 912.69c6.44,68.71 49.38,109.52 122.41,109.52l214.73 0c73.02,0 115.96,-27.93 139.25,-98.79l350.02 -923.42 36.52 0 -128.85 1226.21 309.23 0 132.78 -1355.05c8.6,-77.31 -34.37,-126.69 -113.45,-126.69l-315.68 2.13zm1340.37 -30.06c-452.41,0 -636.73,182.54 -716.19,755.91 -79.44,596.99 96.64,781.68 546.89,781.68 442.01,0 632.8,-167.5 711.88,-755.91 81.62,-592.7 -102.72,-781.68 -542.58,-781.68zm-10.75 264.14c219.04,0 270.58,94.48 212.6,491.78 -60.11,408.03 -139.58,517.55 -364.7,517.55 -221.2,0 -265.91,-105.23 -210.44,-491.78 60.11,-412.31 135.29,-517.55 362.55,-517.55zm2076.98 -236.21l-326.41 0 -79.46 566.93 -515.39 0 79.44 -566.93 -328.56 0 -208.29 1481.75 328.56 0 92.32 -659.28 515.39 0 -92.32 659.28 326.41 0 208.31 -1481.75zm1343.95 431.64c47.25,-345.76 -152.46,-450.97 -498.22,-450.97 -238.37,0 -371.5,2.13 -547.6,19.33l-208.29 1481.75 319.96 0 81.59 -577.66 244.81 0c79.46,0 113.83,25.77 124.56,118.09l68.71 459.56 335 0 -77.31 -455.25c-23.61,-152.49 -96.64,-208.31 -178.23,-227.64l2.16 -12.88c223.33,-25.77 307.08,-161.06 332.85,-354.33zm-818.18 219.04l60.14 -416.62 253.38 -2.13c156.77,0 199.71,47.23 178.26,195.43 -25.77,173.94 -88.06,223.33 -257.7,223.33l-234.08 0z"/>
    <path className="lf2" d="M7328.28 228.17c-296.35,0 -478.89,38.65 -523.99,371.5 -27.93,208.31 32.21,335 240.52,412.31l294.19 109.52c132.78,49.41 167.15,83.75 147.82,236.24 -27.57,206.16 -115.61,234.06 -360.42,234.06 -92.35,2.16 -178.23,-2.13 -429.48,-10.73l-23.64 139.58c197.58,36.52 362.93,40.81 450.97,40.81 349.69,0 506.11,-60.14 550.82,-384.39 30.08,-219.04 -21.1,-335 -243.72,-416.62l-289.91 -107.36c-133.16,-49.38 -167.5,-85.91 -148.17,-234.08 30.06,-223.33 135.29,-223.33 330.69,-221.2 146.04,0 276.31,4.31 422,10.75l19.33 -137.45c-141.38,-32.21 -293.51,-40.81 -437.02,-42.94zm1161.78 989.97l629.2 -964.2 -206.16 0 -399.43 622.75c-32.21,49.41 -68.71,120.27 -88.04,173.94l-17.2 0c-8.57,-55.83 -25.77,-115.96 -42.94,-167.5l-223.33 -629.2 -193.27 0 354.33 957.76 -75.18 523.99 191.14 0 70.87 -517.55zm1236.94 -989.97c-296.35,0 -478.89,38.65 -523.99,371.5 -27.93,208.31 32.21,335 240.52,412.31l294.19 109.52c132.78,49.41 167.15,83.75 147.82,236.24 -27.57,206.16 -115.61,234.06 -360.42,234.06 -92.35,2.16 -178.23,-2.13 -429.48,-10.73l-23.64 139.58c197.58,36.52 362.93,40.81 450.97,40.81 349.69,0 506.11,-60.14 550.82,-384.39 30.08,-219.04 -21.1,-335 -243.72,-416.62l-289.91 -107.36c-133.16,-49.38 -167.5,-85.91 -148.17,-234.08 30.06,-223.33 135.29,-223.33 330.69,-221.2 146.04,0 276.31,4.31 422,10.75l19.33 -137.45c-141.38,-32.21 -293.51,-40.81 -437.02,-42.94z"/>
    <polygon className="lf2" points="6094.56,2350.66 6432.28,0 6522.5,0 6184.81,2350.66"/>
    <polygon className="lf1" points="6280.43,2350.66 6618.15,0 6708.36,0 6370.67,2350.66"/>
  </svg>
);

type Secao = 'orcamento' | 'clientes' | 'config' | 'historico' | 'dashboard';

function AppInner({ setLoggedIn }: { setLoggedIn: (v: boolean) => void }) {
  const [secao, setSecao] = useState<Secao>('orcamento');
  const { toastMsg } = useApp();

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setLoggedIn(false);
  };

  const tabs: { id: Secao; label: string }[] = [
    { id: 'orcamento',  label: 'Cálculo'      },
    { id: 'clientes',   label: 'Clientes'     },
    { id: 'config',     label: 'Configurações'},
    { id: 'historico',  label: 'Orçamentos'   },
    { id: 'dashboard',  label: 'Dashboard'    },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="header">
        <div className="header-inner" style={{ gridTemplateColumns: 'minmax(280px,340px) minmax(0,1fr) minmax(0,auto)' }}>
          <div className="logo" style={{ padding: 0 }}>
            {LOGO_SVG}
          </div>
          <div className="nav-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`nav-tab${secao === t.id ? ' active' : ''}`} onClick={() => setSecao(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <button className="nav-tab" onClick={() => logout()} style={{ color: 'rgba(244,114,182,.8)', flexShrink: 0 }}>
            Sair
          </button>
        </div>
      </div>

      <div className="main" style={{ flex: 1 }}>
        {secao === 'orcamento'  && <CalculoPage  onGoTo={(s: Secao) => setSecao(s)} />}
        {secao === 'clientes'   && <ClientesPage onGoTo={(s: Secao) => setSecao(s)} />}
        {secao === 'config'     && <ConfigPage   />}
        {secao === 'historico'  && <HistoricoPage onGoTo={(s: Secao) => setSecao(s)} />}
        {secao === 'dashboard'  && <DashboardPage />}
      </div>

      {toastMsg && (
        <div className="toast show">{toastMsg}</div>
      )}
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('access_token'));

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <AppProvider>
      <AppInner setLoggedIn={setLoggedIn} />
    </AppProvider>
  );
}
