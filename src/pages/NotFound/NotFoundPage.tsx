import { useNavigate } from 'react-router-dom'
import './NotFoundPage.css'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="not-found">
      <p className="not-found__code">404</p>
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__message">
        The page you are looking for does not exist or has been moved.
      </p>
      <button className="not-found__btn" onClick={() => navigate('/')}>
        Go back home
      </button>
    </div>
  )
}
