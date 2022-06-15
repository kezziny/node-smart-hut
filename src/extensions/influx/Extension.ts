import { Point } from '@influxdata/influxdb-client';
import { Reflection } from '@kezziny/reflection';
import { Device, DeviceExtension } from '../../device';
import { Property, PropertyChangeEventArgs } from '../../property';
import { InfluxExposeDecorator } from './Decorator';
import { Global } from './Global';


export class Influx extends DeviceExtension<any>
{
    public static Global = Global;
    public static Expose = InfluxExposeDecorator;

    public override Configure(config: any): void
    {
        super.Configure(config);
        console.log(`\t[Influx] Configuring...`);

        this.Device.GetProperties().filter(property => this.Device[property].constructor?.name === 'Property').forEach(property =>
        {
            (this.Device[property] as Property).OnChanged.Subscribe(data => this.OnPropertyChanged(data));
        });
    }

    public OnPropertyChanged(eventArgs: PropertyChangeEventArgs)
    {
        console.log("nevermind...");
        if (!this.Device.HasPropertyMetadata(eventArgs.Property, Influx.Expose.KeyPublish)) return;

        let point = new Point(this.Device[eventArgs.Property].Unit);
        point.tag("home", this.Configuration.Home);
        point.tag("room", this.Configuration.Room);
        point.tag("name", this.Configuration.Name);

        if (this.Device.HasPropertyMetadata(eventArgs.Property, Property.KeyTag))
        {
            let tagMetadata = this.Device.GetPropertyMetadata(eventArgs.Property, "Tag");
            Object.getOwnPropertyNames(tagMetadata)
                .forEach(tag =>
                {
                    point.tag(tag, tagMetadata[tag]);
                });
        }

        switch (typeof eventArgs.To.value)
        {
            case 'boolean': point.booleanField(eventArgs.Property, eventArgs.To.value); break;
            case 'number': point.floatField(eventArgs.Property, eventArgs.To.value); break;
            case 'string': point.stringField(eventArgs.Property, eventArgs.To.value); break;
        }

        console.log(`[Influx]\tPublish data: ${point}`);
        Influx.Global.Publish([point]);
    }


    public static Extension<T extends { new(...args: any[]): Device<any>; }>(constructor: T)
    {
        return class extends constructor
        {
            constructor(...args: any[])
            {
                super(args);
                this.Extensions.push(new Influx(this));
            }
        };
    }
}
