import { CharacteristicEventTypes, CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, Service } from "hap-nodejs";
import { Device, DeviceConfig, DeviceExtension } from '../../device';
import { Global } from './Global';
import { HomekitExposeDecorators } from './Decorator';

export class Homekit extends DeviceExtension<DeviceConfig>
{
    public static Global = Global;
    public static Expose = HomekitExposeDecorators;

    private Type: any;
    private Service;

    constructor(device: Device<any>, type: any)
    {
        super(device);
        this.Type = type;
    }

    public override Configure(config: DeviceConfig): void
    {
        super.Configure(config);

        let name = `${this.Configuration.Room} ${this.Configuration.Name}`;
        this.Service = this.Type(name, name);

        this.Device.GetPropertiesWithMetadata(Homekit.Expose.KeyPublish).forEach(property =>
        {
            let characteristic = this.Service.getCharacteristic(property.Metadata.characteristic);
            characteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) =>
            {
                callback(undefined, property.Metadata.Converter(this.Device[property.Name].Value));
            });
        });

        this.Device.GetPropertiesWithMetadata(Homekit.Expose.KeyControl).forEach(property =>
        {
            let characteristic = this.Service.getCharacteristic(property.Metadata.characteristic);
            characteristic.on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) =>
            {
                this.Device[property.Name].Control(property.Metadata.Callback(value));
                callback();
            });
        });

        Homekit.Global.Accessory.addService(this.Service);
    }


    public static Extension(type: any)
    {
        return function <T extends { new(...args: any[]): Device<any>; }>(constructor: T)
        {
            return class extends constructor
            {
                constructor(...args: any[])
                {
                    super(args);
                    this.Extensions.push(new Homekit(this, type));
                }
            };
        };
    }
}
