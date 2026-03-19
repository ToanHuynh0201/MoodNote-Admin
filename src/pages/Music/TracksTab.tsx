import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import api from '@/services/api'
import type { Track, TracksResponse, Genre, GenresResponse, Artist, ArtistsResponse } from '@/types/music'
import type { Pagination } from '@/types/user'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

interface ModalState {
  open: boolean
  item: Track | null
}

interface TrackForm {
  title: string
  artistId: string
  genreId: string
  duration: string
  isActive: boolean
}

const EMPTY_FORM: TrackForm = { title: '', artistId: '', genreId: '', duration: '', isActive: true }

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TracksTab() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [filterGenreId, setFilterGenreId] = useState('')
  const [filterArtistId, setFilterArtistId] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // For dropdowns in filters & modal
  const [allGenres, setAllGenres] = useState<Genre[]>([])
  const [allArtists, setAllArtists] = useState<Artist[]>([])

  const [modal, setModal] = useState<ModalState>({ open: false, item: null })
  const [form, setForm] = useState<TrackForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchTracks = async (
    currentPage: number,
    currentSearch: string,
    genreId: string,
    artistId: string,
    isActive: string,
  ) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: 20 }
      if (currentSearch) params.search = currentSearch
      if (genreId) params.genreId = genreId
      if (artistId) params.artistId = artistId
      if (isActive !== '') params.isActive = isActive
      const { data } = await api.get<TracksResponse>('/admin/music/tracks', { params })
      setTracks(data.data.items)
      setPagination(data.data.pagination)
    } catch {
      setError('Failed to load tracks.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const [gRes, aRes] = await Promise.all([
        api.get<GenresResponse>('/admin/music/genres', { params: { page: 1, limit: 200 } }),
        api.get<ArtistsResponse>('/admin/music/artists', { params: { page: 1, limit: 200 } }),
      ])
      setAllGenres(gRes.data.data.items)
      setAllArtists(aRes.data.data.items)
    } catch {
      // Non-critical; dropdowns simply won't populate
    }
  }

  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    fetchTracks(page, search, filterGenreId, filterArtistId, filterActive)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterGenreId, filterArtistId, filterActive])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchTracks(1, value, filterGenreId, filterArtistId, filterActive)
    }, 300)
  }

  const handleFilterChange = (key: 'genreId' | 'artistId' | 'active', value: string) => {
    setPage(1)
    if (key === 'genreId') setFilterGenreId(value)
    if (key === 'artistId') setFilterArtistId(value)
    if (key === 'active') setFilterActive(value)
  }

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    setModal({ open: true, item: null })
  }

  const openEdit = (item: Track) => {
    setForm({
      title: item.title,
      artistId: item.artist.id,
      genreId: item.genre.id,
      duration: item.duration !== null ? String(item.duration) : '',
      isActive: item.isActive,
    })
    setFormError('')
    setModal({ open: true, item })
  }

  const closeModal = () => setModal({ open: false, item: null })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) { setFormError('Title is required.'); return }
    if (!form.artistId) { setFormError('Artist is required.'); return }
    if (!form.genreId) { setFormError('Genre is required.'); return }

    setFormLoading(true)
    const body = {
      title: form.title.trim(),
      artistId: form.artistId,
      genreId: form.genreId,
      duration: form.duration !== '' ? Number(form.duration) : null,
      isActive: form.isActive,
    }
    try {
      if (modal.item) {
        await api.put(`/admin/music/tracks/${modal.item.id}`, body)
      } else {
        await api.post('/admin/music/tracks', body)
      }
      closeModal()
      fetchTracks(page, search, filterGenreId, filterArtistId, filterActive)
    } catch {
      setFormError('Failed to save. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (item: Track) => {
    if (!window.confirm(`Delete track "${item.title}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/music/tracks/${item.id}`)
      fetchTracks(page, search, filterGenreId, filterArtistId, filterActive)
    } catch {
      setError(`Failed to delete "${item.title}".`)
    }
  }

  return (
    <div>
      <div className="music-section__toolbar">
        <input
          type="search"
          className="music-section__search"
          placeholder="Search tracks..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <select
          className="music-section__filter"
          value={filterGenreId}
          onChange={(e) => handleFilterChange('genreId', e.target.value)}
        >
          <option value="">All genres</option>
          {allGenres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select
          className="music-section__filter"
          value={filterArtistId}
          onChange={(e) => handleFilterChange('artistId', e.target.value)}
        >
          <option value="">All artists</option>
          {allArtists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select
          className="music-section__filter"
          value={filterActive}
          onChange={(e) => handleFilterChange('active', e.target.value)}
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="music-section__add-btn" onClick={openAdd}>
          + Add track
        </button>
      </div>

      {error && <p className="music-section__error">{error}</p>}

      <div className="music-table-wrapper">
        <table className="music-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Genre</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Plays</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="music-table__skeleton-row">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><span className="skeleton" /></td>
                  ))}
                </tr>
              ))
            ) : tracks.length === 0 ? (
              <tr><td colSpan={8} className="music-table__empty">No tracks found.</td></tr>
            ) : (
              tracks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.artist.name}</td>
                  <td>{t.genre.name}</td>
                  <td className="music-table__date">{formatDuration(t.duration)}</td>
                  <td>
                    <span className={cn('music-badge', t.isActive ? 'music-badge--active' : 'music-badge--inactive')}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="music-table__num">{t.playCount}</td>
                  <td className="music-table__date">{formatDate(t.createdAt)}</td>
                  <td>
                    <div className="music-table__actions">
                      <button className="action-btn action-btn--edit" title="Edit" onClick={() => openEdit(t)}>✏️</button>
                      <button className="action-btn action-btn--delete" title="Delete" onClick={() => handleDelete(t)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="music-pagination">
          <button className="music-pagination__btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="music-pagination__info">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <button className="music-pagination__btn" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {modal.open && (
        <div className="music-modal-overlay" onClick={closeModal}>
          <div className="music-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="music-modal__title">{modal.item ? 'Edit track' : 'Add track'}</h3>
            <form onSubmit={handleSubmit} noValidate>
              {formError && <p className="music-modal__error">{formError}</p>}
              <div className="music-modal__group">
                <label className="music-modal__label" htmlFor="track-title">Title *</label>
                <input
                  id="track-title"
                  className="music-modal__input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Track title..."
                />
              </div>
              <div className="music-modal__group">
                <label className="music-modal__label" htmlFor="track-artist">Artist *</label>
                <select
                  id="track-artist"
                  className="music-modal__select"
                  value={form.artistId}
                  onChange={(e) => setForm((f) => ({ ...f, artistId: e.target.value }))}
                >
                  <option value="">Select artist...</option>
                  {allArtists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="music-modal__group">
                <label className="music-modal__label" htmlFor="track-genre">Genre *</label>
                <select
                  id="track-genre"
                  className="music-modal__select"
                  value={form.genreId}
                  onChange={(e) => setForm((f) => ({ ...f, genreId: e.target.value }))}
                >
                  <option value="">Select genre...</option>
                  {allGenres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="music-modal__group">
                <label className="music-modal__label" htmlFor="track-duration">Duration (seconds)</label>
                <input
                  id="track-duration"
                  type="number"
                  min={0}
                  className="music-modal__input"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g. 213"
                />
              </div>
              <div className="music-modal__group">
                <label className="music-modal__label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    style={{ marginRight: 8 }}
                  />
                  Active
                </label>
              </div>
              <div className="music-modal__actions">
                <button type="button" className="music-modal__cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="music-modal__submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (modal.item ? 'Save changes' : 'Add track')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
