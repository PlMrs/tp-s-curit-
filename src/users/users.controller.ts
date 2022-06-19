import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpException, HttpStatus, Headers, UseInterceptors, UploadedFile, UploadedFiles, StreamableFile, Response, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from 'src/auth/security/roles.guard';
import { Roles } from 'src/auth/security/roles.decorator';
import { User, UserRole } from './entities/user.entity';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { SwipeService } from 'src/swipe/swipe.service';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { JwtService } from '@nestjs/jwt';
import { Verified } from 'src/auth/security/verified.decorator';

const jwts = new JwtService({secret : process.env.JWT_SECRET})

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly swipeService: SwipeService
    ) {}

  @ApiOperation({description: "Ajout d'un utilisateur en base de donnée"})
  @ApiCreatedResponse({
    description: "Utilisateur ajouté avec succès",
    type: User,
  })
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<User> {
    
    const isExisted = await this.usersService.findByEmail(dto.email)

    if(isExisted){
      throw new HttpException('User already exist',HttpStatus.UNAUTHORIZED)
    }

    return this.usersService.create(dto);
  }


  @ApiOperation({description: "Liste de tous les utilisateurs"})
  @ApiOkResponse({
    description: "Tous les utilisateurs",
    type: [User],
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('find_one')
  findOne(@Headers('user_id') id){
    return this.usersService.findOne(id)
  }



  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @Get('swipe')
  findNotSwiped(@Headers('user_id') id: number,@Headers('needs') needs: string): Promise<User[]> {
    return this.usersService.findNotSwiped(id,needs);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @Get('match')
  async findMatched(@Headers('user_id') id: number): Promise<User[]>{

      const ids = await this.swipeService.findUsersId(id)

      return this.usersService.findAllWithIds(ids)

  }


  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({description: "Modifie un utilisateur grace à son id"})
  @ApiNotFoundResponse({ description: "L'utilisateur n'a pas été trouvé"})
  @ApiOkResponse({
    description: "L'utilisateur patché",
    type: User,
  })
  @Patch(':id')
  update(@Param('id') id: number,@Body() updateUserDto: UpdateUserDto) {
      return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('verified/:id')
  validateUser(@Param('id') id : number,@Body() updateUserDto: UpdateUserDto){
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file',{
    fileFilter: (req,file,callback)=>{
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    storage : diskStorage({
      destination : '../front/assets/images/users/picture',
      filename : (req,file,callback) => {
        const splited = file.originalname.split('.')
        const ext = splited[splited.length - 1]
        callback(null, `${uuidv4()}.${ext}`);
      }
    })
  }))
  async uploadFile(@Headers("user_id") id:number,@UploadedFile() file: Express.Multer.File) {

    const user = await this.usersService.findOne(id)

    const dto : UpdateUserDto = {picture : file.filename}
    const res = await this.usersService.update(id,dto)

    if(res.affected === 1){
      this.usersService.deletePicture(user.picture)

      return file.filename
    }
  }

  @ApiOperation({description: "Supprime un utilisateur grace à son id"})
  @ApiNotFoundResponse({ description: "L'utilisateur n'a pas été trouvé"})
  @ApiOkResponse({description: "L'utilisateur a été supprimé"})
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete()
  async adminRemove(@Body() user: User): Promise<HttpStatus> {
    this.usersService.remove(user)
    this.usersService.deletePicture(user.picture)
    return HttpStatus.OK
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @Verified(false)
  @Post('uploadVerifications')
  @UseInterceptors(FileFieldsInterceptor([
      {name: "carte_id", maxCount: 1},
      {name: "certificatScolaire", maxCount: 1}
    ],
    {
      fileFilter: (req,file,callback)=>{
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
          return callback(new Error('Only image files and pdf are allowed!'), false);
        }
        callback(null, true);
      },
      storage : diskStorage({
        destination : (req,file,callback)=>{
          const {id : user_id}: any = jwts.decode(req.headers.authorization.split(' ')[1])
          const dest = `../server-storage/${user_id}`
          const destExist = existsSync(dest)
          if(!destExist){
            mkdirSync(dest)
          }
          return callback(null, dest)
        },
        filename : (req,file,callback) => {
          const {id : user_id}: any = jwts.decode(req.headers.authorization.split(' ')[1])
          const splited = file.originalname.split('.')
          const ext = splited[splited.length - 1]
          callback(null, `${user_id}-${file.fieldname}.${ext}`);
      }})
    }
  ))
  async postVerifiedFiles(@Headers('Authorization') token: string,@UploadedFiles() files: { carte_id: Express.Multer.File[], certificatScolaire : Express.Multer.File[]   } ){
    const {id}: any = jwts.decode(token.split(' ')[1])
    const dto : UpdateUserDto = {carte_id : files.carte_id[0].filename, certificatScolaire : files.certificatScolaire[0].filename}
    return this.usersService.update(id,dto)
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('verifications')
  getNotVerifiedUsers(): Promise<User[]>{
   return  this.usersService.findNotVerified()
  }

  
  @Get('files')
  returnUserFile(@Response({ passthrough: true }) res,@Query('bearer') token : string, @Query('user_id') id: number,@Query('filename') filename : string ){
    let jwt : any;
    try{
      jwt = jwts.verify(token, {secret : process.env.JWT_SECRET})
    }catch(e){
      return 'token invalide'
    }
    if(jwt.role === "A"){
      const file = createReadStream(`../server-storage/${id}/${filename}`);
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="'+ filename + '"',
      });
      return new StreamableFile(file);
    }else{
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }
  }
}
