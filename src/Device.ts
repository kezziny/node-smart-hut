import { IMethodInfo, Reflectable, Reflection } from '@kezziny/reflection';
import { SmartHut } from 'SmartHut';
import { SimpleType } from 'Property';

export type DataBindingConverter<T> = (device: Device<any>, data: T) => SimpleType | string
export type DataPublishingConverter = (device: Device<any>, property: string) => SimpleType | string

export interface IDeviceConfig
{
	[key: string]: any;
	
	Home: string;
	Name: string;
	Room: string;
}

export class Device<T> extends Reflectable {
	private static readonly KeyOnConfigured = "Device.OnConfigured";

	public Extensions: DeviceExtension[] = [];
	public Configuration: T = null;

	public constructor() {
		super();
		SmartHut.Devices.push(this);
	}

	public Configure(config: T) {
		console.log("Configuring device");


		this.GetProperties()
			.filter(property => this[property]?.constructor?.name === "Property")
			.forEach(property => {
				this[property].Name = property;
			})
		
		this.Configuration = config;
		this.CallMethodsWithMetadata(Device.KeyOnConfigured, config);
	}

	public override GetMethodsWithMetadata(key: string): IMethodInfo[] {
		let methods = super.GetMethodsWithMetadata(key);
		this.Extensions
			.forEach( entity => methods = methods.concat(entity.GetMethodsWithMetadata(key)));
		return methods;
	}

	public ExecuteBindingCallback<T>(callback: DataBindingConverter<T>, data: T): void {
		if (typeof callback === "string") this[callback as string](data);
		else callback(this, data);
	}

	public ExecutePublishingCallback(callback: DataPublishingConverter, property: string): SimpleType {
		if (typeof callback === "string") return this[callback as string](property);
		else return callback(this, property);
	}

	public static OnConfigured(device: Device<any> | DeviceExtension, property: string) {
		Reflection.SetPropertyMetadata(device, property, Device.KeyOnConfigured, null);
	}
}

export class DeviceExtension extends Reflectable {
	protected Device: Device<any>;
	protected Configuration: IDeviceConfig = null;

	public constructor(device: Device<any>) {
		super();
		this.Device = device;
	}
	
	@Device.OnConfigured
	public Configure(config: IDeviceConfig): void {
		this.Configuration = config;
	}
}
