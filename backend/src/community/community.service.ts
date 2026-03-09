import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // ── 게시글 목록 ──

  async getPosts(params: { category?: string; page?: number; limit?: number; sort?: string }) {
    const { category, page = 1, limit = 20, sort = 'latest' } = params;
    const skip = (page - 1) * limit;

    const where: { isActive: boolean; category?: any } = { isActive: true };
    if (category && category !== 'ALL') where.category = category;

    const orderBy =
      sort === 'popular'
        ? [{ likeCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : { createdAt: 'desc' as const };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          category: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              nickname: true,
              businessName: true,
              businessStatus: true,
              profileImage: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { data: posts, total, page, limit };
  }

  // ── 게시글 상세 ──

  async getPost(id: number) {
    const post = await this.prisma.post.findFirst({
      where: { id, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            businessName: true,
            businessStatus: true,
            profileImage: true,
            mechanics: {
              where: { isActive: true },
              select: { id: true, name: true, address: true, location: true },
              take: 1,
            },
          },
        },
        comments: {
          where: { isActive: true, parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                businessName: true,
                businessStatus: true,
                profileImage: true,
                mechanics: {
                  where: { isActive: true },
                  select: { id: true, name: true, address: true, location: true },
                  take: 1,
                },
              },
            },
            replies: {
              where: { isActive: true },
              orderBy: { createdAt: 'asc' },
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    businessName: true,
                    businessStatus: true,
                    profileImage: true,
                    mechanics: {
                      where: { isActive: true },
                      select: { id: true, name: true, address: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    // 조회수 증가
    await this.prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    return post;
  }

  // ── 게시글 작성 ──

  async createPost(data: {
    title: string;
    content: string;
    category: string;
    authorId: number;
  }) {
    const { authorId, ...rest } = data;

    const post = await this.prisma.post.create({
      data: {
        ...rest,
        category: rest.category as any,
        userId: authorId,
      },
    });

    return post;
  }

  // ── 댓글 작성 ──

  async createComment(data: {
    postId: number;
    content: string;
    authorId: number;
    parentId?: number;
  }) {
    const { authorId, postId, ...rest } = data;

    const post = await this.prisma.post.findFirst({ where: { id: postId, isActive: true } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        ...rest,
        userId: authorId,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            businessName: true,
            businessStatus: true,
            profileImage: true,
            mechanics: {
              where: { isActive: true },
              select: { id: true, name: true, address: true, location: true },
              take: 1,
            },
          },
        },
      },
    });

    // 댓글 수 증가
    await this.prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });

    return comment;
  }

  // ── 좋아요 토글 ──

  async toggleLike(postId: number, authorId: number) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, isActive: true } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    const existing = await this.prisma.postLike.findFirst({
      where: { postId, userId: authorId },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
      await this.prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
      return { liked: false };
    } else {
      await this.prisma.postLike.create({
        data: {
          postId,
          userId: authorId,
        },
      });
      await this.prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
      return { liked: true };
    }
  }

  // ── 게시글 삭제 (본인만) ──

  async deletePost(postId: number, authorId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    if (post.userId !== authorId) {
      throw new ForbiddenException('본인 게시글만 삭제할 수 있습니다.');
    }

    await this.prisma.post.delete({ where: { id: postId } });
    return { message: '삭제되었습니다.' };
  }
}
