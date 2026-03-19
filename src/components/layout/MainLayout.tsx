import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import './MainLayout.css'

export default function MainLayout() {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-layout__body">
        <Header />
        <main className="main-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
