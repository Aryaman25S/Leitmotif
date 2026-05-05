import { FolioHead } from '../FolioHead'

interface Step {
  roman: string
  title: string
  body: string
  margin: string
}

const STEPS: readonly Step[] = [
  {
    roman: 'i.',
    title: 'The director tags the intent.',
    body: 'In the language of feeling. Pick an atmosphere, name the function, set the density. Or paste the sentence you said in the room. Either works.',
    margin: 'Vocabulary · 14 atmospheres',
  },
  {
    roman: 'ii.',
    title: 'The system compiles the spec.',
    body: 'Tempo, meter, harmonic character, register, dynamics, exclusions. A reference cue is rendered so the direction can be heard before a composer’s week is committed.',
    margin: 'Spec + reference cue',
  },
  {
    roman: 'iii.',
    title: 'The composer receives the brief.',
    body: 'A document, not a prompt. Printable. Margin-noted. Editable. Designed so the composer’s first response is to start writing, not to start translating.',
    margin: 'Brief · sent to composer',
  },
]

export function Workflow() {
  return (
    <section className="workflow" id="method">
      <div className="wrap">
        <FolioHead
          num="V"
          label="Method"
          title="Three movements, one handoff."
          meta="From spotting to score"
        />
      </div>

      <div className="wrap">
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step" key={s.roman}>
              <div className="roman">{s.roman}</div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
              <div className="marg">{s.margin}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
