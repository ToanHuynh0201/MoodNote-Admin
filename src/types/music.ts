import type { Pagination } from './user'

export interface Genre {
  id: string
  name: string
  description: string | null
  trackCount: number
  createdAt: string
}

export interface Artist {
  id: string
  name: string
  bio: string | null
  trackCount: number
  createdAt: string
}

export interface Track {
  id: string
  title: string
  artist: { id: string; name: string }
  genre: { id: string; name: string }
  duration: number | null
  isActive: boolean
  playCount: number
  createdAt: string
}

export interface GenresResponse {
  success: boolean
  message: string
  data: { items: Genre[]; pagination: Pagination }
}

export interface ArtistsResponse {
  success: boolean
  message: string
  data: { items: Artist[]; pagination: Pagination }
}

export interface TracksResponse {
  success: boolean
  message: string
  data: { items: Track[]; pagination: Pagination }
}
