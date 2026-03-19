import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import api from '@/services/api'
import type { Genre, GenresResponse } from '@/types/music'
import type { Pagination } from '@/types/user'
import { formatDate } from '@/utils/format'

interface ModalState {
  open: boolean
  item: Genre | null
}

export default function GenresTab() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [modal, setModal] = useState<ModalState>({ open: false, item: null })
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchGenres = async (currentPage: number, currentSearch: string) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: 20 }
      if (currentSearch) params.search = currentSearch
      const { data } = await api.get<GenresResponse>('/admin/music/genres', { params })
      setGenres(data.data.items)
      setPagination(data.data.pagination)
    } catch {
      setError('Failed to load genres.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGenres(page, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchGenres(1, value)
    }, 300)
  }

  const openAdd = () => {
    setFormName('')
    setFormDesc('')
    setFormError('')
    setModal({ open: true, item: null })
  }

  const openEdit = (item: Genre) => {
    setFormName(item.name)
    setFormDesc(item.description ?? '')
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
    const body = { name: formName.trim(), description: formDesc.trim() || null }
    try {
      if (modal.item) {
        await api.put(`/admin/music/genres/${modal.item.id}`, body)
      } else {
        await api.post('/admin/music/genres', body)
      }
      closeModal()
      fetchGenres(page, search)
    } catch {
      setFormError('Failed to save. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (item: Genre) => {
    if (!window.confirm(`Delete genre "${item.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/music/genres/${item.id}`)
      fetchGenres(page, search)
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
          placeholder="Search genres..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <button className="music-section__add-btn" onClick={openAdd}>
          + Add genre
        </button>
      </div>

      {error && <p className="music-section__error">{error}</p>}

      <div className="music-table-wrapper">
        <table className="music-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
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
            ) : genres.length === 0 ? (
              <tr><td colSpan={5} className="music-table__empty">No genres found.</td></tr>
            ) : (
              genres.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td className="music-table__desc">{g.description ?? '—'}</td>
                  <td className="music-table__num">{g.trackCount}</td>
                  <td className="music-table__date">{formatDate(g.createdAt)}</td>
                  <td>
                    <div className="music-table__actions">
                      <button className="action-btn action-btn--edit" title="Edit" onClick={() => openEdit(g)}>✏️</button>
                      <button className="action-btn action-btn--delete" title="Delete" onClick={() => handleDelete(g)}>🗑️</button>
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
            <h3 className="music-modal__title">{modal.item ? 'Edit genre' : 'Add genre'}</h3>
            <form onSubmit={handleSubmit} noValidate>
              {formError && <p className="music-modal__error">{formError}</p>}
              <div className="music-modal__group">
                <label className="music-modal__label" htmlFor="genre-name">Name *</label>
                <input
                  id="genre-name"
                  className="music-modal__input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Pop, Rock..."
                />
              </div>
              <div className="music-modal__group">
                <label className="music-modal__label" htmlFor="genre-desc">Description</label>
                <textarea
                  id="genre-desc"
                  className="music-modal__textarea"
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Optional description..."
                />
              </div>
              <div className="music-modal__actions">
                <button type="button" className="music-modal__cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="music-modal__submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (modal.item ? 'Save changes' : 'Add genre')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
