import { convertShortsUrl } from '@/utils/mapUtils';

interface Props {
  url: string;
}

export default function YouTubeEmbed({ url }: Props) {
  const embedUrl = convertShortsUrl(url);

  return (
    <div className="aspect-[9/16] max-w-sm mx-auto rounded-2xl overflow-hidden bg-gray-100">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
}
