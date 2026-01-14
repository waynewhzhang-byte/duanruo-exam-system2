/**
 * Role-based navigation component
 * Renders navigation menu based on user's role
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronDown, User, LogOut, Bell, Settings } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useTenant } from '@/hooks/useTenant'
import { useAuth } from '@/contexts/AuthContext'
import { getNavigationForRole, getRoleLabel } from '@/config/navigation'

export default function RoleBasedNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { getPrimaryRole } = usePermissions()
  const { tenant } = useTenant()

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  if (!isMounted || !user) {
    return null
  }

  const primaryRole = getPrimaryRole()
  const navigation = getNavigationForRole(primaryRole || 'CANDIDATE', tenant?.slug)

  const handleSignOut = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={primaryRole === 'SUPER_ADMIN' ? '/super-admin/tenants' : `/${tenant?.slug || 'default'}/exams`}
              className="text-xl font-bold text-gray-900 hover:text-primary transition-colors"
            >
              考试报名系统
            </Link>
            {tenant && primaryRole !== 'SUPER_ADMIN' && (
              <Badge variant="outline" className="ml-3">
                {tenant.name}
              </Badge>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Primary Navigation Items */}
            {navigation.primary.map((item) => (
              item.children && item.children.length > 0 ? (
                // Dropdown menu for items with children
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'flex items-center gap-1',
                        pathname.startsWith(item.href) && 'bg-accent'
                      )}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.label}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link href={child.href} className="flex items-center gap-2">
                          {child.icon && <child.icon className="h-4 w-4" />}
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Regular link for items without children
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'flex items-center gap-2',
                      pathname === item.href && 'bg-accent'
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                    {item.badge && (
                      <Badge variant="destructive" className="ml-1">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )
            ))}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{user.fullName || user.username}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.fullName || user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {primaryRole && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        {getRoleLabel(primaryRole)}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Secondary Navigation Items */}
                {navigation.secondary && navigation.secondary.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}

                {navigation.secondary && <DropdownMenuSeparator />}

                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* User Info */}
            <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">{user.fullName || user.username}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {primaryRole && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {getRoleLabel(primaryRole)}
                </Badge>
              )}
            </div>

            {/* Primary Navigation */}
            {navigation.primary.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                  {item.badge && (
                    <Badge variant="destructive" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
                {/* Show children in mobile menu */}
                {item.children && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100"
                      >
                        {child.icon && <child.icon className="h-3 w-3" />}
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Secondary Navigation */}
            {navigation.secondary && navigation.secondary.length > 0 && (
              <>
                <div className="border-t my-2" />
                {navigation.secondary.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                ))}
              </>
            )}

            {/* Sign Out */}
            <div className="border-t my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
