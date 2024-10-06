import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsString, ValidateNested } from 'class-validator';
import { CreateSessionDto } from 'src/stripe/dto/create_session.dto';


export class CreateOrderDto {

    @IsString()
    user_id: string;

    @IsString()
    transaction_id: string;

    @IsNumber()
    @IsPositive()
    amount_subtotal: number;

    @IsNumber()
    @IsPositive()
    amount_total: number;

    @IsString()
    status: string;

    @ValidateNested({ each: true })
    @Type(() => CreateSessionDto)
    products: CreateSessionDto[];
}