export type SimpleType = number | boolean | string;

export interface IPropertyContent
{
	value: SimpleType;
	[key: string]: SimpleType;
}