import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { ConfirmModal, Field, Loading, Pagination, TrashIcon } from '../../components/ui';
import type { RouteTemplate } from '../../types';
import { sortRoutes } from '../../utils/formatters';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import { usePagination } from '../../hooks/usePagination';
import { getErrorMessage } from '../../utils/errors';
import './RoutesScreen.css'

type RouteForm = { name: string; departure_location: string; points: string; arrival_location: string };
const emptyForm = (): RouteForm => ({ name: '', departure_location: '', points: '', arrival_location: '' });
type Props = { setError: (value: string) => void; setNotice: (value: string) => void };

export function RoutesScreen({ setError, setNotice }: Props) {
    const [routes, setRoutes] = useState<RouteTemplate[]>([]);
    const [form, setForm] = useState(emptyForm());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const load = () =>
        api
            .templates()
            .then(setRoutes)
            .catch((cause) => setError(getErrorMessage(cause, 'Nie udało się pobrać tras.')));
    useEffect(() => {
        load().finally(() => setLoading(false));
    }, []);
    const set = (key: keyof RouteForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
    const sortedRoutes = useMemo(() => sortRoutes(routes), [routes]);
    const { currentPage, pageCount, visibleItems: visibleRoutes, setPage } = usePagination(sortedRoutes);
    const reset = () => {
        setForm(emptyForm());
        setEditingId(null);
    };
    const edit = (route: RouteTemplate) => {
        setEditingId(route.id);
        setForm({
            name: route.name,
            departure_location: route.departure_location,
            points: route.points.join(', '),
            arrival_location: route.arrival_location,
        });
    };
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!form.name.trim() || !form.departure_location.trim() || !form.arrival_location.trim())
            return setError('Podaj nazwę, miejsce odjazdu i miejsce przyjazdu.');
        setSaving(true);
        const points = form.points
            .split(',')
            .map((point) => point.trim())
            .filter(Boolean);
        const payload = {
            name: form.name.trim(),
            departure_location: form.departure_location.trim(),
            points,
            arrival_location: form.arrival_location.trim(),
        };
        try {
            if (editingId) await api.updateTemplate(editingId, payload);
            else await api.createTemplate(payload);
            await load();
            const wasEditing = Boolean(editingId);
            reset();
            setNotice(wasEditing ? 'Trasa została zaktualizowana.' : 'Trasa została dodana.');
        } catch (cause) {
            setError(getErrorMessage(cause, 'Nie udało się zapisać trasy.'));
        } finally {
            setSaving(false);
        }
    };
    const { deleteTarget, deleting, requestDelete, confirmDelete, cancelDelete } = useDeleteConfirmation(
        async (route: RouteTemplate) => {
            await api.deleteTemplate(route.id);
            setRoutes((items) => items.filter((item) => item.id !== route.id));
            setNotice('Trasa została usunięta.');
        },
        (cause) => setError(getErrorMessage(cause, 'Nie udało się usunąć trasy.')),
    );
    return (
        <section className="page-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">KONFIGURACJA</p>
                    <h1>Gotowe trasy</h1>
                    <p className="muted">Zapisuj często używane trasy z osobnym odjazdem, punktami i przyjazdem.</p>
                </div>
                <div className="count-chip">
                    {routes.length} <span>tras</span>
                </div>
            </div>
            <div className="vehicles-layout">
                <form className="vehicle-form form-card" onSubmit={submit}>
                    <div className="editor-title">
                        <div>
                            <span className="card-kicker">{editingId ? 'EDYCJA TRASY' : 'NOWA TRASA'}</span>
                            <h3>{editingId ? 'Aktualizuj trasę' : 'Dodaj gotową trasę'}</h3>
                        </div>
                        {editingId && (
                            <button type="button" className="icon-button" onClick={reset}>
                                ×
                            </button>
                        )}
                    </div>
                    <Field label="Nazwa trasy">
                        <input
                            value={form.name}
                            onChange={(event) => set('name', event.target.value)}
                            placeholder="Wprowadź nazwę trasy"
                            required
                        />
                    </Field>
                    <Field label="Odjazd z">
                        <input
                            value={form.departure_location}
                            onChange={(event) => set('departure_location', event.target.value)}
                            placeholder="Wprowadź miejsce odjazdu"
                            required
                        />
                    </Field>
                    <Field label="Punkty pośrednie">
                        <input
                            value={form.points}
                            onChange={(event) => set('points', event.target.value)}
                            placeholder="Wprowadź punkty pośrednie"
                        />
                    </Field>
                    <Field label="Przyjazd do">
                        <input
                            value={form.arrival_location}
                            onChange={(event) => set('arrival_location', event.target.value)}
                            placeholder="Wprowadź miejsce przyjazdu"
                            required
                        />
                    </Field>
                    <div className="form-actions vehicle-form-actions">
                        <button type="button" className="button outline" onClick={reset}>
                            WYCZYŚĆ
                        </button>
                        <button className="button primary" disabled={saving}>
                            {saving ? 'ZAPISYWANIE…' : editingId ? 'ZAPISZ ZMIANY' : 'DODAJ TRASĘ'}
                        </button>
                    </div>
                </form>
                <div className="vehicles-list">
                    <div className="section-toolbar">
                        <div>
                            <h2>Zapisane trasy</h2>
                            <p className="muted">Dostępne przy dodawaniu kursu.</p>
                        </div>
                    </div>
                    {loading ? (
                        <Loading />
                    ) : routes.length === 0 ? (
                        <div className="empty-state large">
                            <div>↗</div>
                            <b>Brak gotowych tras</b>
                            <p>Dodaj pierwszą trasę za pomocą formularza.</p>
                        </div>
                    ) : (
                        <>
                            <div className="route-list">
                            {visibleRoutes.map((route) => (
                                <div className="route-card" key={route.id}>
                                    <div className="route-card-icon">↗</div>
                                    <div>
                                        <b>{route.name}</b>
                                        <p>
                                            <strong>Odjazd:</strong> {route.departure_location} ·{' '}
                                            <strong>Punkty:</strong> {route.points.join(', ') || 'brak'} ·{' '}
                                            <strong>Przyjazd:</strong> {route.arrival_location}
                                        </p>
                                    </div>
                                    <div className="row-actions">
                                        <button className="icon-button mint" onClick={() => edit(route)}>
                                            ✎
                                        </button>
                                        <button className="icon-button danger" onClick={() => requestDelete(route)}>
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
                    message={`Czy na pewno chcesz usunąć trasę „${deleteTarget.name}”?`}
                    busy={deleting}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </section>
    );
}
