import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, UnauthorizedException, UseGuards } from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from 'src/auth/token/dto/signin-user.dto';
import { ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { User, UserRole } from 'src/users/entities/user.entity';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';

@Controller('auth')
export class TokenController {
    constructor(
        private users: UsersService,
        private jwts: JwtService
    ){}

    @ApiOperation({description: "Authentifier un utilisateur"})
    @ApiUnauthorizedResponse({ description: "Authentification failed"})
    @ApiOkResponse({
        description: "Authentifié en tant qu'utilisateur",
        type: SignInDto
    })
    @Post('/token')
    async signIn(@Body("Authorization") auth : string) {
        let args = auth && auth.split(" ");
        if(args && args.length == 2 && args[0] == "Basic") {
            const credentials = Buffer.from(args[1], "base64").toString("utf8").split(":");
            const email = credentials[0];
            const password = credentials[1];
            const user = await this.users.findByEmail(email);

            if(user && password === user.password){
                const cr = new SignInDto();
                cr.grant_type = "password";
                cr.scope = "*";
                cr.expires_in = "1h";
                cr.access_token = await this.jwts.sign({
                    id: user.id,
                    role: user.role,
                    verified: user.verified
                },{
                    subject: user.email,
                    expiresIn: "1h"
                });
                return cr;
            }
            else{
                throw new HttpException('Connexion impossible, utilisateur ou mot de passe incorrect', HttpStatus.UNAUTHORIZED)
            }
        }
        throw new UnauthorizedException("Invalid or missing Basic credential ");
        
    }


  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.CUSTOMER)
  @Get('/session')
  async getSession(@Headers("Authorization") token : string): Promise<{user : User}>{

    const jwt = token.split(" ")[1]
      
    try{

        const {id} : any = this.jwts.verify(jwt, {secret : process.env.JWT_SECRET});

        const u = await this.users.findOne(id)

        return { user : u}

    }catch(e){
        return e
    }
      
  }

}