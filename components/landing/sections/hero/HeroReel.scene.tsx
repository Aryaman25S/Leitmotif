'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildFilmTexture } from './film-texture'
import { buildFrameTexture } from './frame-textures'
import { FRAMES, type FrameDef } from './frames'
import {
  bezier,
  type BezierPts,
  DEMO_DELAY,
  DEMO_HOLD,
  FWD_BEZIER,
  FWD_DUR,
  REV_BEZIER,
  REV_DUR,
  timecodeForPos,
} from './scrub'

// PHASE 4 — scrub controller.
// Group rotation is now driven by a cubic-bezier sweep of a position in
// frame-space (0..5). Forward sweep (1.5s) and reverse (1.0s) match the
// original prototype's curves. The same eased value drives the timecode
// readout below the strip — rAF-equivalent updates happen inside R3F's
// useFrame so they're synchronized to the renderer's clock.
//
// Hover whips forward, mouseleave rewinds, click toggles, auto-demo runs
// once after a 2s pause unless the user has interacted first.

const CYL_RADIUS = 4.0
const CYL_HEIGHT = 1.6
const RAIL_FRACTION = 0.14
const CAMERA_Z = 7.0
const CAMERA_FOV = 32 // vertical, in degrees
const RADIAL_SEGMENTS = 96
const FRAME_COUNT = 6

const SLOT_HEIGHT = CYL_HEIGHT * (1 - RAIL_FRACTION * 2)
const SEG_ARC = (Math.PI * 2) / FRAME_COUNT
const ARC_OFFSET = 0.005
const ARC_SEGMENTS = 24

type ScrubState = 'at-start' | 'sweeping-fwd' | 'at-end' | 'sweeping-rev'

interface ScrubData {
  state: ScrubState
  pos: number // current visual position, 0..5
  sweepStart: number
  sweepDur: number
  sweepFrom: number
  sweepTo: number
  sweepBezier: BezierPts
}

function FrameArc({ frame, index }: { frame: FrameDef; index: number }) {
  const { gl } = useThree()
  // Frame 0 centered at theta = 0 (front, +Z). Subsequent frames go
  // counter-clockwise viewed from above (positive theta). Combined with the
  // negative group rotation in useFrame, this scrolls the strip right-to-left
  // past the camera in numerical order f0 → f1 → … → f5.
  const thetaStart = index * SEG_ARC - SEG_ARC / 2

  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        CYL_RADIUS + ARC_OFFSET,
        CYL_RADIUS + ARC_OFFSET,
        SLOT_HEIGHT,
        ARC_SEGMENTS,
        1,
        true,
        thetaStart,
        SEG_ARC,
      ),
    [thetaStart],
  )

  const texture = useMemo(() => {
    const tex = buildFrameTexture(frame)
    tex.anisotropy = gl.capabilities.getMaxAnisotropy()
    return tex
  }, [frame, gl])

  useEffect(() => {
    return () => {
      geometry.dispose()
      texture.dispose()
    }
  }, [geometry, texture])

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        map={texture}
        side={THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  )
}

function Reel({
  scrubRef,
}: {
  scrubRef: React.RefObject<ScrubData>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { gl } = useThree()
  const lastTimecodeRef = useRef<string>('')

  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        CYL_RADIUS,
        CYL_RADIUS,
        CYL_HEIGHT,
        RADIAL_SEGMENTS,
        1,
        true,
      ),
    [],
  )

  const texture = useMemo(() => {
    const tex = buildFilmTexture({
      railFraction: RAIL_FRACTION,
      perfCount: 48,
      perfWidthFraction: 0.4,
      perfHeightFraction: 0.5,
    })
    tex.anisotropy = gl.capabilities.getMaxAnisotropy()
    return tex
  }, [gl])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide,
        transparent: true,
        alphaTest: 0.5,
      }),
    [texture],
  )

  // Each frame: evaluate the active sweep (if any), apply rotation, sync timecode.
  useFrame(() => {
    const s = scrubRef.current
    if (!s || !groupRef.current) return

    let pos = s.pos
    if (s.state === 'sweeping-fwd' || s.state === 'sweeping-rev') {
      const elapsed = performance.now() - s.sweepStart
      const t = Math.min(1, elapsed / s.sweepDur)
      const eased = bezier(t, ...s.sweepBezier)
      pos = s.sweepFrom + (s.sweepTo - s.sweepFrom) * eased
      s.pos = pos
      if (t >= 1) {
        s.state = s.sweepTo === 5 ? 'at-end' : 'at-start'
        s.pos = s.sweepTo
        pos = s.sweepTo
      }
    }

    // Negative rotation: positive `pos` brings each frame to the front in
    // order, while the strip's apparent motion is right-to-left.
    groupRef.current.rotation.y = -pos * SEG_ARC

    // Update timecode badge (DOM element rendered by Hero.tsx). Skip the
    // write when the formatted string hasn't changed — textContent writes
    // are cheap but this avoids unnecessary layout work each frame.
    const next = timecodeForPos(pos)
    if (next !== lastTimecodeRef.current) {
      const tcEl = document.getElementById('timecode-display')
      if (tcEl) tcEl.textContent = next
      lastTimecodeRef.current = next
    }
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={material} />
      {FRAMES.map((frame, i) => (
        <FrameArc key={frame.id} frame={frame} index={i} />
      ))}
    </group>
  )
}

