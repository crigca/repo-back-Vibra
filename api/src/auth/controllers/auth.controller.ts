import { BadRequestException, Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import express from 'express';
import { User } from 'src/users/entities/users.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('auth')
export class AuthController {
    constructor(private readonly AuthService: AuthService,
        @InjectRepository(User)
            private usersRepository: Repository<User>,
    ) {}

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
            secure: process.env.NODE_ENV === "production",    // ⚠️ true si usás HTTPS
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // necesario si front y back usan distintos puertos
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
        });

        // 3️⃣ Enviar respuesta al front con el token (para cross-domain)
    return { message: 'Login successful', token };
    }


    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getCurrentUser(@CurrentUser() user: any) {
        const dbUser = await this.usersRepository.findOne({ where: { id: user.userId } });
        if (!dbUser) return null;

        // SEGURIDAD: Excluir campos sensibles de la respuesta
        const { googleId, ...safeUser } = dbUser;
        return safeUser;
    }

    @Post('cookie-dev')
    async devLogin(@Res({ passthrough: true }) res: express.Response) {
    // ⚠️ SEGURIDAD: Solo permitido en desarrollo
    if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException('Endpoint disabled in production');
    }

    const payloadJwt = { sub: '123', email: 'dev@example.com', username: 'devuser' };
    const token = this.AuthService.signJwtForDev(payloadJwt);

    res.cookie('token_vibra', token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { message: 'Dev login successful' };
    }

    // 🚪 Logout - Solo borra la cookie de sesión, NO borra datos del usuario
    @Post('logout')
    async logout(@Res({ passthrough: true }) res: express.Response) {
        res.clearCookie('token_vibra', {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        return { message: 'Logout successful' };
    }

    // ✅ Registro con email y contraseña (ahora requiere verificacion)
    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
    async register(
        @Body('email') email: string,
        @Body('password') password: string,
        @Body('username') username: string,
    ): Promise<any> {
        return await this.AuthService.register(email, password, username);
    }

    // ✅ Verificar email con codigo
    @Post('verify-email')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
    async verifyEmail(
        @Body('email') email: string,
        @Body('code') code: string,
        @Res({ passthrough: true }) res: express.Response
    ): Promise<any> {
        const { token } = await this.AuthService.verifyEmail(email, code);

        res.cookie('token_vibra', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        return { message: 'Email verificado exitosamente', token };
    }

    // ✅ Reenviar codigo de verificacion
    @Post('resend-code')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 intentos por minuto
    async resendCode(@Body('email') email: string): Promise<any> {
        return await this.AuthService.resendVerificationCode(email);
    }

    // ✅ Solicitar recuperacion de contraseña
    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 intentos por minuto
    async forgotPassword(@Body('email') email: string): Promise<any> {
        return await this.AuthService.forgotPassword(email);
    }

    // ✅ Restablecer contraseña con token
    @Post('reset-password')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
    async resetPassword(
        @Body('token') token: string,
        @Body('password') password: string,
    ): Promise<any> {
        return await this.AuthService.resetPassword(token, password);
    }

    // ✅ Login con email y contraseña
    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
        @Res({ passthrough: true }) res: express.Response
    ): Promise<any> {
        const { token } = await this.AuthService.login(email, password);

        res.cookie('token_vibra', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        return { message: 'Login exitoso', token };
    }

}