import { IMethodInfo, Reflectable, Reflection } from '@kezziny/reflection';
import { DeviceConfig } from './DeviceConfig';

export class Device<T extends DeviceConfig> extends Reflectable
{
	public static Devices: Device<any>[] = [];

	public Extensions: DeviceExtension<any>[] = [];
	public Configuration: T = null;
	public get ID(): string { return `${this.Configuration?.Home}/${this.Configuration?.Room}/${this.Configuration?.Name}`; }

	public constructor()
	{
		super();
		Device.Devices.push(this);
	}

	public Configure(config: T): Device<T>
	{
		this.Configuration = config;
		console.log(`Configure ${this.ID}`);

		this.GetProperties().filter(property => this[property].constructor?.name === 'Property').forEach(property =>
		{
			this[property].Configure(property);
		});

		this.GetMethodsWithMetadata(Device.KeyOnConfigured)
			.forEach(methodInfo => methodInfo.Object[methodInfo.Name](config));

		return this;
	}

	public override GetMethodsWithMetadata(key: string): IMethodInfo[]
	{
		let methods = super.GetMethodsWithMetadata(key);
		this.Extensions
			.forEach((entity) => methods = methods.concat(entity.GetMethodsWithMetadata(key)));

		return methods;
	}

	public ExecuteCallback(callback: any, ...args: any[]): any
	{
		if (typeof callback === 'string') return this[callback as string](...args);
		else return callback(this, ...args);
	}

	private static readonly KeyOnConfigured = 'Device.OnConfigured';
	public static Configured(device: Device<any> | DeviceExtension<any>, property: string)
	{
		Reflection.SetPropertyMetadata(device, property, Device.KeyOnConfigured, null);
	}
}

export class DeviceExtension<T extends DeviceConfig> extends Reflectable
{
	protected Device: Device<any>;
	protected Configuration: T = null;

	public constructor(device: Device<any>)
	{
		super();
		this.Device = device;
	}

	@Device.Configured
	public Configure(config: T): void
	{
		this.Configuration = config;
	}
}
