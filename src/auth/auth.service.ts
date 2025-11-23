import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 📝 Register a new user
  async register(dto: CreateUserDto, image?: string) {
    // Delegate to UsersService
    return this.usersService.createUser(dto, image);
  }

  // 🔑 Login user
  async login(email: string, password: string) {
    // Normaliser l'email (lowercase et trim)
    const normalizedEmail = email?.toLowerCase().trim();
    
    if (!normalizedEmail || !password) {
      throw new UnauthorizedException('Email et mot de passe sont requis');
    }

    const user = await this.usersService.findByEmail(normalizedEmail);
    
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Exclure le mot de passe de la réponse
    const userResponse = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      image: user.image,
      dateDeNaissance: user.dateDeNaissance,
      numTel: user.numTel,
      gender: user.gender,
      credits: user.credits,
      ratingAvg: user.ratingAvg,
      badges: user.badges,
      isVerified: user.isVerified,
    };

    const payload = { userId: user._id.toString(), role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: userResponse,
    };
  }
}
