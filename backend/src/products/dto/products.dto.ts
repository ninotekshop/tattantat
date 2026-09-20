import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsInt() @Min(1) categoryId!: number;
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsInt() @Min(0) price!: number;
  @IsEnum(['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'FOR_PARTS'] as const) condition!: 'NEW' | 'LIKE_NEW' | 'USED_GOOD' | 'USED_FAIR' | 'FOR_PARTS';
  @IsString() @IsOptional() @MaxLength(5000) description?: string;
  @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) imageKeys!: string[];
}

/** A seller may temporarily hide a listing and later make it visible again.
 * Other lifecycle states are deliberately managed by their dedicated flows. */
export class UpdateListingVisibilityDto {
  @IsEnum(['ACTIVE', 'HIDDEN'] as const)
  status!: 'ACTIVE' | 'HIDDEN';
}

export class UpdateProductDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @IsOptional() @IsInt() @Min(0) price?: number;
  @IsOptional() @IsEnum(['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'FOR_PARTS'] as const) condition?: 'NEW' | 'LIKE_NEW' | 'USED_GOOD' | 'USED_FAIR' | 'FOR_PARTS';
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsInt() @Min(1) categoryId?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) imageKeys?: string[];
}
