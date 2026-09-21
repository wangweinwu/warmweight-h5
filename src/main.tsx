import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'
import Shell from '@/components/Shell'
import { ToastHost } from '@/components/Widgets'
import Onboarding from '@/pages/Onboarding'
import Auth from '@/pages/Auth'
import ProfileSetup from '@/pages/ProfileSetup'
import Home from '@/pages/Home'
import Track from '@/pages/Track'
import Plan from '@/pages/Plan'
import Gallery from '@/pages/Gallery'
import Foods from '@/pages/Foods'
import Sports from '@/pages/Sports'
import Mine from '@/pages/Mine'
import About from '@/pages/About'
import '@/styles/tokens.css'

function RootRedirect() {
  const onboarded = useApp((s) => s.onboarded)
  const me = useApp((s) => s.me())
  if (!onboarded) return <Navigate to="/onboarding" replace />
  if (!me) return <Navigate to="/auth" replace />
  return <Navigate to="/home" replace />
}

function App() {
  /* 主题初始化 */
  const theme = useApp((s) => s.theme)
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme

  return (
    <HashRouter>
      <ToastHost />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route element={<Shell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/track" element={<Track />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/foods" element={<Foods />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/mine" element={<Mine />} />
          <Route path="/about" element={<About />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
