import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Workflow,
  Layers,
  Play,
  FileText,
  LogOut,
  BookOpen,
  Brain,
  Users,
  UserCheck,
  Settings,
  Shield,
  ChevronDown
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

const mainNavigation = [
  { name: 'SOP 文档库', path: '/sop-library', icon: BookOpen },
  { name: '应急场景', path: '/scenarios', icon: Play },
  { name: '工作流管理', path: '/workflows', icon: Workflow },
  { name: '模块管理', path: '/modules', icon: Box },
  { name: '执行日志', path: '/logs', icon: FileText },
  { name: 'AI配置', path: '/ai-config', icon: Brain },
]

const adminNavigation = [
  { name: '用户管理', path: '/admin/users', icon: Users },
  { name: '账号审批', path: '/admin/approvals', icon: UserCheck },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userProfile, isAdmin, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
            <Layers className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">运维中心</h1>
              <p className="text-xs text-gray-500">应急工作流平台</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {/* 主导航 */}
            {mainNavigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}

            {/* 管理员导航 */}
            {isAdmin() && (
              <>
                <div className="pt-4 pb-2 px-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">管理员</p>
                </div>
                {adminNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname.startsWith(item.path)

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isActive
                          ? 'bg-red-50 text-red-700'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          <div className="border-t border-gray-200 p-4">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 px-3 py-2 mb-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  userProfile?.role === 'admin' || userProfile?.role === 'super_admin'
                    ? 'bg-red-100 text-red-600'
                    : userProfile?.role === 'read_write'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userProfile?.role === 'admin' || userProfile?.role === 'super_admin'
                      ? '超级管理员'
                      : userProfile?.role === 'read_write'
                      ? '读写权限'
                      : '只读权限'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    个人设置
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleSignOut()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
