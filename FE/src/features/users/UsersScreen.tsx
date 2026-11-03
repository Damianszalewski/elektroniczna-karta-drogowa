import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { ConfirmModal, Field, Loading, Pagination, TrashIcon } from '../../components/ui';
import type { User, UserRole } from '../../types';
import { sortUsers } from '../../utils/formatters';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import { usePagination } from '../../hooks/usePagination';
import { USERS_PAGE_SIZE } from '../../utils/pagination';
import { getErrorMessage } from '../../utils/errors';
import './UsersScreen.css'

type UserForm = { email: string; name: string; last_name: string; password: string; role: UserRole; isAdmin: boolean };
const emptyForm = (): UserForm => ({
    email: '',
    name: '',
    last_name: '',
    password: '',
    role: 'kierowca',
    isAdmin: false,
});
const roleLabel = (role: UserRole) =>
    ({ kierowca: 'Kierowca', logistyka: 'Logistyka', administrator: 'Administrator' })[role];
type Props = { setError: (value: string) => void; setNotice: (value: string) => void };

export function UsersScreen({ setError, setNotice }: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [form, setForm] = useState(emptyForm());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const load = () =>
        api
            .users()
            .then(setUsers)
            .catch((cause) =>
                setError(getErrorMessage(cause, 'Nie udało się pobrać użytkowników.')),
            );
    useEffect(() => {
        load().finally(() => setLoading(false));
    }, []);
    const filtered = useMemo(
        () =>
            sortUsers(
                users.filter((user) =>
                    `${user.name} ${user.last_name} ${user.email} ${roleLabel(user.role)}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                ),
            ),
        [users, query],
    );
    const { currentPage, pageCount, visibleItems: visibleUsers, setPage } = usePagination(filtered, {
        pageSize: USERS_PAGE_SIZE,
        resetKey: query,
    });
    const set = (key: keyof UserForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
    const reset = () => {
        setForm(emptyForm());
        setEditingId(null);
    };
    const edit = (user: User) => {
        setEditingId(user.id);
        setForm({
            email: user.email,
            name: user.name,
            last_name: user.last_name,
            password: '',
            role: user.role === 'logistyka' ? 'logistyka' : 'kierowca',
            isAdmin: user.role === 'administrator',
        });
    };
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (
            !form.email.trim() ||
            !form.name.trim() ||
            !form.last_name.trim() ||
            (!editingId && form.password.length < 6)
        )
            return setError(
                editingId ? 'Uzupełnij imię, nazwisko i adres e-mail.' : 'Nowe hasło musi mieć co najmniej 6 znaków.',
            );
        const role: UserRole = form.isAdmin ? 'administrator' : form.role === 'logistyka' ? 'logistyka' : 'kierowca';
        setSaving(true);
        try {
            if (editingId)
                await api.updateUser(editingId, {
                    email: form.email.trim(),
                    name: form.name.trim(),
                    last_name: form.last_name.trim(),
                    role,
                    ...(form.password ? { password: form.password } : {}),
                });
            else
                await api.createUser({
                    email: form.email.trim(),
                    name: form.name.trim(),
                    last_name: form.last_name.trim(),
                    password: form.password,
                    role,
                });
            await load();
            const wasEditing = Boolean(editingId);
            reset();
            setNotice(wasEditing ? 'Użytkownik został zaktualizowany.' : 'Użytkownik został dodany.');
        } catch (cause) {
            setError(getErrorMessage(cause, 'Nie udało się zapisać użytkownika.'));
        } finally {
            setSaving(false);
        }
    };
    const { deleteTarget, deleting, requestDelete, confirmDelete, cancelDelete } = useDeleteConfirmation(
        async (user: User) => {
            await api.deleteUser(user.id);
            setUsers((items) => items.filter((item) => item.id !== user.id));
            setNotice('Użytkownik został usunięty.');
        },
        (cause) => setError(getErrorMessage(cause, 'Nie udało się usunąć użytkownika.')),
    );
    return (
        <section className="page-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">ADMINISTRACJA</p>
                    <h1>Użytkownicy</h1>
                    <p className="muted">Zarządzaj kontami i przypisuj zakres odpowiedzialności.</p>
                </div>
                <div className="count-chip">
                    {users.length} <span>kont</span>
                </div>
            </div>
            <div className="users-layout">
                <form className="user-form form-card" onSubmit={submit}>
                    <div className="editor-title">
                        <div>
                            <span className="card-kicker">{editingId ? 'EDYCJA UŻYTKOWNIKA' : 'NOWE KONTO'}</span>
                            <h3>{editingId ? 'Aktualizuj dane' : 'Dodaj użytkownika'}</h3>
                        </div>
                        {editingId && (
                            <button type="button" className="icon-button" onClick={reset}>
                                ×
                            </button>
                        )}
                    </div>
                    <Field label="Imię">
                        <input
                            value={form.name}
                            onChange={(event) => set('name', event.target.value)}
                            placeholder="Wprowadź imię"
                            required
                        />
                    </Field>
                    <Field label="Nazwisko">
                        <input
                            value={form.last_name}
                            onChange={(event) => set('last_name', event.target.value)}
                            placeholder="Wprowadź nazwisko"
                            required
                        />
                    </Field>
                    <Field label="Adres e-mail">
                        <input
                            type="email"
                            value={form.email}
                            onChange={(event) => set('email', event.target.value)}
                            placeholder="Wprowadź adres e-mail"
                            required
                        />
                    </Field>
                    <Field label={editingId ? 'Nowe hasło (opcjonalnie)' : 'Hasło'}>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(event) => set('password', event.target.value)}
                            placeholder="Wprowadź hasło"
                            required={!editingId}
                        />
                    </Field>
                    <Field label="Rola podstawowa">
                        <select value={form.role} onChange={(event) => set('role', event.target.value as UserRole)}>
                            <option value="kierowca">Kierowca</option>
                            <option value="logistyka">Logistyka</option>
                        </select>
                    </Field>
                    <label className="admin-checkbox">
                        <input
                            type="checkbox"
                            checked={form.isAdmin}
                            onChange={(event) => set('isAdmin', event.target.checked)}
                        />
                        <span>
                            <b>Administrator</b>
                            <small>Użytkownik otrzyma uprawnienia administratora.</small>
                        </span>
                    </label>
                    <div className="form-actions vehicle-form-actions">
                        <button type="button" className="button outline" onClick={reset}>
                            WYCZYŚĆ
                        </button>
                        <button className="button primary" disabled={saving}>
                            {saving ? 'ZAPISYWANIE…' : editingId ? 'ZAPISZ ZMIANY' : 'DODAJ UŻYTKOWNIKA'}
                        </button>
                    </div>
                </form>
                <div className="users-list">
                    <div className="section-toolbar">
                        <div>
                            <h2>Lista użytkowników</h2>
                            <p className="muted">
                                Podstawowa rola to kierowca lub logistyka. Administrator jest osobnym oznaczeniem.
                            </p>
                        </div>
                    </div>
                    <div className="search-field vehicle-search">
                        <span>⌕</span>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Szukaj po nazwisku, e-mailu lub roli…"
                        />
                    </div>
                    {loading ? (
                        <Loading />
                    ) : filtered.length === 0 ? (
                        <div className="empty-state large">
                            <div>♙</div>
                            <b>{query ? 'Brak wyników wyszukiwania' : 'Brak użytkowników'}</b>
                            <p>Dodaj pierwsze konto za pomocą formularza.</p>
                        </div>
                    ) : (
                        <>
                            <div className="user-table">
                            {visibleUsers.map((user) => (
                                <div className="user-table-row" key={user.id}>
                                    <div className="user-avatar">{(user.name?.[0] || user.email[0]).toUpperCase()}</div>
                                    <div>
                                        <b>
                                            {user.name} {user.last_name}
                                        </b>
                                        <small>{user.email}</small>
                                    </div>
                                    <div>
                                        <span className={`role-badge role-${user.role}`}>{roleLabel(user.role)}</span>
                                    </div>
                                    <div className="row-actions">
                                        <button className="icon-button mint" onClick={() => edit(user)}>
                                            ✎
                                        </button>
                                        <button className="icon-button danger" onClick={() => requestDelete(user)}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            </div>
                            <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
                        </>
                    )}
                </div>
            </div>
            {deleteTarget && (
                <ConfirmModal
                    message={`Czy na pewno chcesz usunąć użytkownika ${deleteTarget.email}?`}
                    busy={deleting}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </section>
    );
}
