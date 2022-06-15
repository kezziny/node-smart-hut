import { Accessory, Categories, uuid } from "hap-nodejs";

export class HomekitConfig
{
    Username: string;
    PinCode: string;
    Port: number;
}

export class Global
{
    public static Accessory;
    public static Configuration: HomekitConfig;

    public static async Setup(config: any): Promise<void>
    {
        Global.Configuration = config;
        Global.Accessory = new Accessory("SmartHut", uuid.generate("smart-hut-extension-homekit"));
        Global.Accessory.isBridge = true;
    }

    public static Start()
    {
        Global.Accessory.publish({
            username: Global.Configuration.Username,
            pincode: Global.Configuration.PinCode,
            port: Global.Configuration.Port,
            category: Categories.BRIDGE
        });
    }
}