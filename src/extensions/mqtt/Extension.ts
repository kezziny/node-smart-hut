import { Reflection } from '@kezziny/reflection';
import { Device, DeviceExtension, DeviceConfig } from '../../device';
import { Property, PropertyChangeEventArgs } from '../../property';
import { Global, MqttPackage } from './Global';
import { MqttExposeDecorators, MqttSourceDecorators } from './Decorator';
import { Event } from '../../Event';

export class MqttDeviceConfig extends DeviceConfig
{
	Topic: { [key: string]: string; };
}

export class Mqtt extends DeviceExtension<MqttDeviceConfig>
{
	public static Global = Global;
	public static Source = MqttSourceDecorators;
	public static Expose = MqttExposeDecorators;
	public static Extension<T extends new (...args: any[]) => Device<any>>(constructor: T)
	{
		return class extends constructor
		{
			constructor(...args: any[])
			{
				super(args);
				this.Extensions.push(new Mqtt(this));
			}
		};
	}

	private Subscriptions: { [key: string]: Event<MqttPackage>; } = {};

	public override Configure(config: any)
	{
		super.Configure(config);
		console.log("\t[Mqtt] Configuring...");

		if (typeof config.Topic === 'string')
		{
			this.Configuration.Topic = { default: config.Topic };
		}

		Object.getOwnPropertyNames(this.Configuration.Topic)
			.forEach(topicName =>
			{
				this.Subscriptions[topicName] = Mqtt.Global.Topic(this.Configuration.Topic[topicName]);
			});

		this.Device.GetProperties().filter(property => this.Device[property].constructor?.name === 'Property').forEach(property =>
		{
			(this.Device[property] as Property).OnChanged.Subscribe(data => this.HandleExposePublish(data));
			(this.Device[property] as Property).OnControlled.Subscribe(data => this.HandleSourceControl(data));
		});

		this.HandleSourceBind();
		this.HandleExposeControl();
	}

	public HandleSourceBind()
	{
		this.Device.GetPropertiesWithMetadata(Mqtt.Source.KeyBind)
			.forEach(propertyInfo =>
			{
				console.log(`\t[Mqtt] \t Bind ${propertyInfo.Metadata.Topic} -> ${propertyInfo.Name}`);
				this.Subscriptions[propertyInfo.Metadata.Topic].Subscribe(data =>
				{
					propertyInfo.Object[propertyInfo.Name].Bind(propertyInfo.Metadata.Converter(data));
				});
			});
	}

	public HandleSourceControl(eventArgs: PropertyChangeEventArgs)
	{
		if (this.Device.HasPropertyMetadata(eventArgs.Property, Mqtt.Source.KeyControl))
		{
			let metadata = Reflection.GetPropertyMetadata(this.Device, eventArgs.Property, Mqtt.Source.KeyControl);
			Mqtt.Global.Publish(`${metadata.Topic}`, metadata.Converter(eventArgs.To));
		}
	}

	public HandleExposePublish(eventArgs: PropertyChangeEventArgs)
	{
		if (this.Device.HasPropertyMetadata(eventArgs.Property, Mqtt.Expose.KeyPublish))
		{
			Mqtt.Global.Publish(`${Mqtt.Global.Configuration.RootTopic}/${this.Device.ID}/${eventArgs.Property}`, eventArgs.To);
		}

	}

	public HandleExposeControl()
	{
		this.Device.GetPropertiesWithMetadata(Mqtt.Expose.KeyControl)
			.forEach((propertyInfo) =>
			{
				Mqtt.Global.Topic(`${Mqtt.Global.Configuration.RootTopic}/${this.Device.ID}/${propertyInfo.Metadata.Name}/set`)
					.Subscribe(data =>
					{
						propertyInfo.Object[propertyInfo.Name].Control(propertyInfo.Metadata.Converter(data));
					});
			});
	}
}
