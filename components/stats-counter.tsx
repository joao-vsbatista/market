'use client'

import { useEffect, useState, useRef } from 'react'
import { Package, Users, Handshake } from 'lucide-react'

interface Stat {
  label: string
  value: number
  suffix?: string
  icon: React.ReactNode
}

function AnimatedNumber({ target }: { target: number }) {
  const [current, setCurrent] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1500
          const steps = 60
          const increment = target / steps
          let count = 0

          const timer = setInterval(() => {
            count += increment
            if (count >= target) {
              setCurrent(target)
              clearInterval(timer)
            } else {
              setCurrent(Math.floor(count))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{current.toLocaleString('pt-BR')}</span>
}

interface StatsCounterProps {
  products: number
  users: number
  deals: number
}

export function StatsCounter({ products, users, deals }: StatsCounterProps) {
  const stats: Stat[] = [
    {
      label: 'Produtos anunciados',
      value: products,
      icon: <Package className="h-6 w-6 text-primary" />,
      suffix: '+'
    },
    {
      label: 'Usuários cadastrados',
      value: users,
      icon: <Users className="h-6 w-6 text-primary" />,
      suffix: '+'
    },
    {
      label: 'Negociações realizadas',
      value: deals,
      icon: <Handshake className="h-6 w-6 text-primary" />,
      suffix: '+'
    },
  ]

  return (
    <section className="border-y border-border bg-primary/5 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {stat.icon}
              </div>
              <p className="text-4xl font-bold text-foreground">
                <AnimatedNumber target={stat.value} />
                {stat.suffix}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}