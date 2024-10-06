import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Product } from './entities';
import { ValidRoles } from 'src/auth/interfaces';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth( ValidRoles.admin )
  async newProduct(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
  ){
    return this.productsService.create( createProductDto, user );
  }

  @Get()
  findAll(@Query() paginationDTO: PaginationDto) {
    return this.productsService.findAll( paginationDTO );
  }

  @Get('admin')
  findAllAdmin() {
    return this.productsService.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOnePlain(id);
  }

  @Get('/search/:term')
  find(@Param('term') term: string) {
    return this.productsService.search(term);
  }

  @Patch(':id')
  @Auth( ValidRoles.admin )
  update(
    @Param('id', ParseUUIDPipe ) id: string, 
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe ) id: string) {
    return this.productsService.remove(id);
  }

  @Get('admin/dashboard')
  @Auth( ValidRoles.admin )
  dashboard() {
    return this.productsService.dashboard();
  }
 }
