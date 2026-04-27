import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, ShoppingCart, Users, Package, Settings, LogOut, 
  BarChart3, ChevronLeft, ChevronRight, Menu, X, Sun, Moon, DollarSign
} from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/themeStore'
import { useNavStore } from '../store/navStore'
import { formatImageUrl } from '../lib/utils'
import NotificationBell from './NotificationBell'
import ToastContainer from './ToastContainer'
import { apiClient } from '../lib/api'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { tenant, user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { isCollapsed, toggleCollapsed } = useNavStore()
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (e) {}
    logout()
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS (Kasir)', href: '/dashboard/pos', icon: ShoppingCart },
    { name: 'Inventori', href: '/dashboard/inventory', icon: Package },
    { name: 'Keuangan', href: '/dashboard/finance', icon: DollarSign, roles: ['owner', 'manager'] },
    { name: 'Laporan', href: '/dashboard/reports', icon: BarChart3, roles: ['owner', 'manager'] },
    { name: 'Pelanggan', href: '/dashboard/customers', icon: Users },
    { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, roles: ['owner', 'manager'] },
  ].filter(item => !item.roles || (user?.role && item.roles.includes(user.role.toLowerCase())))

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:z-0
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} 
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
        w-64 border-r border-slate-800
      `}>
        {/* Toggle Button Desktop */}
        <button 
          onClick={toggleCollapsed}
          className="hidden lg:flex absolute -right-3 top-10 bg-primary text-primary-foreground p-1 rounded-full border-2 border-slate-900 hover:scale-110 transition-all z-50 shadow-lg shadow-primary/20"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`h-20 flex items-center bg-slate-950/50 gap-3 transition-all duration-300 relative ${isCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
             <div className={`rounded-xl bg-transparent overflow-hidden flex-shrink-0 flex items-center justify-center transition-all ${isCollapsed ? 'h-10 w-10' : 'h-12 w-40'}`}>
                <img 
                  src={isCollapsed ? "/logo.png" : "/lakoo.png"} 
                  alt="Lakoo System Logo" 
                  className={`object-contain transition-all duration-300 ${isCollapsed ? 'h-8 w-8' : 'h-10 w-full'}`}
                />
             </div>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="px-4 py-6 border-b border-slate-800 animate-in fade-in duration-300 bg-slate-900/50">
            <div className="flex items-center gap-3">
              {tenant?.logo_url ? (
                <div className="h-10 w-10 rounded-lg bg-white/10 p-1 flex-shrink-0">
                   <img src={formatImageUrl(tenant.logo_url)} alt="Store" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                   {tenant?.name?.charAt(0) || 'L'}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-[0.1em] mb-0.5">Active Store</div>
                <div className="font-bold truncate text-white text-sm">{tenant?.name || 'Toko Demo'}</div>
                <div className="text-[10px] text-slate-400 capitalize font-medium">{user?.role}</div>
              </div>
            </div>
          </div>
        )}

        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.name : ''}
                className={`flex items-center rounded-xl transition-all duration-200 group relative ${
                  isCollapsed ? 'justify-center p-2' : 'px-3 py-2.5'
                } ${
                  isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'text-slate-400 group-hover:text-white'}`} />
                {!isCollapsed && (
                  <span className="font-bold text-sm animate-in fade-in slide-in-from-left-1 duration-200">{item.name}</span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className={`p-4 border-t border-slate-800 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button 
            onClick={handleLogout}
            title={isCollapsed ? 'Sign Out' : ''}
            className={`flex items-center text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-red-400 rounded-xl transition-all group ${
              isCollapsed ? 'p-2' : 'w-full px-3 py-2.5'
            }`}
          >
            <LogOut className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-slate-400 group-hover:text-red-400 transition-colors`} />
            {!isCollapsed && <span className="animate-in fade-in duration-200">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg lg:text-xl font-bold text-foreground capitalize tracking-tight">
               {location.pathname.split('/').pop() || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-3 lg:space-x-5">
             {/* Theme Toggle Button */}
             <button 
               onClick={toggleTheme}
               className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:scale-110 transition-all border border-border shadow-sm group"
               title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
             >
                {theme === 'light' ? (
                  <Moon size={20} className="transition-transform group-rotate-12" />
                ) : (
                  <Sun size={20} className="transition-transform group-rotate-45" />
                )}
             </button>

             <NotificationBell />

             {user?.role?.toLowerCase() === 'cashier' ? (
               <div className="flex items-center px-3 py-1.5 bg-secondary border border-border rounded-2xl shadow-sm">
                  <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xs lg:text-sm shadow-md shadow-primary/20">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col ml-3 text-left">
                    <span className="text-[11px] lg:text-xs font-bold text-foreground leading-none">{user?.name}</span>
                    <span className="text-[9px] text-muted-foreground leading-none mt-1 uppercase font-black tracking-wider">{user?.role}</span>
                  </div>
               </div>
             ) : (
               <Link to="/dashboard/settings" className="flex items-center px-3 py-1.5 bg-secondary border border-border rounded-2xl shadow-sm hover:bg-muted/50 transition-colors group cursor-pointer">
                  <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xs lg:text-sm shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col ml-3 text-left">
                    <span className="text-[11px] lg:text-xs font-bold text-foreground leading-none group-hover:text-primary transition-colors">{user?.name}</span>
                    <span className="text-[9px] text-muted-foreground leading-none mt-1 uppercase font-black tracking-wider">{user?.role}</span>
                  </div>
               </Link>
             )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
