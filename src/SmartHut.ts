import { PropertyChangeEventArgs } from 'Property';
import { WebSocketServer, WebSocket } from 'ws';

import { Device, DeviceExtension } from "./Device";

interface WSEvent {
	Device: {
		Home: string;
		Room: string;
		Name: string;
	}

	Property: string;
	Event: string;

	To: any;
}

export class SmartHut {	
	public static Devices: Device<any>[] = [];


	public static Serve(): void {
		const server = new WebSocketServer({ port: 8080 });
		server.on('connection', (client) => {
			client.on('message', (event: WSEvent) => {
				SmartHut.ProcessEvent(event);
				server.clients.forEach(target => {
					if (target === client) return;
					target.send(event);
				});
			});		  
		  });
		
		
		this.Devices.forEach(device => {
			device.GetProperties()
				.filter(property => property?.constructor?.name === "Property")
				.forEach(property => {
					device[property].OnChanged.subscribe((event) => server.clients.forEach(target => target.send(SmartHut.EventToWS(event, "OnChanged"))));
				});
		});
	}

	public static Connect(ip: string): void {
		const client = new WebSocket('ws://' + ip);
		
		client.on('message', (event) => SmartHut.ProcessEvent(event));

		this.Devices.forEach(device => {
			device.GetProperties()
				.filter(property => property?.constructor?.name === "Property")
				.forEach(property => {
					device[property].OnCommand.subscribe((event) => client.send(SmartHut.EventToWS(event, "OnCommand")));
				});
		});
	}

	private static ProcessEvent(event: WSEvent): void {
		SmartHut.Devices
		.filter(device => device.Configuration.Home === event.Device.Home && device.Configuration.Room === event.Device.Room && device.Configuration.Name === event.Device.Name)
		.forEach(device => {
			switch(event.Event) {
				case "OnChanged": device[event.Property].Bound(event.To); break;
				case "OnCommand": device[event.Property].Command(event.To); break;
			}
		});
	}

	private static EventToWS(event: PropertyChangeEventArgs, type: string): WSEvent {
		let wsEvent: WSEvent = {
			Device: {
				Home: event.Device.Configuration.Home,
				Room: event.Device.Configuration.Room,
				Name: event.Device.Configuration.Name,
			},

			Property: event.Property,
			Event: type,

			To: event.To
		};

		return wsEvent;
	}
}
