import GlassCard from "../components/GlassCard"

export default function Stream() {
  return (
    <main className="relative min-h-screen px-4 py-6">
      <GlassCard>
        <h1 className="text-2xl font-bold mb-4">실시간 스트리밍</h1>
        <iframe
          src="https://haribo127.iptime.org/cam"
          className="w-full aspect-video rounded-xl"
          allow="autoplay; fullscreen; picture-in-picture"
        />
      </GlassCard>
    </main>
  )
}
