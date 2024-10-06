import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { DataSource, In, Repository } from 'typeorm';
import { CreateProductSeedDto } from './dto/create-product-seed.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities';
import { User } from '../auth/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { writeFileSync, unlinkSync } from 'fs'; // Para manejar archivos locales
import { v4 as uuidv4 } from 'uuid'; // Importar uuid
import { CreateProductDto } from './dto/create-product.dto';
import * as fs from 'fs';
import * as path from 'path'
import { UsersService } from 'src/users/users.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');
  private readonly static_products:string;
  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private configService: ConfigService,
    private readonly userService: UsersService,
    private readonly orderService: OrdersService,
  ){
    this.static_products = this.configService.get<string>('STATIC_URL')
  }

  async createProductsSeed(createProductDto: CreateProductSeedDto, user: User){
    try {
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        user,
        images: images.map( image => this.productImageRepository.create({ filename: image }) )
      });
      await this.productRepository.save( product );
      return {...product, images};
      
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async create( createProductDto: CreateProductDto, user: User) {
    try {
      const product = this.productRepository.create({
        ...createProductDto,
        user
      });
      const savedProduct = await this.productRepository.save(product);
      return savedProduct;
    } catch (error) {
      console.log(error)
      this.handleDBExceptions(error);
    } 
  }

  async findAllAdmin() {
    const products = await this.productRepository.find({ 
      relations: { images: true},
      order: { created_at: 'DESC' }
    });
    return products.map( ( product ) => ({
      ...product,
      images: product.images.map( img => `${this.static_products}/products/${img.filename}` )
    }))
  }

  async findAll( paginationDto: PaginationDto ) {
    const { limit = 20, offset = 0, gender } = paginationDto;
    const whereCondition = gender ? { gender } : {};
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
      where: whereCondition
    })
    return products.map( ( product ) => ({
      ...product,
      images: product.images.map( img => `${this.static_products}/products/${img.filename}` )
    }))
  }

  async findOne(term: string) {
    let product: Product;

    if ( isUUID(term) ) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod'); 
      product = await queryBuilder
      .where(
        `(UPPER(prod.title) = :title OR prod.slug = :slug) 
         OR to_tsvector('english', prod.title || ' ' || array_to_string(prod.tags, ' ')) @@ to_tsquery(:fullTextSearch)`,
        {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
          fullTextSearch: term.split(' ').join(' & '), // Convierte "laptop gaming" a "laptop & gaming"
        }
      )
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getOne();
    }

    if ( !product ) 
      throw new NotFoundException(`Product with ${ term } not found`);

    return product;
  }

  async findOnePlain( term: string ) {
    const { images = [], ...rest } = await this.findOne( term );
    return {
      ...rest,
      images: images.map( img => `${this.static_products}/products/${img.filename}` )
    }
  }

  async update( id:string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    try {
      const updatedProduct = Object.assign(product, updateProductDto);
      await this.productRepository.save(updatedProduct);
      return updatedProduct;
    } catch (error) {
      this.handleDBExceptions( error );
    }
    
  }

  async remove(id: string) {
    const product = await this.findOne( id );
    await this.productRepository.remove( product );
  }

  private handleDBExceptions( error: any ) {

    if ( error.code === '23505' )
      throw new BadRequestException(error.detail);
    
    this.logger.error(error)
    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findProductsByIds(productIds: string[]): Promise<Product[]> {
    return this.productRepository.find({
      where: { id: In(productIds) },
      relations: { images: true}
    });
  }

  async saveFileNames( fileNames: string[], id: string ) {
    try {
        const product = await this.findOne(id);
        if (!product) throw new BadRequestException('No se encontro el producto');
        for (const fileName of fileNames) {
            const productImage = this.productImageRepository.create({
              filename: fileName,
              product: product
            });
            await this.productImageRepository.save(productImage);
        }
        return {
          images: fileNames.map( img => `${this.static_products}/products/${img}` )
        }
    } catch (error) {
        this.handleDBExceptions(error);
    }
  }

  async removeImage( filename: string ) {
    try {
      const image = await this.productImageRepository.findOneBy({ filename: filename });
      if (!image) {
        throw new BadRequestException('Image not found');
      }
      const imagePath = path.join(__dirname, '../../static/products/', filename);
      // Verificar si el archivo existe y eliminarlo
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Eliminar el archivo del disco
      } else {
        throw new BadRequestException('File not found on disk');
      }
      await this.productImageRepository.delete(image);
      return { message: 'Image deleted successfully' };
    } catch (error) {
      return this.handleDBExceptions(error);
    }
  }

  //Search
  async search(term: string){
    const queryBuilder = this.productRepository.createQueryBuilder('prod'); 
    const products = await queryBuilder
      .where(
        `(UPPER(prod.title) = :title OR prod.slug = :slug) 
        OR to_tsvector('english', prod.title || ' ' || array_to_string(prod.tags, ' ')) @@ to_tsquery(:fullTextSearch)`,
        {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
          fullTextSearch: term.split(' ').join(' & '), // Convierte "laptop gaming" a "laptop & gaming"
        }
      )
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getMany();
    
    if (!products || products.length === 0) 
      throw new NotFoundException(`Product with term ${term} not found`);
    
    const processedProducts = products.map(product => {
      const { images = [], ...rest } = product;
      return {
        ...rest,
        images: images.map(img => `${this.static_products}/products/${img.filename}`)
      };
    });

    return processedProducts;
  }

  async getNumberOfProducts(){
    const count = await this.productRepository.count();
    return count;
  }

  //Dashboard
  async dashboard() {
    const numberOfClients = await this.userService.getNumberOfClients()
    const numberOfOrders = await this.orderService.getNumberOfOrders();
    const numberOfProducts = await this.getNumberOfProducts();
    return {
      numberOfClients,
      numberOfOrders,
      numberOfProducts,
    }
  }

}
