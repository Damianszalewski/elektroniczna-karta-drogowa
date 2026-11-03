import { useEffect, useState } from 'react';
import { api } from './services/api';
import { Alert } from './components/ui';
import { Header, Sidebar } from './components/layout';
import { LoginScreen } from './features/auth/LoginScreen';
import { PasswordScreen } from './features/account/PasswordScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { ArchiveScreen } from './features/roadCards/ArchiveScreen';
import { NewRoadCardScreen } from './features/roadCards/NewRoadCardScreen';
import { PrintRoadCardScreen } from './features/roadCards/PrintRoadCardScreen';
import { VehiclesScreen } from './features/fleet/VehiclesScreen';
import { RoutesScreen } from './features/routes/RoutesScreen';
import { UsersScreen } from './features/users/UsersScreen';
import type { Car, RoadCard, Screen, User } from './types';
import { isAdministrator } from './utils/formatters';
import { getErrorMessage } from './utils/errors';

const ADMIN_SCREENS: Screen[] = ['users', 'vehicles', 'routes'];
type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
    return localStorage.getItem('road-card-theme') === 'light' ? 'light' : 'dark';
}

export default function App() {
    const [screen, setScreen] = useState<Screen>(sessionStorage.getItem('road-card-token') ? 'menu' : 'login');
    const [user, setUser] = useState<User | null>(null);
    const [editingCard, setEditingCard] = useState<RoadCard | null>(null);
    const [printingCard, setPrintingCard] = useState<RoadCard | null>(null);
    const [printingCar, setPrintingCar] = useState<Car | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('road-card-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(''), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    useEffect(() => {
        if (screen === 'login' || user) return;
        api.me()
            .then(setUser)
            .catch(() => undefined);
    }, [screen, user]);

    useEffect(() => {
        if (user && !isAdministrator(user) && ADMIN_SCREENS.includes(screen)) setScreen('menu');
    }, [screen, user]);

    const login = async (email: string, password: string) => {
        setBusy(true);
        setError('');
        try {
            const result = await api.login(email, password);
            sessionStorage.setItem('road-card-token', result.access_token);
            sessionStorage.setItem('road-card-email', email);
            setUser(await api.me());
            setScreen('menu');
        } catch (cause) {
            setError(getErrorMessage(cause, 'Logowanie nie powiodło się.'));
        } finally {
            setBusy(false);
        }
    };

    const logout = () => {
        sessionStorage.removeItem('road-card-token');
        sessionStorage.removeItem('road-card-email');
        setUser(null);
        setScreen('login');
        setError('');
    };

    if (screen === 'login') return <LoginScreen onLogin={login} busy={busy} error={error} />;

    return (
        <div className="app-shell">
            <Header
                screen={screen}
                user={user}
                theme={theme}
                onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                onMenu={() => setScreen('menu')}
                onLogout={logout}
            />
            <div className="app-body">
                <Sidebar active={screen} user={user} onNavigate={setScreen} />
                <main className="content">
                    <div className="alert-slot">
                        {error && (
                            <Alert tone="error" onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}
                        {notice && (
                            <Alert tone="success" onClose={() => setNotice('')}>
                                {notice}
                            </Alert>
                        )}
                    </div>
                    {renderScreen(screen, {
                        user,
                        editingCard,
                        printingCard,
                        printingCar,
                        setError,
                        setNotice,
                        setEditingCard,
                        setPrintingCard,
                        setPrintingCar,
                        setScreen,
                    })}
                </main>
            </div>
        </div>
    );
}

type ScreenContext = {
    user: User | null;
    editingCard: RoadCard | null;
    printingCard: RoadCard | null;
    printingCar: Car | null;
    setError: (value: string) => void;
    setNotice: (value: string) => void;
    setEditingCard: (card: RoadCard | null) => void;
    setPrintingCard: (card: RoadCard | null) => void;
    setPrintingCar: (car: Car | null) => void;
    setScreen: (screen: Screen) => void;
};

function renderScreen(screen: Screen, context: ScreenContext) {
    const {
        user,
        editingCard,
        printingCard,
        printingCar,
        setError,
        setNotice,
        setEditingCard,
        setPrintingCard,
        setPrintingCar,
        setScreen,
    } = context;
    switch (screen) {
        case 'menu':
            return <DashboardScreen user={user} onNavigate={setScreen} />;
        case 'new-card':
            return <NewRoadCardScreen user={user} setError={setError} setNotice={setNotice} />;
        case 'edit-card':
            return editingCard ? (
                <NewRoadCardScreen
                    user={user}
                    existingCard={editingCard}
                    setError={setError}
                    setNotice={setNotice}
                    onFinished={() => {
                        setEditingCard(null);
                        setScreen('archive');
                    }}
                />
            ) : null;
        case 'archive':
            return (
                <ArchiveScreen
                    user={user}
                    setError={setError}
                    onEdit={(card) => {
                        setEditingCard(card);
                        setScreen('edit-card');
                    }}
                    onPrint={(card, car) => {
                        setPrintingCard(card);
                        setPrintingCar(car);
                        setScreen('print-card');
                    }}
                />
            );
        case 'print-card':
            return printingCard ? (
                <PrintRoadCardScreen
                    card={printingCard}
                    car={printingCar}
                    user={user}
                    onBack={() => {
                        setPrintingCard(null);
                        setPrintingCar(null);
                        setScreen('archive');
                    }}
                />
            ) : null;
        case 'vehicles':
            return isAdministrator(user) ? <VehiclesScreen setError={setError} setNotice={setNotice} /> : null;
        case 'routes':
            return isAdministrator(user) ? <RoutesScreen setError={setError} setNotice={setNotice} /> : null;
        case 'users':
            return isAdministrator(user) ? <UsersScreen setError={setError} setNotice={setNotice} /> : null;
        case 'password':
            return <PasswordScreen user={user} setError={setError} setNotice={setNotice} />;
        default:
            return null;
    }
}
