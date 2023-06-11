import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "../entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException, Injectable } from '@nestjs/common';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy){

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        configService: ConfigService
    ){
        super({
            secretOrKey: configService.get('JWT_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate(payload: any): Promise<User>{

        const { email } = payload;

        const user = await this.userRepository.findOne({
            where: {email},
            select: {email:true, password: true, id: true, isActive: true, roles: true}
          });

        if(!user){
            throw new UnauthorizedException('Token not valid');
        }

        if(!user.isActive){
            throw new UnauthorizedException('User is inactive, talk with an admin');
        }

        return user;
    }

}