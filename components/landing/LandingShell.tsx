import { Masthead } from './Masthead'
import { Hero } from './sections/Hero'
import { AtmosphereGrid } from './sections/AtmosphereGrid'
import { ThreeLanguages } from './sections/ThreeLanguages'
import { ComposerBrief } from './sections/ComposerBrief'
import { Workflow } from './sections/Workflow'
import { Manifesto } from './sections/Manifesto'
import { Audience } from './sections/Audience'
import { LandingFooter } from './LandingFooter'

export function LandingShell() {
  return (
    <>
      <Masthead />
      <main className="landing-main">
        <Hero />
        <AtmosphereGrid />
        <ThreeLanguages />
        <ComposerBrief />
        <Workflow />
        <Manifesto />
        <Audience />
      </main>
      <LandingFooter />
    </>
  )
}
