import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly AuthService: AuthService) {}

    @Post('google')
    async loginWithGoogle(@Body('id_token') idToken: string): Promise<any> {
        if(!idToken) {
            throw new BadRequestException('ID token is required');
        }
        const user = await this.AuthService.authenticateWithGoogle(idToken);
        return user;
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getCurrentUser(@CurrentUser() user: any): Promise<any> {
        return {
            userId: user.userId,
            username: user.username,
            email: user.email
        };
    }
}