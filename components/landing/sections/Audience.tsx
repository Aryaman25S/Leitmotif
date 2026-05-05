import { FolioHead } from '../FolioHead'

export function Audience() {
  return (
    <section className="audience" id="address">
      <div className="wrap">
        <FolioHead
          num="VII"
          label="Address"
          title="Two readers, one document."
          meta="Editorial"
        />
      </div>
      <div className="wrap">
        <div className="audience-body">
          <div className="audience-col">
            <div className="head">
              <span className="smallcaps">For directors</span>
            </div>
            <h3>Say what you actually mean.</h3>
            <div className="body">
              <p>
                Leitmotif gives you a vocabulary that travels. The sentence you say becomes a brief
                they can act on, with a reference cue you can both <em>hear</em> together. The
                conversation that used to happen two weeks late, in a re-record, happens now — with
                the room, the chair, and the light still in front of you.
              </p>
            </div>
            <div className="sig">— addressed to directors and showrunners</div>
          </div>

          <div className="audience-col">
            <div className="head">
              <span className="smallcaps">For composers</span>
            </div>
            <h3>A brief that respects your hands.</h3>
            <div className="body">
              <p>
                The reference cue is a sketch, and we say so. The exclusions are the director’s,
                not ours. The musical decisions are <em>yours</em>. What you build above the brief
                is what gets recorded, and the brief is designed to make sure the first thing you
                do is reach for the staff paper, not the email reply.
              </p>
            </div>
            <div className="sig">— addressed to composers and music supervisors</div>
          </div>
        </div>
      </div>
    </section>
  )
}
