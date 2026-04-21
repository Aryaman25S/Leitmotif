'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Music2, ArrowRight } from 'lucide-react'

// ── Waveform bar generation (pre-computed, rounded to avoid hydration drift) ─
const BAR_COUNT = 56
const BARS: { height: number; delay: number; opacity: number }[] = (() => {
  const out = []
  for (let i = 0; i < BAR_COUNT; i++) {
    const t = i / (BAR_COUNT - 1)
    const center = Math.sin(t * Math.PI)
    const asymmetry = Math.sin(t * Math.PI * 1.3 + 0.5) * 0.3
    const raw = 0.15 + (center + asymmetry) * 0.42
    const height = Math.round(Math.max(0.08, Math.min(1, raw)) * 1000) / 1000
    const delay = Math.round(t * 2500) / 1000
    const opacity = Math.round((0.25 + center * 0.75) * 100) / 100
    out.push({ height, delay, opacity })
  }
  return out
})()

// ── Product mockup data ──────────────────────────────────────────────────────
const MOCK_CHIPS = [
  { label: 'Grief / Sorrow', active: true },
  { label: 'Nostalgia', active: true },
  { label: 'Intimacy', active: false },
  { label: 'Dread', active: false },
  { label: 'Wonder', active: false },
]

const MOCK_SPEC = [
  { key: 'Tempo', value: '66–72 BPM' },
  { key: 'Dynamics', value: 'pp → mp, no crescendo' },
  { key: 'Harmony', value: 'Minor modal, avoid resolution' },
  { key: 'Register', value: 'Low strings, close-mic breath' },
]

// ── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const prefersReduced = useReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const

  const heroChildVariants = prefersReduced
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
      }

  const scrollReveal = (delay = 0) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 32 } as const,
          whileInView: { opacity: 1, y: 0 } as const,
          viewport: { once: true, amount: 0.4 } as const,
          transition: { duration: 0.8, ease, delay },
        }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Grain overlay */}
      <div className="landing-grain" aria-hidden="true" />

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-background/60 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Music2 className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
            <span className="text-sm font-semibold tracking-wide">Leitmotif</span>
          </Link>
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-svh flex flex-col items-center justify-center overflow-hidden px-6">
        <div className="hero-orbs" aria-hidden="true">
          <div className="hero-orb-1" />
          <div className="hero-orb-2" />
          <div className="hero-orb-3" />
        </div>

        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: prefersReduced ? 0 : 0.15 },
            },
          }}
        >
          {/* Title */}
          <motion.h1
            variants={heroChildVariants}
            className="text-[clamp(3.5rem,12vw,11rem)] font-bold leading-[0.85] tracking-[0.06em] uppercase select-none"
          >
            <span className="bg-gradient-to-b from-foreground via-foreground/90 to-foreground/30 bg-clip-text text-transparent">
              Leitmotif
            </span>
          </motion.h1>

          {/* Waveform */}
          <motion.div
            variants={heroChildVariants}
            className="flex items-end justify-center gap-[2px] h-16 md:h-20 w-full max-w-md my-8 md:my-10"
            aria-hidden="true"
          >
            {BARS.map((bar, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-primary origin-bottom"
                style={{
                  height: `${bar.height * 100}%`,
                  opacity: bar.opacity,
                  transform: 'scaleY(0.3)',
                  animation: prefersReduced
                    ? 'none'
                    : `bar-pulse 2.8s ease-in-out ${bar.delay}s infinite`,
                }}
              />
            ))}
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={heroChildVariants}
            className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed mb-8"
          >
            Where directors and composers finally speak the same language.
          </motion.p>

          {/* CTA */}
          <motion.div variants={heroChildVariants}>
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'gap-2 text-sm px-6 h-11 bg-primary hover:bg-primary/90 shadow-[0_0_20px_-4px] shadow-primary/30 transition-shadow hover:shadow-[0_0_28px_-4px] hover:shadow-primary/40'
              )}
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Descriptor */}
          <motion.p
            variants={heroChildVariants}
            className="mt-5 text-xs font-mono text-muted-foreground/50 tracking-widest uppercase"
          >
            Film audio intent tool
          </motion.p>
        </motion.div>
      </section>

      {/* ── Tension ─────────────────────────────────────────────────── */}
      <section className="py-28 md:py-44 px-6">
        <div className="max-w-3xl mx-auto space-y-20 md:space-y-32">
          <motion.p
            {...scrollReveal()}
            className="text-2xl md:text-[2.75rem] md:leading-[1.15] font-medium tracking-tight"
          >
            You say{' '}
            <span className="text-primary">&ldquo;more dread.&rdquo;</span>{' '}
            They hear something different every time.
          </motion.p>

          <motion.p
            {...scrollReveal()}
            className="text-2xl md:text-[2.75rem] md:leading-[1.15] font-medium tracking-tight"
          >
            The temp track becomes the target.{' '}
            <span className="text-primary">The composer becomes a cover band.</span>
          </motion.p>

          <motion.p
            {...scrollReveal()}
            className="text-2xl md:text-[2.75rem] md:leading-[1.15] font-medium tracking-tight"
          >
            By the fifth revision,{' '}
            <span className="text-primary">nobody remembers</span>{' '}
            what the scene actually needed.
          </motion.p>
        </div>
      </section>

      {/* ── Product glimpse ─────────────────────────────────────────── */}
      <section className="py-20 md:py-32 px-6">
        <motion.div {...scrollReveal()} className="max-w-3xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-10 md:mb-14 tracking-wide">
            Leitmotif turns that gap into a workflow.
          </p>

          {/* Mock UI card */}
          <motion.div
            {...scrollReveal(0.15)}
            className="relative rounded-2xl border border-border/80 bg-card overflow-hidden shadow-[0_16px_64px_-16px] shadow-primary/10"
          >
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-border/60">
              <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
              <span className="ml-3 text-xs text-muted-foreground/60 font-mono">
                Scene 4A — Rooftop Goodbye
              </span>
            </div>

            <div className="p-5 md:p-7 space-y-6">
              {/* Emotion chips */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-3 font-medium">
                  Emotional atmosphere
                </p>
                <div className="flex flex-wrap gap-2">
                  {MOCK_CHIPS.map((chip) => (
                    <span
                      key={chip.label}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        chip.active
                          ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_-2px] shadow-primary/40'
                          : 'border-border/60 text-muted-foreground/40'
                      )}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mock player */}
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3 border border-border/40">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-primary ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-[38%] bg-primary rounded-full" />
                  </div>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground/50 tabular-nums shrink-0">
                  00:47 / 01:23
                </span>
              </div>

              {/* Musical spec */}
              <div className="border-l-2 border-l-primary/60 pl-4 space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-primary/60 font-medium mb-2">
                  Generated spec
                </p>
                {MOCK_SPEC.map((row) => (
                  <div key={row.key} className="text-xs flex gap-2">
                    <span className="text-muted-foreground/40 w-20 shrink-0 font-mono">{row.key}</span>
                    <span className="text-foreground/70">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="py-20 md:py-32 px-6 border-t border-border/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              visible: {
                transition: { staggerChildren: prefersReduced ? 0 : 0.1 },
              },
            }}
          >
            {[
              {
                num: '01',
                title: 'Tag the feeling',
                body: 'A vocabulary built for film. Not genre labels — emotional precision.',
              },
              {
                num: '02',
                title: 'Hear a reference',
                body: 'AI generates a mock cue from your intent. In seconds, not sessions.',
              },
              {
                num: '03',
                title: 'Send the brief',
                body: 'One link. Structured direction a composer can actually execute.',
              },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={heroChildVariants}
                className="space-y-2.5"
              >
                <span className="block text-4xl font-mono font-bold text-primary/15 select-none leading-none">
                  {step.num}
                </span>
                <h3 className="text-sm font-semibold tracking-tight">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Closing ─────────────────────────────────────────────────── */}
      <section className="py-32 md:py-48 px-6">
        <motion.div
          className="flex flex-col items-center text-center gap-8"
          {...scrollReveal()}
        >
          <p className="text-muted-foreground text-lg md:text-xl max-w-lg leading-relaxed">
            Built for the people who decide how cinema sounds.
          </p>

          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'gap-2 text-sm px-6 h-11 bg-primary hover:bg-primary/90 shadow-[0_0_20px_-4px] shadow-primary/30 transition-shadow hover:shadow-[0_0_28px_-4px] hover:shadow-primary/40'
            )}
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2 text-muted-foreground/20 mt-12 select-none">
            <Music2 className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase">Leitmotif</span>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
