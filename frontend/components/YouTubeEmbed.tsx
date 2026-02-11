import { validateAndGetYouTubeEmbedUrl } from '@/lib/youtube';

interface Props {
  url: string;
  variant?: 'short' | 'long';
}

export default function YouTubeEmbed({ url, variant = 'short' }: Props) {
  // Validate and sanitize YouTube URL
  const embedUrl = validateAndGetYouTubeEmbedUrl(url);

  // Don't render if URL is invalid
  if (!embedUrl) {
    console.warn('Invalid YouTube URL provided:', url);
    const errorClass = variant === 'long'
      ? 'aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center'
      : 'aspect-[9/16] max-w-sm mx-auto rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center';
    return (
      <div className={errorClass}>
        <p className="text-gray-500 text-center px-4">
          유효하지 않은 YouTube URL입니다
        </p>
      </div>
    );
  }

  if (variant === 'long') {
    // 롱폼: 가로 16:9 비율
    return (
      <div className="aspect-video w-full md:w-1/2 mx-auto rounded-2xl overflow-hidden bg-gray-100">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
    );
  }

  // 숏폼: 세로 9:16 비율
  return (
    <div className="aspect-[9/16] max-w-sm mx-auto rounded-2xl overflow-hidden bg-gray-100">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube short"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    </div>
  );
}
