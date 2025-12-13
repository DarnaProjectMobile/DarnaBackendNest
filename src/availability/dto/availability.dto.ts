
import { IsArray, IsString, IsNotEmpty, IsNumber, IsDateString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TimeSlotDto {
    @IsString()
    @IsNotEmpty()
    startTime: string;

    @IsString()
    @IsNotEmpty()
    endTime: string;
}

export class UpdateAvailabilityDto {
    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    availableDays?: number[];

    @IsArray()
    @IsDateString({}, { each: true })
    @IsOptional()
    unavailableDates?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TimeSlotDto)
    @IsOptional()
    availableTimeSlots?: TimeSlotDto[];
}
