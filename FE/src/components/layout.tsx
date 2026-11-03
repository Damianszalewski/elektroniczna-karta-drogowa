import type { Screen, User } from '../types';
import { displayName, isAdministrator } from '../utils/formatters';
import { AppIcon, type AppIconName } from './ui';
import logo from '../assets/ekd-logo.png';
import './layout.css'

const screenLabels: Record<Screen, string> = {
    login: 'Logowanie',
    menu: 'Panel główny',
    'new-card': 'Nowa karta drogowa',
    'edit-card': 'Edycja karty drogowej',
    archive: 'Archiwum kart',
    'print-card': 'Drukowanie karty',
    password: 'Zmiana hasła',
    vehicles: 'Pojazdy',
    routes: 'Trasy',
    users: 'Użytkownicy',
};

export function Header({
    screen,
    user,
    theme,
    onToggleTheme,
    onMenu,
    onLogout,
}: {
    screen: Screen;
    user: User | null;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
    onMenu: () => void;
    onLogout: () => void;
}) {
    return (
        <header className="topbar">
            <button className="mobile-menu" onClick={onMenu}>
                ☰
            </button>
            <div className="topbar-brand">
                <img className="brand-logo" src={logo} alt="EKD" />
                <span>Elektroniczna Karta Drogowa</span>
            </div>
            <div className="topbar-context">{screenLabels[screen]}</div>
            <div className="topbar-user">
                <button
                    className="theme-toggle"
                    type="button"
                    title={theme === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
                    aria-label={theme === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
                    aria-pressed={theme === 'light'}
                    onClick={onToggleTheme}
                >
                    <span aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span>
                </button>
                <span className="avatar">{(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</span>
                <span>{displayName(user)}</span>
                <button className="icon-button" title="Wyloguj" onClick={onLogout}>
                    ↪
                </button>
            </div>
        </header>
    );
}

export function Sidebar({
    active,
    user,
    onNavigate,
}: {
    active: Screen;
    user: User | null;
    onNavigate: (screen: Screen) => void;
}) {
    const item = (screen: Screen, icon: AppIconName, label: string) => (
        <button
            className={
                active === screen || (screen === 'new-card' && active === 'edit-card') ? 'nav-item active' : 'nav-item'
            }
            onClick={() => onNavigate(screen)}
        >
            <span><AppIcon name={icon} /></span> {label}
        </button>
    );
    return (
        <aside className="sidebar">
            <div className="side-caption">MENU GŁÓWNE</div>
            {item('menu', 'home', 'Panel główny')}
            {item('new-card', 'file-plus', 'Nowa karta')}
            {item('archive', 'archive', 'Archiwum')}
            {isAdministrator(user) && item('vehicles', 'car', 'Pojazdy')}
            {isAdministrator(user) && item('routes', 'route', 'Trasy')}
            {isAdministrator(user) && item('users', 'users', 'Użytkownicy')}
            <div className="side-caption side-caption-lower">KONTO</div>
            {item('password', 'key', 'Zmiana hasła')}
            <div className="sidebar-footer">
                <div className="status-dot" /> Połączenie z API
                <br />
                <span>gotowe do pracy</span>
            </div>
        </aside>
    );
}
