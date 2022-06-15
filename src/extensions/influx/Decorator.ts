import { Reflection } from '@kezziny/reflection';
import { Device } from '../../device';

export class InfluxExposeDecorator
{
    public static readonly KeyPublish = "Influx.Expose.Publish";
    public static Publish(device: Device<any>, property: string)
    {
        Reflection.SetPropertyMetadata(device, property, InfluxExposeDecorator.KeyPublish, null);
    }
}