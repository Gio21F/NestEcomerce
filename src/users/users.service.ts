import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path'

@Injectable()
export class UsersService {
    private readonly staticPath: string;
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService
    ){
        this.staticPath = configService.get<string>('STATIC_URL')
    }

    async getNumberOfClients(){
        const count = await this.userRepository.count();
        return count;
    }

    async updateUser( updateUserDto: UpdateUserDto, user: User ){}

    async changeAvatar( avatar: string, user_id: string ):Promise<{ avatar: string }>{
        const user = await this.userRepository.findOneBy({ id: user_id });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const oldAvatar = user.avatar;
        user.avatar = avatar;
        this.deleteAvatar(oldAvatar);
        try {
            await this.userRepository.save(user);
            return {
                avatar: `${ this.staticPath }/users/${ avatar }`   
            }
          } catch (error) {
            throw new InternalServerErrorException('Algo salio mal, error en el servidor')
        }
    }

    deleteAvatar( filename: string ){
        const imagePath = path.join(__dirname, '../../static/users/', filename);
        // Verificar si el archivo existe y eliminarlo
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath); // Eliminar el archivo del disco
        } else {
            throw new BadRequestException('File not found on disk');
        }
        return { message: 'Image deleted successfully' };
    }

}
