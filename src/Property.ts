import { Reflection } from '@kezziny/reflection';
import { Observable } from 'rxjs';
import { Device, DeviceExtension } from './Device';
import { Interval } from './enums/Interval';
import { Unit } from './enums/Unit';




type SimpleType = number | boolean | string;

interface IPropertyContent<T extends SimpleType> {
	value: T;
	[key: string]: SimpleType;
}

export class PropertyChangeEventArgs {
	Property: string;
	From: IPropertyContent<any>;
	To: IPropertyContent<any>;

	public constructor (property: string, from: IPropertyContent<any>, to: IPropertyContent<any>) {
		this.Property = property;
		this.From = from;
		this.To = to;
	}

	public Cancel(): void {
		this.To = null;
	}
}

export class Property<T extends number | boolean | string> {
	private static readonly OnPropertyChangingKey = "OnPropertyChanging";
	private static readonly OnPropertyChangedKey = "OnPropertyChanged";

	private static HourlyTickObserver;
	private static HourlyTick = new Observable<Date>((observer) => Property.HourlyTickObserver = observer);
	private static DailyTickObserver;
	private static DailyTick = new Observable<Date>((observer) => Property.DailyTickObserver = observer);
	public static StartInterval() {		
		let now = new Date();
		setTimeout(() => {
			setInterval(() => {
				let date = new Date();
				Property.HourlyTickObserver.next(date);
				if (date.getHours() === 0) {
					Property.DailyTickObserver.next(date);
				}
			}, 60 * 60 * 1000);
		}, (60 - now.getMinutes()) * 60 * 1000);
	}

	private Device: Device;
	public Name: string;
	private _Value: IPropertyContent<T> = null;
	private _Unit: Unit;

	public constructor(device: Device, unit: Unit, update: Interval = Interval.Never) {
		this.Device = device;
		this._Unit = unit;
		
		switch (update) {
			case Interval.Hourly: Property.HourlyTick.subscribe(date => this.Value = this._Value); break;
			case Interval.Daily: Property.DailyTick.subscribe(date => this.Value = this._Value); break;
		}
	}

	public get Unit(): Unit {
		return this._Unit;
	}

	public get Value(): IPropertyContent<T> {
		return this._Value;
	}

	public set Value(value: IPropertyContent<T>) {
		let eventArgs = new PropertyChangeEventArgs(this.Name, this._Value, value);
		this.CallMethodsWithMetadata(Property.OnPropertyChangingKey, eventArgs);
		if (eventArgs.To === null) return;
		this._Value = eventArgs.To;
		this.CallMethodsWithMetadata(Property.OnPropertyChangedKey, eventArgs);
	}

	private CallMethodsWithMetadata(key: string, eventArgs: PropertyChangeEventArgs): void {
		this.Device.GetMethodsWithMetadata(key)
			.filter(method => method.Metadata[key] === 'Any' || method.Metadata[key] === this.Name)
			.forEach(method => method.Object[method.Name](eventArgs));
	}


	public static OnChanging(targetProperty: string = 'Any') {
		return function (device: Device | DeviceExtension, property: string) {
			Reflection.SetPropertyMetadata(device, property, Property.OnPropertyChangingKey, targetProperty);
		}
	}

	public static OnChanged(targetProperty: string = 'Any') {
		return function (device: Device | DeviceExtension, property: string) {
			Reflection.SetPropertyMetadata(device, property, Property.OnPropertyChangedKey, targetProperty);
		}
	}
}
