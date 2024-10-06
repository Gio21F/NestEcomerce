import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsString, ValidateNested } from 'class-validator';

export class CreateSessionDto {
    @IsString()
    id: string;

    @IsNumber()
    @IsPositive()
    quantity: number;

    @IsString()
    size: string;

}

export class CreateSessionArrayDto {
    @ValidateNested({ each: true })
    @Type(() => CreateSessionDto)
    products: CreateSessionDto[];
}