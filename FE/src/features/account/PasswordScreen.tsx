import { FormEvent, useState } from 'react';
import { api } from '../../services/api';
import { Field } from '../../components/ui';
import type { User } from '../../types';
import { getErrorMessage } from '../../utils/errors';
import './PasswordScreen.css'

export function PasswordScreen({
    user,
    setError,
    setNotice,
}: {
    user: User | null;
    setError: (value: string) => void;
    setNotice: (value: string) => void;
}) {
    const [password, setPassword] = useState('');
    const [repeat, setRepeat] = useState('');
    const [saving, setSaving] = useState(false);
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!user?.id) return setError('Nie znaleziono użytkownika w bazie.');
        if (password.length < 6) return setError('Hasło musi mieć co najmniej 6 znaków.');
        if (password !== repeat) return setError('Hasła nie są identyczne.');
        setSaving(true);
        try {
            await api.changeMyPassword(password);
            setNotice('Hasło zostało zmienione.');
            setPassword('');
            setRepeat('');
        } catch (cause) {
            setError(getErrorMessage(cause, 'Nie udało się zmienić hasła.'));
        } finally {
            setSaving(false);
        }
    };
    return (
        <section className="page-section narrow">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">KONTO UŻYTKOWNIKA</p>
                    <h1>Zmiana hasła</h1>
                    <p className="muted">Ustaw nowe hasło do swojego konta.</p>
                </div>
            </div>
            <form className="password-card" onSubmit={submit}>
                <div className="security-icon">⌁</div>
                <div className="password-fields">
                    <Field label="Nowe hasło">
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Wprowadź nowe hasło"
                            required
                        />
                    </Field>
                    <Field label="Powtórz hasło">
                        <input
                            type="password"
                            value={repeat}
                            onChange={(event) => setRepeat(event.target.value)}
                            placeholder="Powtórz hasło"
                            required
                        />
                    </Field>
                </div>
                <div className="form-actions">
                    <button
                        type="button"
                        className="button outline"
                        onClick={() => {
                            setPassword('');
                            setRepeat('');
                        }}
                    >
                        WYCZYŚĆ
                    </button>
                    <button className="button primary" disabled={saving}>
                        {saving ? 'ZAPISYWANIE…' : 'ZAPISZ ZMIANY'}
                    </button>
                </div>
            </form>
        </section>
    );
}
