import { IMethodInfo, Reflectable, Reflection } from 'reflection';
import { IDeviceConfig } from './config/IDeviceConfig';

export class Device extends Reflectable {
	private static readonly KeyOnConfigured = "Device.OnConfigured";

	public Extensions: DeviceExtension[] = [];
	public Configuration: IDeviceConfig = null;


	public Configure(config: IDeviceConfig) {
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

	public ExecuteCallback(callback, ...args: any[]): void {
		if (typeof callback === "string") this[callback](...args);
		else callback(this, ...args);
	}

	public static OnConfigured(device: Device | DeviceExtension, property: string) {
		Reflection.SetPropertyMetadata(device, property, Device.KeyOnConfigured, null);
	}
}

export class DeviceExtension extends Reflectable {
	protected Device: Device;
	protected Configuration: IDeviceConfig = null;

	public constructor(device: Device) {
		super();
		this.Device = device;
	}
	
	@Device.OnConfigured
	public Configure(config: IDeviceConfig): void {
		this.Configuration = config;
	}
}
