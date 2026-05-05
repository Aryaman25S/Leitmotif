import type { Metadata } from 'next'
import { Geist, Geist_Mono, Cormorant_Garamond, Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

// App shell type system (existing).
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

// Editorial type system. Variables are exposed on <body> for every route so
// any component can opt into editorial type via font-family: var(--font-cormorant)
// etc. without dragging in the .leitmotif-world scope. @font-face declarations
// are generated globally; actual font files only download when a CSS rule
// references the variable and uses it as font-family.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Leitmotif — Film scoring intent',
  description: 'Translate directorial intent into actionable music direction.',
}

// Resolves the active landing "world" from ?world= query, then localStorage,
// then defaults to theater. Runs before paint as the first child of <body>
// so the wrapper styles never flash.
const worldNoFlashScript = `(function(){try{var w='theater';var q=new URL(location.href).searchParams.get('world');var s=localStorage.getItem('leitmotif:world');if(q==='theater'||q==='faded'||q==='archive'||q==='print'){w=q;}else if(s==='theater'||s==='faded'||s==='archive'||s==='print'){w=s;}document.documentElement.setAttribute('data-world',w);}catch(e){document.documentElement.setAttribute('data-world','theater');}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-world="theater" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <script dangerouslySetInnerHTML={{ __html: worldNoFlashScript }} />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
