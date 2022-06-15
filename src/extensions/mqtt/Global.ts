import mqtt from 'mqtt';
import { Event } from '../../Event';

export interface MqttPackage
{
	topic: string;
	payload: any;
}

export class MqttConfig
{
	Host: string;
	RootTopic: string;
}

export class Global
{
	public static Configuration: MqttConfig;
	private static Client: any;
	private static Subscriptions: { [key: string]: Event<MqttPackage>; } = {};

	public static Setup(config: MqttConfig): Promise<void>
	{
		return new Promise((resolve, reject) =>
		{
			Global.Configuration = config;

			const client = mqtt.connect(`mqtt://${config.Host}:1883`, {
				clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
				clean: true,
				connectTimeout: 4000,
				reconnectPeriod: 1000,
			});
			client.on('connect', () =>
			{
				Global.Client = client; // todo resubscribe?
				Global.Client.on('message', (topic: string, payload: any) =>
				{
					if (!Global.Subscriptions.hasOwnProperty(topic)) return;

					console.log(`<Mqtt> ${topic}: ${payload}`);
					Global.Subscriptions[topic].Invoke({ topic, payload: JSON.parse(payload.toString()) });
				});
				resolve();
			});
		});
	}

	public static Topic(topic: string, raw: boolean = false): Event<MqttPackage>
	{
		if (!Global.Subscriptions.hasOwnProperty(topic)) 
		{
			Global.Client.subscribe(topic);
			Global.Subscriptions[topic] = new Event<MqttPackage>();
		}

		return Global.Subscriptions[topic];
	}

	public static Publish(topic: string, data: any): void
	{
		Global.Client.publish(topic, JSON.stringify(data));
	}
}
