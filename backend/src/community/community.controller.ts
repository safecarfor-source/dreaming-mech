import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('community')
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  // 게시글 목록 (공개)
  @Get('posts')
  getPosts(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.communityService.getPosts({
      category,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sort,
    });
  }

  // 게시글 상세 (공개)
  @Get('posts/:id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.communityService.getPost(id);
  }

  // 게시글 작성 (인증 필요)
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  createPost(
    @Request() req: { user: { sub: number; role: string } },
    @Body() body: { title: string; content: string; category: string },
  ) {
    return this.communityService.createPost({
      ...body,
      authorId: req.user.sub,
    });
  }

  // 댓글 작성 (인증 필요)
  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('id', ParseIntPipe) postId: number,
    @Request() req: { user: { sub: number; role: string } },
    @Body() body: { content: string; parentId?: number },
  ) {
    return this.communityService.createComment({
      postId,
      content: body.content,
      parentId: body.parentId,
      authorId: req.user.sub,
    });
  }

  // 좋아요 토글 (인증 필요)
  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleLike(
    @Param('id', ParseIntPipe) postId: number,
    @Request() req: { user: { sub: number; role: string } },
  ) {
    return this.communityService.toggleLike(postId, req.user.sub);
  }

  // 게시글 삭제 (본인만)
  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deletePost(
    @Param('id', ParseIntPipe) postId: number,
    @Request() req: { user: { sub: number; role: string } },
  ) {
    return this.communityService.deletePost(postId, req.user.sub);
  }
}
