import { BadRequestException, Controller, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { fileFilter, fileNamer } from './helpers';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';



@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
    ) {
  }

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response,
    @Param('imageName') imageName : string
  ){

    const path = this.filesService.getStaticProductImage(imageName);
    
    // return res.status(403).json({
    //   ok: false,
    //   path: path,
    // });

    res.sendFile(path);
  }

  @Post('product')
  @UseInterceptors(FileInterceptor('file',{
    fileFilter: fileFilter,
    storage: diskStorage({
      destination: './static/products',
      filename: fileNamer
    })
    
  }))
  uploadProductImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({maxSize: 1024 * 1024 * 3}),
          new FileTypeValidator({fileType: '.(png|jpeg|jpg|gif)'}),
        ]
      })
    ) file: Express.Multer.File,
    
    ){

      if(!file){
        throw new BadRequestException('File is empty');
      }

      // const secureUrl = `${file.filename}`;
      const secureUrl = `${this.configService.get('HOST_API')}/files/product/${file.filename}`;
      

    return { secureUrl };
  }

}
