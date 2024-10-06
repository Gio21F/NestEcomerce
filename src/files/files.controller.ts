import { Controller, Get, Post, Param, UseInterceptors, UploadedFile, BadRequestException, Res, UploadedFiles, ParseUUIDPipe, Delete, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import { fileFilter } from './helpers/fileFilter.helper';
import { fileNames } from './helpers/fileName.helper';
import { multerOptions } from './helpers/multerOptions';
import { Auth } from 'src/auth/decorators';
import { ProductsService } from 'src/products/products.service';
import { ValidRoles } from 'src/auth/interfaces';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly productsService: ProductsService,
  ) {}

  @Get('product/:imageName')
  findProductImage(
    @Param('imageName') imageName: string
  ) {

    const path = this.filesService.getStaticProductImage( imageName );
    return {
      "ok": true,
      "path": path
    }
    
  }
  
  @Post('product/:id')
  @Auth( ValidRoles.admin )
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }], multerOptions))
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
