import { Device } from '../device';
import { IPropertyContent } from './IPropertyContent';

export class PropertyChangeEventArgs
{
	EventSource: 'local' | 'network';
	Device: Device<any>;
	Property: string;
	From: IPropertyContent;
	To: IPropertyContent;

	public constructor(device: Device<any>, property: string, from: IPropertyContent, to: IPropertyContent, eventSource: 'local' | 'network' = 'local')
	{
		this.Device = device;
		this.Property = property;
		this.From = from;
		this.To = to;
		this.EventSource = eventSource;
	}

	public Cancel(): void
	{
		this.To = null;
	}
}