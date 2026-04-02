import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-[#F5F5F5]">{children}</main>
      <Footer />
    </div>
  )
}
