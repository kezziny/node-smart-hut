import { IDeviceConfig } from "./IDeviceConfig";

export interface IRoomConfig
{
	Devices: {[key:string]: IDeviceConfig};
}