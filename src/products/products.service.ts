import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID} from 'uuid';
import { ProductImage, Product } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource
  ) {}

  async create(createProductDto: CreateProductDto) {

    try{
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(i => this.productImageRepository.create({url: i}))
      });
      await this.productRepository.save(product);
      return product;

    }catch(error){
      this.handleExceptions(error);
    }

  }

  async findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      }
    });

    return products.map(({images, ...rest}) => ({
      ...rest,
      images: images.map(i => i.url)
    }));
  }

   async findOne(term: string) {

    let product : Product;

    if(isUUID(term)){
      product = await  this.productRepository.findOneBy({id: term});
    }else{
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder.where('UPPER(title) =:title or slug =:slug',{
        title: term.toUpperCase(),
        slug: term.toLocaleLowerCase(),
      })
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getOne();

      // select * from Products where slog = 'XX' or title = 'XXXX'
      // product = await  this.productRepository.findOneBy({slug: term});
    }

    // const product = await  this.productRepository.findOneBy({id});

    if(!product)
      throw new NotFoundException();
    

      return product;
  }

  async findOnePlain(term : string){
    const { images = [], ...rest} = await this.findOne(term);

    return {
      ...rest,
      images: images.map(image => image.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...topUpdate } = updateProductDto;

    const product = await this.productRepository.preload({id: id, ...topUpdate});

    if(!product) throw new NotFoundException();
    
    const queryRunner = this.dataSource.createQueryRunner();

    try{
      await this.productRepository.save(product);
      return product;
    }catch(error){
      this.handleExceptions(error);
    }

    
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  private handleExceptions(error: any){
    if(error.code === '23505')
      throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException()

  }
}
