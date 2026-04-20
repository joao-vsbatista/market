'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, Package, Gavel, Settings, Archive } from 'lucide-react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Visão Geral',
    icon: User,
  },
  {
    href: '/dashboard/produtos',
    label: 'Meus Produtos',
    icon: Package,
  },
  {
    href: '/dashboard/lances',
    label: 'Meus Lances',
    icon: Gavel,
  },
  {
    href: '/dashboard/inventario',
    label: 'Meu Inventário',
    icon: Archive,
  },
  {
    href: '/dashboard/perfil',
    label: 'Editar Perfil',
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-row gap-2 overflow-x-auto pb-4 md:flex-col md:gap-1 md:pb-0">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
