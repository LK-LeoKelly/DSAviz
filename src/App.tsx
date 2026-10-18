import { Routes, Route, useLocation } from 'react-router'
import SiteHeader from './components/SiteHeader'
import AiTutor from './components/AiTutor'
import HomePage from './pages/HomePage'
import LearnPage from './pages/LearnPage'
import LessonPage from './pages/LessonPage'
import LabPage from './pages/LabPage'
import ComparePage from './pages/ComparePage'
import PlaygroundPage from './pages/PlaygroundPage'
import TourDriver from './tour/TourDriver'

export default function App() {
  const loc = useLocation()
  // 课堂页/沙盒页自己管理整屏高度，不用外层滚动容器
  const immersive = loc.pathname.startsWith('/lesson/') || loc.pathname.startsWith('/lab') || loc.pathname.startsWith('/playground')
  return (
    <div className={immersive ? 'h-screen flex flex-col bg-[#f6f7fb]' : 'min-h-screen bg-[#f6f7fb]'}>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="/lab/:algoId" element={<LabPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/compare/:left/:right" element={<ComparePage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/tour" element={<div className="h-screen" />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <AiTutor />
      <TourDriver />
    </div>
  )
}