export function HeroReelScene() {
  const scrubRef = useRef<ScrubData>({
    state: 'at-start',
    pos: 0,
    sweepStart: 0,
    sweepDur: FWD_DUR,
    sweepFrom: 0,
    sweepTo: 0,
    sweepBezier: FWD_BEZIER,
  })

  // Wire DOM-level interaction on the .stage wrapper. Pointer events on the
  // canvas itself only fire when something's intersecting the cursor's ray;
  // we want hover anywhere over the whole stage area, including the empty
  // page-bg around the cylinder.
  useEffect(() => {
    const stage = document.querySelector(
      '.leitmotif-world .hero .stage',
    ) as HTMLElement | null
    if (!stage) return

    const startSweep = (toPos: number, dur: number, bez: BezierPts) => {
      const s = scrubRef.current
      // Snapshot current visual pos so a mid-sweep direction change picks up
      // smoothly from where we are, not from the previous endpoint.
      let curPos = s.pos
      if (s.state === 'sweeping-fwd' || s.state === 'sweeping-rev') {
        const elapsed = performance.now() - s.sweepStart
        const t = Math.min(1, elapsed / s.sweepDur)
        const eased = bezier(t, ...s.sweepBezier)
        curPos = s.sweepFrom + (s.sweepTo - s.sweepFrom) * eased
      }
      s.sweepFrom = curPos
      s.sweepTo = toPos
      s.sweepDur = dur
      s.sweepBezier = bez
      s.sweepStart = performance.now()
      s.state = toPos === 5 ? 'sweeping-fwd' : 'sweeping-rev'
    }

    const playForward = () => {
      const s = scrubRef.current
      if (s.state === 'at-end' || s.state === 'sweeping-fwd') return
      startSweep(5, FWD_DUR, FWD_BEZIER)
    }
    const playReverse = () => {
      const s = scrubRef.current
      if (s.state === 'at-start' || s.state === 'sweeping-rev') return
      startSweep(0, REV_DUR, REV_BEZIER)
    }

    let interacted = false
    let demoT2: ReturnType<typeof setTimeout> | undefined

    const onEnter = () => {
      interacted = true
      clearTimeout(demoT1)
      if (demoT2) clearTimeout(demoT2)
      playForward()
    }
    const onLeave = () => {
      playReverse()
    }
    const onClick = () => {
      interacted = true
      clearTimeout(demoT1)
      if (demoT2) clearTimeout(demoT2)
      const s = scrubRef.current
      if (s.state === 'at-start' || s.state === 'sweeping-rev') playForward()
      else playReverse()
    }

    stage.addEventListener('mouseenter', onEnter)
    stage.addEventListener('mouseleave', onLeave)
    stage.addEventListener('click', onClick)

    // Auto-demo: forward sweep, hold the spec, rewind. Cancelled if the
    // user hovers / clicks before it fires.
    const demoT1 = setTimeout(() => {
      if (interacted) return
      playForward()
      demoT2 = setTimeout(() => {
        if (interacted) return
        playReverse()
      }, FWD_DUR + DEMO_HOLD)
    }, DEMO_DELAY)

    return () => {
      stage.removeEventListener('mouseenter', onEnter)
      stage.removeEventListener('mouseleave', onLeave)
      stage.removeEventListener('click', onClick)
      clearTimeout(demoT1)
      if (demoT2) clearTimeout(demoT2)
    }
  }, [])

  return (
    <Canvas
      className="hero-reel-canvas"
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Reel scrubRef={scrubRef} />
    </Canvas>
  )
}

export default HeroReelScene
