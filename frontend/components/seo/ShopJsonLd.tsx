import type { Mechanic } from '@/types';
import JsonLd from './JsonLd';
import {
  buildOpeningHoursSpec,
  buildAggregateRating,
  buildOfferCatalog,
  parseLocationToAddress,
} from '@/lib/seo-utils';

const SITE_URL = 'https://dreammechaniclab.com';

interface Props {
  mechanic: Mechanic;
  slug: string;
}

export default function ShopJsonLd({ mechanic, slug }: Props) {
  const { addressRegion, addressLocality } = parseLocationToAddress(mechanic.location);
  const openingHours = buildOpeningHoursSpec(mechanic.operatingHours);
  const aggregateRating = buildAggregateRating(mechanic.reviews);
  const offerCatalog = buildOfferCatalog(mechanic.specialties);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: mechanic.name,
    url: `${SITE_URL}/shop/${slug}`,
    telephone: mechanic.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: mechanic.address,
      addressLocality: addressLocality || addressRegion,
      addressRegion: addressRegion,
      addressCountry: 'KR',
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: '꿈꾸는정비사',
      url: SITE_URL,
    },
  };

  // 좌표
  if (mechanic.mapLat && mechanic.mapLng) {
    data.geo = {
      '@type': 'GeoCoordinates',
      latitude: mechanic.mapLat,
      longitude: mechanic.mapLng,
    };
  }

  // 대표 이미지
  if (mechanic.mainImageUrl) {
    data.image = mechanic.mainImageUrl;
  }

  // 영업시간
  if (openingHours) {
    data.openingHoursSpecification = openingHours;
  }

  // 리뷰 평점 (3개 이상)
  if (aggregateRating) {
    data.aggregateRating = aggregateRating;
  }

  // 서비스 카탈로그
  if (offerCatalog) {
    data.hasOfferCatalog = offerCatalog;
  }

  // 주차
  if (mechanic.parkingAvailable === true) {
    data.amenityFeature = {
      '@type': 'LocationFeatureSpecification',
      name: '주차',
      value: true,
    };
  }

  // 결제 수단
  if (mechanic.paymentMethods && mechanic.paymentMethods.length > 0) {
    data.paymentAccepted = mechanic.paymentMethods.join(', ');
  }

  return <JsonLd data={data} />;
}
