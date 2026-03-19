import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import api from '@/services/api'
import type { Artist, ArtistsResponse } from '@/types/music'
import type { Pagination } from '@/types/user'
import { formatDate } from '@/utils/format'

interface ModalState {
  open: boolean
  item: Artist | null
}

export default function ArtistsTab() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [modal, setModal] = useState<ModalState>({ open: false, item: null })
  const [formName, setFormName] = useState('')
  const [formBio, setFormBio] = useState('')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchArtists = async (currentPage: number, currentSearch: string) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: 20 }
      if (currentSearch) params.search = currentSearch
      const { data } = await api.get<ArtistsResponse>('/admin/music/artists', { params })
      setArtists(data.data.items)
      setPagination(data.data.pagination)
    } catch {
      setError('Failed to load artists.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArtists(page, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchArtists(1, value)
    }, 300)
  }

  const openAdd = () => {
    setFormName('')
    setFormBio('')
    setFormError('')
    setModal({ open: true, item: null })
  }

  const openEdit = (item: Artist) => {
    setFormName(item.name)
    setFormBio(item.bio ?? '')
    setFormError('')
    setModal({ open: true, item })
  }

  const closeModal = () => setModal({ open: false, item: null })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!formName.trim()) {
      setFormError('Name is required.')
      return
    }
    setFormLoading(true)
    const body = { name: formName.trim(), bio: formBio.trim() || null }
    try {
      if (modal.item) {
        await api.put(`/admin/music/artists/${modal.item.id}`, body)
      } else {
        await api.post('/admin/music/artists', body)
      }
      closeModal()
      fetchArtists(page, search)
    } catch {
      setFormError('Failed to save. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (item: Artist) => {
    if (!window.confirm(`Delete artist "${item.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/music/artists/${item.id}`)
      fetchArtists(page, search)
    } catch {
      setError(`Failed to delete "${item.name}".`)
    }
  }

  return (
    <div>
      <div className="music-section__toolbar">
        <input
          type="search"
          className="music-section__search"
          placeholder="Search artists..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <button className="music-section__add-btn" onClick={openAdd}>
          + Add artist
        </button>
      </div>

      {error && <p className="music-section__error">{error}</p>}

      <div className="music-table-wrapper">
        <table className="music-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Bio</th>
              <th>Tracks</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="music-table__skeleton-row">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j}><span className="skeleton" /></td>
                  ))}
                </tr>
              ))
            ) : artists.length === 0 ? (
              <tr><td colSpan={5} className="music-table__empty">No artists found.</td></tr>
            ) : (
              artists.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td className="music-table__desc">{a.bio ?? '—'}</td>
                  <td className="music-table__num">{a.trackCount}</td>
                  <td className="music-table__date">{formatDate(a.createdAt)}</td>
                  <td>
                    <div className="music-table__actions">
                      <button className="action-btn action-btn--edit" title="Edit" onClick={() => openEdit(a)}>✏️</button>
                      <button className="action-btn action-btn--delete" title="Delete" onClick={() => handleDelete(a)}>🗑️</button>
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
            <h3 className="music-modal__title">{modal.item ? 'Edit artist' : 'Add artist'}</h3>
            <form onSubmit={handleSubmit} noValidate>
              {formError && <p className="music-modal__error">{formError}</p>}
              <div className="music-modal__group">
                <label className="music-modal__label" htmlFor="artist-name">Name *</label>
                <input
                  id="artist-name"
                  className="music-modal__input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Artist name..."
                />
              </div>
              <div className="music-modal__group">
                <label className="music-modal__label" htmlFor="artist-bio">Bio</label>
                <textarea
                  id="artist-bio"
                  className="music-modal__textarea"
                  rows={3}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Optional bio..."
                />
              </div>
              <div className="music-modal__actions">
                <button type="button" className="music-modal__cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="music-modal__submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (modal.item ? 'Save changes' : 'Add artist')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
