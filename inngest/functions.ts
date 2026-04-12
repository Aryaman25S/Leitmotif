import { inngest } from './client'
import { runGenerationJob, type GenerationJobPayload } from '@/lib/generation/runGenerationJob'

export const processGeneration = inngest.createFunction(
  {
    id: 'process-stable-audio-generation',
    name: 'Stable Audio mock cue',
    triggers: [{ event: 'leitmotif/generation.requested' }],
  },
  async ({ event, step }) => {
    const data = event.data as GenerationJobPayload
    await step.run('generate-and-persist', async () => {
      await runGenerationJob(data)
    })
  }
)

export const inngestFunctions = [processGeneration]
