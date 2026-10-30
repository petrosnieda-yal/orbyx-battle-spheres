import { useEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type ElementType, type ReactNode } from 'react'

export function RollText({ text }: { text: string }) {
  return (
    <span className="roll" aria-label={text}>
      {[...text].map((c, i) => {
        const ch = c === ' ' ? ' ' : c
        return (
          <span key={i} aria-hidden data-c={ch} style={{ '--i': i } as CSSProperties}>
            {ch}
          </span>
        )
      })}
    </span>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: 'primary' | 'ghost' | 'dark'
  size?: 'md' | 'sm'
}

export function Button({ label, variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  return (
    <button type="button" className={`btn btn--${variant} btn--${size} ${className}`} {...rest}>
      <RollText text={label} />
    </button>
  )
}

export function Tag({ text, align = 'left' }: { text: string; align?: 'left' | 'center' }) {
  const items = Array.from({ length: 4 }, (_, i) => (
    <span key={i} className="tag__item">
      {text}
      <i>—</i>
    </span>
  ))
  return (
    <div className={`tag tag--${align}`} aria-hidden>
      <div className="tag__track">
        {items}
        {items}
      </div>
    </div>
  )
}

let observer: IntersectionObserver | null = null
const getObserver = () => {
  if (!observer && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            observer!.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -10% 0px' },
    )
  }
  return observer
}

export function Reveal({
  as: El = 'div',
  className = '',
  delay = 0,
  children,
  ...rest
}: {
  as?: ElementType
  className?: string
  delay?: number
  children?: ReactNode
  [key: string]: unknown
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    const io = getObserver()
    if (!el || !io) return
    io.observe(el)
    return () => io.unobserve(el)
  }, [])
  return (
    <El ref={ref} className={`reveal ${className}`} style={{ '--d': `${delay}ms` } as CSSProperties} {...rest}>
      {children}
    </El>
  )
}

export function SplitWords({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`split ${className}`} aria-label={text}>
      {text.split(' ').map((word, w) => (
        <span key={w} className="split__word" aria-hidden>
          {[...word].map((c, i) => (
            <span key={i} className="split__char">
              {c}
            </span>
          ))}
        </span>
      ))}
    </span>
  )
}
