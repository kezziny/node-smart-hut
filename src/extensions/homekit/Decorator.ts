import { Reflection } from '@kezziny/reflection';
import { Device } from '../../device';
import { IPropertyContent } from '../../property';

export { Characteristic } from 'hap-nodejs';

export class HomekitExposeDecorators
{
    public static readonly KeyPublish: "Homekit.Expose.Publish";
    public static readonly KeyControl: "Homekit.Expose.Control";

    public static Publish(args: { Characteristic: any, Converter?: (property: IPropertyContent) => any; })
    {
        if (!args.Converter) args.Converter = (property: IPropertyContent) => property?.value;
        return function (device: Device<any>, property: string)
        {
            Reflection.SetPropertyMetadata(device, property, HomekitExposeDecorators.KeyPublish, args);
        };
    }

    public static Control(args: { Characteristic: any, Converter?: (data: any) => IPropertyContent; })
    {
        if (!args.Converter) args.Converter = (data: any) => { return { value: data }; };
        return function (device: Device<any>, property: string)
        {
            Reflection.SetPropertyMetadata(device, property, HomekitExposeDecorators.KeyControl, args);
        };
    }

    public static PublishAndControl(args: { Characteristic: any, PublishConverter?: (property: IPropertyContent) => any, ControlConverter?: (data: any) => IPropertyContent; })
    {
        let publishArgs = {
            Characteristic: args.Characteristic,
            Converter: args.PublishConverter,
        };
        let controlArgs = {
            Characteristic: args.Characteristic,
            Converter: args.ControlConverter,
        };
        if (!publishArgs.Converter) publishArgs.Converter = (property: IPropertyContent) => property?.value;
        if (!controlArgs.Converter) controlArgs.Converter = (data: any) => { return { value: data }; };

        return function (device: Device<any>, property: string)
        {
            Reflection.SetPropertyMetadata(device, property, HomekitExposeDecorators.KeyPublish, publishArgs);
            Reflection.SetPropertyMetadata(device, property, HomekitExposeDecorators.KeyControl, controlArgs);
        };
    }
};