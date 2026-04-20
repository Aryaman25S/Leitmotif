import { inngest } from './client'
import { runGenerationJob, type GenerationJobPayload } from '@/lib/generation/runGenerationJob'

export const processGeneration = inngest.createFunction(
  {
    id: 'process-generation',
    name: 'Generate mock cue',
    triggers: [{ event: 'leitmotif/generation.requested' }],
    /** Retry transient Stable / network failures (Inngest step-level). */
    retries: 3,
  },
  async ({ event, step }) => {
    const data = event.data as GenerationJobPayload
    await step.run('generate-and-persist', async () => {
      await runGenerationJob(data)
    })
  }
)

export const inngestFunctions = [processGeneration]
