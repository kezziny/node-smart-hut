import { InfluxDB, Point } from '@influxdata/influxdb-client';
export { Point };

export class InfluxConfig
{
    Url: string;
    User: string;
    Token: string;
    Bucket: string;
}

export class Global
{
    public static Configuration: InfluxConfig;
    private static Client: any = null;

    public static Setup(config: InfluxConfig): void
    {
        console.log("Setup influx extension");

        Global.Configuration = config;
        Global.Client = new InfluxDB({ url: config.Url, token: config.Token });
    }

    public static Publish(points: Point[])
    {
        if (!Global.Client) return;

        let writer = Global.Client.getWriteApi(Global.Configuration.User, Global.Configuration.Bucket);
        points.forEach(point =>
        {
            writer.writePoint(point);
        });
        writer.close().then(() => { });
    }
}