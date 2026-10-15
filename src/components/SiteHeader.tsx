// SiteHeader.tsx —— 顶部导航

import { NavLink, Link } from 'react-router'
import { Waypoints } from 'lucide-react'

const NAV = [
  { to: '/learn', label: '学习路径' },
  { to: '/lab', label: '实验室' },
  { to: '/compare', label: '对比赛跑' },
  { to: '/playground', label: '演算沙盒' },
]

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto max-w-[1200px] px-5 h-14 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
            <Waypoints size={16} />
          </span>
          <span className="font-bold text-[15px] tracking-tight text-slate-900">DSAViz</span>
          <span className="hidden sm:inline text-[11px] text-slate-400 mt-0.5">看得见的算法</span>
        </Link>
        <nav className="flex items-center gap-1 ml-2">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                  isActive ? 'text-indigo-700 bg-indigo-50 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                }`
              }>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
      </div>
    </header>
  )
}
