import { IDeviceConfig } from "./IDeviceConfig";
import { IRoomConfig } from "./IRoomConfig";

export interface ISmartHutConfig
{
	Extensions: {[key: string]: { [key: string]: any}};

	Rooms: {[key:string]: IRoomConfig};
	Devices?: {[key:string]: IDeviceConfig};
}