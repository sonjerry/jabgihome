export default function NavSpacer() {
  // 전역 헤더 높이(6rem = top-24)만큼 빈 공간 확보
  return <div className="h-24 lg:h-0" aria-hidden="true" />;
}
