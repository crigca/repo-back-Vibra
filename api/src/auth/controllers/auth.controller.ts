import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

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
}