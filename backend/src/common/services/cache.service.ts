import { Injectable } from '@nestjs/common';

interface CacheItem<T> {
  value: T;
  expiry: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 10 * 1000; // 10초
  private readonly maxItems = 1000;

  async get<T>(key: string): Promise<T | undefined> {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // 만료 확인
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxItems) {
      // 가장 오래된 항목 삭제
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async reset(): Promise<void> {
    this.cache.clear();
  }

  // 중복 클릭 체크 (IP + mechanicId 조합)
  async checkDuplicateClick(
    mechanicId: number,
    ipAddress: string,
  ): Promise<boolean> {
    const key = `click:${mechanicId}:${ipAddress}`;
    const exists = await this.get<boolean>(key);
    return !!exists;
  }

  // 클릭 기록 (10초 TTL)
  async recordClick(mechanicId: number, ipAddress: string): Promise<void> {
    const key = `click:${mechanicId}:${ipAddress}`;
    await this.set(key, true, 10 * 1000); // 10초
  }
}
