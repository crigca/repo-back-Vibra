import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserFollowService } from '../services/user-follow.service'

@Controller('users')
export class UserFollowController {
  constructor(private readonly userFollowService: UserFollowService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':targetId/follow')
  followUser(
    @Param('targetId') targetId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.userFollowService.followUser(currentUser.sub, targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':targetId/unfollow')
  unfollowUser(
    @Param('targetId') targetId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.userFollowService.unfollowUser(currentUser.sub, targetId);
  }

  @Get(':userId/followers')
  getFollowers(@Param('userId') userId: string) {
    return this.userFollowService.getFollowers(userId);
  }

  @Get(':userId/following')
  getFollowing(@Param('userId') userId: string) {
    return this.userFollowService.getFollowing(userId);
  }
}
export { UserFollowService };

