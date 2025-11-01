import { BadRequestException, Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import express from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly AuthService: AuthService) {}

    @Post('google')
    async loginWithGoogle(
        @Body('id_token') idToken: string,
        @Res({ passthrough: true }) res: express.Response
        ): Promise<any> {
        if (!idToken) {
            throw new BadRequestException('ID token is required');
        }

        // 1️⃣ Llamar al service (ya devuelve el JWT)
        const { token } = await this.AuthService.authenticateWithGoogle(idToken);

        // 2️⃣ Crear la cookie con el token
        res.cookie('token_vibra', token, {
            httpOnly: true,   // 🔒 no accesible por JS
            secure: false,    // ⚠️ true si usás HTTPS
            sameSite: 'lax', // necesario si front y back usan distintos puertos
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
        });

        // 3️⃣ Enviar respuesta al front (ya no hace falta mandar el token)
    return { message: 'Login successful' };
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