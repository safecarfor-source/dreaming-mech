import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

@Injectable()
export class CacheService {
  private readonly cache: LRUCache<string, any>;
  private readonly defaultTTL = 60 * 1000; // 60초

  constructor() {
    this.cache = new LRUCache({
      max: 1000, // 최대 1000개 항목
      ttl: this.defaultTTL, // 기본 TTL 60초
      updateAgeOnGet: true, // 조회 시 age 갱신
      allowStale: false, // 만료된 항목 반환하지 않음
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get(key) || undefined;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.cache.set(key, value, { ttl });
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

  // 클릭 기록 (60초 TTL)
  async recordClick(mechanicId: number, ipAddress: string): Promise<void> {
    const key = `click:${mechanicId}:${ipAddress}`;
    await this.set(key, true, 60 * 1000); // 60초
  }
}
