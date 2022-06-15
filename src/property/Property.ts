import { Reflection } from '@kezziny/reflection';
import { Device, DeviceExtension } from '../device';
import { Event } from '../Event';
import { PropertyChangeEventArgs } from './PropertyChangedEventArgs';
import { IPropertyContent } from './IPropertyContent';

export class Property
{

	// region Events
	public OnChanging = new Event<PropertyChangeEventArgs>();
	public OnChanged = new Event<PropertyChangeEventArgs>();
	public OnControlling = new Event<PropertyChangeEventArgs>();
	public OnControlled = new Event<PropertyChangeEventArgs>();
	// endregion

	private Device: Device<any>;
	public Name: string;
	private _Value: IPropertyContent = null;
	public readonly Unit: string;

	public constructor(device: Device<any>, unit: string)
	{
		this.Device = device;
		this.Unit = unit;
	}

	public Configure(name: string): void
	{
		this.Name = name;
	}

	public get Value(): IPropertyContent
	{
		return this._Value;
	}

	public Bind(value: IPropertyContent)
	{
		const eventArgs = new PropertyChangeEventArgs(this.Device, this.Name, this._Value, value);
		this.OnChanging.Invoke(eventArgs);
		if (eventArgs.To === null) return;
		this._Value = eventArgs.To;
		console.log(`${this.Device.ID}/${this.Name} =`, this._Value);
		this.OnChanged.Invoke(eventArgs);
	}

	public SyncTo(value: IPropertyContent)
	{
		const eventArgs = new PropertyChangeEventArgs(this.Device, this.Name, this._Value, value);
		if (eventArgs.To === null) return;
		this._Value = eventArgs.To;
		console.log(`${this.Device.ID}/${this.Name} =`, this._Value);
		this.OnChanged.Invoke(eventArgs);
	}

	public Control(value: IPropertyContent)
	{
		const eventArgs = new PropertyChangeEventArgs(this.Device, this.Name, this._Value, value);
		this.OnControlling.Invoke(eventArgs);
		if (eventArgs.To === null) return;
		this.OnControlled.Invoke(eventArgs);
	}


	public static readonly KeyTag = 'Property.Tag';

	public static Tag(args: { [key: string]: string; })
	{
		return function (device: Device<any>, property: string)
		{
			Reflection.SetPropertyMetadata(device, property, Property.KeyTag, args);
		};
	}
}
