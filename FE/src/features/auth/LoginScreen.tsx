import { FormEvent, useState } from 'react';
import { Field } from '../../components/ui';
import './LoginScreen.css'

type Props = { onLogin: (email: string, password: string) => void; busy: boolean; error: string };

export function LoginScreen({ onLogin, busy, error }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="auth-page">
            <div className="auth-orb orb-one" />
            <div className="auth-orb orb-two" />
            <div className="auth-layout">
                <div className="brand-panel">
                    <div className="brand-mark">
                        <span>EKD</span>
                    </div>
                    <p className="eyebrow">SYSTEM ZARZĄDZANIA FLOTĄ</p>
                    <h1>
                        Elektroniczna
                        <br />
                        Karta Drogowa
                    </h1>
                    <p className="brand-copy">
                        Szybciej planuj przejazdy, kontroluj liczniki i przechowuj dokumentację w jednym miejscu.
                    </p>
                    <div className="brand-stats">
                        <span>
                            <b>01</b> karta
                        </span>
                        <span>
                            <b>24/7</b> dostęp
                        </span>
                        <span>
                            <b>100%</b> cyfrowo
                        </span>
                    </div>
                </div>
                <form className="login-card" onSubmit={submit}>
                    <div className="card-kicker">WITAJ PONOWNIE</div>
                    <h2>Logowanie</h2>
                    <p className="muted">Zaloguj się, aby otworzyć swoją kartę drogową.</p>
                    <Field label="Adres e-mail">
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Wprowadź adres e-mail"
                            required
                        />
                    </Field>
                    <Field label="Hasło">
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Wprowadź hasło"
                            required
                        />
                    </Field>
                    {error && <div className="form-error">{error}</div>}
                    <button className="button primary wide" disabled={busy}>
                        {busy ? 'LOGOWANIE…' : 'ZALOGUJ SIĘ'} <span>→</span>
                    </button>
                    <p className="api-note">
                        API: <code>{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</code>
                    </p>
                </form>
            </div>
        </div>
    );
}
