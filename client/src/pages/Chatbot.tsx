// Chatbot.tsx
// 전역 CSS 없이 동작하도록 구성

const RAW_URL = import.meta.env.VITE_CHATBOT_URL as string | undefined;

function normalizeUrl(u?: string | null) {
  if (!u) return null;
  const trimmed = u.trim();
  if (!trimmed) return null;
  // 프로토콜 없으면 http:// 자동 보정
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  return hasProtocol ? trimmed : `http://${trimmed}`;
}

export default function Chatbot() {
  const url = normalizeUrl(RAW_URL);
  const isDev = import.meta.env.DEV;

  return (
    <main
      // 사이드바가 fixed로 떠 있다면, 그 폭만큼만 밀어냅니다.
      // 전역 CSS 불필요. 필요 시 300px을 실제 사이드바 폭으로 바꾸세요.
      className="pt-24 ml-0 lg:ml-[300px]"
    >
      <div className="mx-auto w-full max-w-[2000px] px-3 md:px-6">
       
     

        <div className="grid items-stretch gap-4 md:gap-6 lg:grid-cols-5">
          <section
            className="glass relative overflow-hidden rounded-2xl lg:col-span-5"
            style={{ height: "80vh" }}
          >
            {url ? (
              <iframe
                key={url}               // URL 바뀌면 강제 리로드
                src={url}
                title="chatbot"
                className="absolute inset-0 h-full w-full"
                // 필요 시 보안/기능 제어 옵션:
                // sandbox="allow-scripts allow-forms allow-same-origin"
                // allow="clipboard-read; clipboard-write"
                // referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-cream/60">
                No Chatbot URL
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
