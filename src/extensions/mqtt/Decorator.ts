import { Reflection } from '@kezziny/reflection';
import { Device } from '../../device/Device';
import { IPropertyContent } from '../../property/IPropertyContent';
import { MqttPackage } from './Global';

export class MqttSourceDecorators
{
    public static readonly KeyBind = 'Mqtt.Source.Bind';
    public static readonly KeyControl = 'Mqtt.Source.Control';

    public static Bind(args: { Key: string, Topic?: string, Converter?: (data: MqttPackage) => IPropertyContent; })
    {
        if (!args.Topic) args.Topic = "default";
        if (!args.Converter) args.Converter = (data) => { return { value: data.payload[args.Key] }; };
        return function (device: Device<any>, property: string)
        {
            Reflection.SetPropertyMetadata(device, property, MqttSourceDecorators.KeyBind, args);
        };
    }

    public static Control(args: { Key: string, Topic?: string, Converter?: (data: IPropertyContent) => any; })
    {
        if (!args.Topic) args.Topic = "default";
        if (!args.Converter) args.Converter = (data) => { let command = {}; command[args.Key] = data.value; return command; };
        return function (device: Device<any>, property: string)
        {
            Reflection.SetPropertyMetadata(device, property, MqttSourceDecorators.KeyControl, args);
        };
    }

    public static BindAndControl(args: { Key: string, Topic?: string, BindingConverter?: (data: MqttPackage) => IPropertyContent, ControlConverter?: (data: IPropertyContent) => any; })
    {
        if (!args.Topic) args.Topic = "default";
        if (!args.ControlConverter) args.ControlConverter = (data) => { let command = {}; command[args.Key] = data.value; return command; };
        if (!args.BindingConverter) args.BindingConverter = (data) => { return { value: data.payload[args.Key] }; };

        let bindingArgs = {
            Key: args.Key,
            Topic: args.Topic,
            Converter: args.BindingConverter
        };

        let controlArgs = {
            Key: args.Key,
            Topic: args.Topic,
            Converter: args.ControlConverter
        };

        return function (device: Device<any>, property: string)
        {
            Reflection.SetPropertyMetadata(device, property, MqttSourceDecorators.KeyBind, bindingArgs);
            Reflection.SetPropertyMetadata(device, property, MqttSourceDecorators.KeyControl, controlArgs);
        };
    }
};

export class MqttExposeDecorators
{
    public static readonly KeyControl = 'Mqtt.Expose.Control';
    public static readonly KeyPublish = 'Mqtt.Expose.Publish';

    public static Publish(args: { Name?: string, Converter?: (data: IPropertyContent) => any; })
    {
        if (!args.Converter) args.Converter = (data) => data.value;

        return function (device: Device<any>, property: string)
        {
            if (!args.Name) args.Name = property;
            Reflection.SetPropertyMetadata(device, property, MqttExposeDecorators.KeyPublish, args);
        };
    }

    public static Control(args: { Name?: string, Converter?: (data: MqttPackage) => IPropertyContent; } = {})
    {
        if (!args.Converter) args.Converter = (data) => { return { value: data.payload.value }; };

        return function (device: Device<any>, property: string)
        {
            if (!args.Name) args.Name = property;

            Reflection.SetPropertyMetadata(device, property, MqttExposeDecorators.KeyControl, args);
        };
    }
};