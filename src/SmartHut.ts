import { Mqtt, MqttPackage } from './extensions/mqtt';
import { filter } from 'rxjs';
import { Device } from './device';
import { PropertyChangeEventArgs } from 'property';

interface IEvent
{
	Property: string;
	Event: string;
	To: any;
}

export class SmartHut
{
	public static Sync(): void
	{
		Device.Devices.forEach((device) =>
		{
			Mqtt.Global.Topic(`${Mqtt.Global.Configuration.RootTopic}/${device.ID}/events`, true).Subscribe((pkg: MqttPackage) =>
			{
				const event: IEvent = pkg.payload;
				if (!device.hasOwnProperty(event.Property)) return;
				device[event.Property].SyncTo(event.To);

			});

			device.GetProperties().filter((property) => device[property]?.constructor?.name === 'Property')
				.forEach((property) =>
				{
					device[property].OnChanged.Subscribe((event: PropertyChangeEventArgs) =>
					{
						if (event.EventSource !== 'local') return;
						Mqtt.Global.Publish(`${Mqtt.Global.Configuration.RootTopic}/${device.ID}/events`, { Property: property, Event: 'OnChanged', To: event.To });
					});
					device[property].OnCommand.Subscribe((event: PropertyChangeEventArgs) =>
					{
						if (event.EventSource !== 'local') return;
						Mqtt.Global.Publish(`${Mqtt.Global.Configuration.RootTopic}/${device.ID}/events`, { Property: property, Event: 'OnCommand', To: event.To });
					});
				});
		});
	}
}
