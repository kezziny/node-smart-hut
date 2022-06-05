import { Reflection } from "@kezziny/reflection";
import { IDeviceConfig, IRoomConfig, ISmartHutConfig } from "./config";
import { Device, DeviceExtension } from "./Device";

export class SmartHut {
	private static readonly KeyOnConfigured = "SmartHut.Configured";
	
	public static Configuration: ISmartHutConfig = null;
	public static Devices = [];
	public static Plugins = [];

	private static DeviceFactory = {};
	private static ExtensionFactory = {};

	public static AddDeviceType(type: string, factory: any): void {
		SmartHut.DeviceFactory[type] = factory;
	}

	public static AddExtensionType(type: string, factory: (config: any) => Promise<any>): void {
		SmartHut.ExtensionFactory[type] = factory;
	}

	public static InstallPlugin(plugin: any): void {
		SmartHut.Plugins.push(plugin);
	}



	public static async LoadHome(config: ISmartHutConfig): Promise<void> {
		console.log("Loading home...");
		
		SmartHut.Configuration = config;

		let promises = [];
		Object.getOwnPropertyNames(config.Extensions)
		.forEach( extensionName => {
			promises.push(SmartHut.ExtensionFactory[extensionName](config.Extensions[extensionName]) );
		});

		await Promise.all(promises);

		if (config.Devices) {
			Object.getOwnPropertyNames(config.Devices)
				.forEach( deviceName => {
					config.Devices[deviceName].Name = deviceName;
					SmartHut.LoadDevice(config.Devices[deviceName]);
				});
		}

		Object.getOwnPropertyNames(config.Rooms)
			.forEach( roomName => {
				SmartHut.LoadRoom(roomName, config.Rooms[roomName]);
			});
	}

	private static LoadRoom(room: string, config: IRoomConfig): void {
		console.log("Loading room", room);

		Object.getOwnPropertyNames(config.Devices)
			.forEach(deviceName => {
				let parts = deviceName.split(":");
				config.Devices[deviceName].Room = room;
				config.Devices[deviceName].Name = parts[0];
				config.Devices[deviceName].Type = parts[1];
				SmartHut.LoadDevice(config.Devices[deviceName]);
			});
	}

	private static LoadDevice(config: IDeviceConfig): void {
		console.log("Loading device", config.Name);

		let device: Device = SmartHut.DeviceFactory[config.Type](config);
		device.Configure(config);
		SmartHut.Devices.push(device);
	}

	public static OnConfigured(device: Device | DeviceExtension, property: string) {
		Reflection.SetPropertyMetadata(device, property, SmartHut.KeyOnConfigured, null);
	}
}
