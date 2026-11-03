import type { Screen, User } from '../../types';
import { isAdministrator } from '../../utils/formatters';
import { AppIcon, type AppIconName } from '../../components/ui';
import './DashboardScreen.css'

export function DashboardScreen({ user, onNavigate }: { user: User | null; onNavigate: (screen: Screen) => void }) {
    const card = (screen: Screen, icon: AppIconName, title: string, text: string, accent = false) => (
        <button className={`action-card${accent ? ' accent' : ''}`} onClick={() => onNavigate(screen)}>
            <span className="action-icon"><AppIcon name={icon} /></span>
            <span>
                <b>{title}</b>
                <small>{text}</small>
            </span>
            <i>→</i>
        </button>
    );
    return (
        <section className="page-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">PANEL GŁÓWNY</p>
                    <h1>Dzień dobry, {user?.name || 'kierowco'}.</h1>
                    <p className="muted">Co chcesz zrobić?</p>
                </div>
                <div className="date-chip">
                    {new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(
                        new Date(),
                    )}
                </div>
            </div>
            <div className="dashboard-grid">
                {card('new-card', 'file-plus', 'Nowa karta drogowa', 'Uzupełnij dane przejazdu krok po kroku', true)}
                {card('archive', 'archive', 'Archiwum kart', 'Wyszukaj i przeglądaj zapisane karty')}
                {isAdministrator(user) && card('vehicles', 'car', 'Pojazdy', 'Dodawaj i zarządzaj pojazdami floty')}
                {isAdministrator(user) && card('routes', 'route', 'Trasy', 'Zarządzaj gotowymi trasami i punktami')}
                {isAdministrator(user) && card('users', 'users', 'Użytkownicy', 'Dodawaj konta i przypisuj role')}
                {card('password', 'key', 'Zmiana hasła', 'Zaktualizuj dane bezpieczeństwa')}
            </div>
            <div className="info-banner">
                <div className="info-icon">i</div>
                <div>
                    <b>Elektroniczna dokumentacja przejazdów</b>
                    <p>
                        Wybierz „Nowa karta drogowa”, aby rozpocząć. Wszystkie zapisane karty znajdziesz później w
                        archiwum.
                    </p>
                </div>
            </div>
        </section>
    );
}
