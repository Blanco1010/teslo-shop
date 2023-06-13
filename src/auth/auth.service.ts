import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt  from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt.strategy.interfaces';




@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ){

  }

   async create(createUserDto: CreateUserDto) {
    
    try{

      const {password, ...userDate} = createUserDto;

      const user = this.userRepository.create({
        ...userDate,
        password: bcrypt.hashSync(password,10),
      });
      await this.userRepository.save(user);
      delete user.password;
      return user;
      //TODO: Return TOKEN
    }catch(error){
      this.hendleDBErrors(error);
    }

  }

  async login(loginUserDto: LoginUserDto) {
    
  
      const {password, email} = loginUserDto;

      const user = await this.userRepository.findOne({
        where: {email},
        select: {email:true, password: true, id: true}
      });

      if(!user)
        throw new UnauthorizedException('Credentials are not valid');
      

      if(!bcrypt.compareSync(password, user.password))
        throw new UnauthorizedException('Credentials are not valid');



      return {
        ...user,
        token: this.getJwtToken({id: user.id})
      };
  }

  async checkAuthStatus(user: User){
    return {
      ...user,
      token: this.getJwtToken({id: user.id})
    }
  }


  private getJwtToken(payload: JwtPayload){

    const token = this.jwtService.sign(payload);
    return token;
  }

  private hendleDBErrors(error: any){
    if(error.code === '23505')
      throw new BadRequestException(error.detail);
  }

}
