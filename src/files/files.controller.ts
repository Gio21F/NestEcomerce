import { Controller, Get, Post, Param, UseInterceptors, UploadedFile, BadRequestException, Res, UploadedFiles, ParseUUIDPipe, Delete, Body, Patch } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { multerOptionsOne, multerOptionsMany } from './helpers/multerOptions';
import { Auth, GetUser } from 'src/auth/decorators';
import { ProductsService } from 'src/products/products.service';
import { ValidRoles } from 'src/auth/interfaces';
import { User } from 'src/auth/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { fileFilter } from './helpers/fileFilter.helper';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  @Patch('user')
  @Auth()
  @UseInterceptors(
    FileInterceptor('avatar', multerOptionsOne )
  )
  async uploadAvatar(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No avatar uploaded!');
    }
    return await this.usersService.changeAvatar( file.filename, user.id )
  }
  
  @Post('product/:id')
  @Auth( ValidRoles.admin )
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }], multerOptionsMany))
  async uploadFiles(
    @Param('id', ParseUUIDPipe ) id: string,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    if (!files || !files.images) {
      throw new BadRequestException('No files uploaded!');
    }
    const filenames = files.images.map((file) => file.filename);
    return this.productsService.saveFileNames(filenames, id);
  }


  @Delete('images')
  @Auth( ValidRoles.admin )
  removeImage(
    @Body('filename') filename: string
  ){
    return this.productsService.removeImage( filename )
  }
}
