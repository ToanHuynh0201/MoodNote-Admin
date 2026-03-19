import { useState } from 'react'
import GenresTab from './GenresTab'
import ArtistsTab from './ArtistsTab'
import TracksTab from './TracksTab'
import './MusicPage.css'

type Tab = 'genres' | 'artists' | 'tracks'

const TABS: { id: Tab; label: string }[] = [
  { id: 'genres', label: 'Genres' },
  { id: 'artists', label: 'Artists' },
  { id: 'tracks', label: 'Tracks' },
]

export default function MusicPage() {
  const [tab, setTab] = useState<Tab>('genres')

  return (
    <div className="music-page">
      <div className="music-page__header">
        <h2 className="music-page__title">Music</h2>
        <p className="music-page__subtitle">Manage genres, artists and tracks</p>
      </div>

      <div className="music-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`music-tab${tab === t.id ? ' music-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'genres' && <GenresTab />}
      {tab === 'artists' && <ArtistsTab />}
      {tab === 'tracks' && <TracksTab />}
    </div>
  )
}
