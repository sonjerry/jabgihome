import Navbar from '../components/Navbar'
import NavSpacer from '../components/NavSpacer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <NavSpacer />
      <main className="min-h-screen">{children}</main>
    </>
  )
}
