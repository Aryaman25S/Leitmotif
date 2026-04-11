'use client'

import { useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface SceneTabsProps {
  intentContent: React.ReactNode
  commentsContent: React.ReactNode
  commentCount: number
}

const TAB_ITEMS = [
  { value: 'intent', label: 'Intent & Spec' },
  { value: 'comments', label: 'Comments' },
] as const

export default function SceneTabs({ intentContent, commentsContent, commentCount }: SceneTabsProps) {
  const [active, setActive] = useState<string>('intent')

  return (
    <Tabs value={active} onValueChange={setActive} className="w-full">
      <LayoutGroup>
        <div className="relative flex border-b border-border mb-5">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={cn(
                'relative px-4 pb-2.5 pt-1 text-sm font-medium transition-colors',
                active === tab.value
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/70'
              )}
            >
              {tab.value === 'comments' && commentCount > 0
                ? `${tab.label} (${commentCount})`
                : tab.label}
              {active === tab.value && (
                <motion.div
                  layoutId="scene-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </LayoutGroup>

      <TabsContent value="intent">
        {intentContent}
      </TabsContent>

      <TabsContent value="comments">
        {commentsContent}
      </TabsContent>
    </Tabs>
  )
}
