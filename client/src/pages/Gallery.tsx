import React from "react";

const Gallery: React.FC = () => {
  // gallery 폴더의 이미지 전부 가져오기
  const images = import.meta.glob("../assets/gallery/*.{jpg,jpeg,png}", {
    eager: true,
    import: "default",
  }) as Record<string, string>;

  // 이미지 URL 배열
  const imageList = Object.values(images);

  return (
    // 사이드바 폭만큼 왼쪽 패딩 추가: 모바일(pl-20), 데스크톱(md:pl-64)
    <div className="min-h-screen bg-gradient-to-b from-sky-900 to-sky-950 pl-20 md:pl-80 p-7">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">
        갤러리
      </h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {imageList.map((src, idx) => (
          <div
            key={idx}
            className="overflow-hidden rounded-lg shadow-lg hover:scale-105 transform transition duration-300"
          >
            <img
              src={src}
              alt={`Gallery ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
