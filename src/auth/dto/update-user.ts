import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUser {

    @IsString()
    @MinLength(1)
    fullName: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsString()
    @IsOptional()
    @IsIn(['admin','seo','user'])
    role?: string
    
}