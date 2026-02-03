import { validateAndGetYouTubeEmbedUrl } from '@/lib/youtube';

interface Props {
  url: string;
}

export default function YouTubeEmbed({ url }: Props) {
  // Validate and sanitize YouTube URL
  const embedUrl = validateAndGetYouTubeEmbedUrl(url);

  // Don't render if URL is invalid
  if (!embedUrl) {
    console.warn('Invalid YouTube URL provided:', url);
    return (
      <div className="aspect-[9/16] max-w-sm mx-auto rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-center px-4">
          유효하지 않은 YouTube URL입니다
        </p>
      </div>
    );
  }

  return (
    <div className="aspect-[9/16] max-w-sm mx-auto rounded-2xl overflow-hidden bg-gray-100">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
        // Security attributes
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    </div>
  );
}
