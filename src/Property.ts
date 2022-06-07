import { Reflection } from '@kezziny/reflection';
import { Observable, Subscriber } from 'rxjs';
import { Device, DeviceExtension } from './Device';
import { Interval } from './enums/Interval';
import { Unit } from './enums/Unit';


export type SimpleType = number | boolean | string;

interface IPropertyContent<T extends SimpleType> {
	value: T;
	[key: string]: SimpleType;
}

export class PropertyChangeEventArgs {
	Device: Device<any>;
	Property: string;
	From: IPropertyContent<any>;
	To: IPropertyContent<any>;

	public constructor (device: Device<any>, property: string, from: IPropertyContent<any>, to: IPropertyContent<any>) {
		this.Device = device;
		this.Property = property;
		this.From = from;
		this.To = to;
	}

	public Cancel(): void {
		this.To = null;
	}
}

export class Property<T extends number | boolean | string> {
	private static readonly KeyOnChanging = "Property.OnChanging";
	private static readonly KeyOnChanged = "Property.OnChanged";
	private static readonly KeyOnCommand = "Property.OnCommand";

	OnChangingSubscriber: Subscriber<PropertyChangeEventArgs>;
	OnChangingObservable = new Observable<PropertyChangeEventArgs>(subscriber => this.OnChangingSubscriber = subscriber);
	OnChangedSubscriber: Subscriber<PropertyChangeEventArgs>;
	OnChangedObservable = new Observable<PropertyChangeEventArgs>(subscriber => this.OnChangedSubscriber = subscriber);
	OnCommandSubscriber: Subscriber<PropertyChangeEventArgs>;
	OnCommandObservable = new Observable<PropertyChangeEventArgs>(subscriber => this.OnCommandSubscriber = subscriber);

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

	private Device: Device<any>;
	public Name: string;
	private _Value: IPropertyContent<T> = null;
	private _Unit: Unit;

	public constructor(device: Device<any>, unit: Unit, update: Interval = Interval.Never) {
		this.Device = device;
		this._Unit = unit;
		
		switch (update) {
			case Interval.Hourly: Property.HourlyTick.subscribe(date => this.Bind(this._Value)); break;
			case Interval.Daily: Property.DailyTick.subscribe(date => this.Bind(this._Value)); break;
		}
	}

	public get Unit(): Unit {
		return this._Unit;
	}

	public get Value(): IPropertyContent<T> {
		return this._Value;
	}

	public Bind(value: IPropertyContent<T>) {
		let eventArgs = new PropertyChangeEventArgs(this.Device, this.Name, this._Value, value);
		this.CallMethodsWithMetadata(Property.KeyOnChanging, eventArgs);
		this.OnChangingSubscriber?.next(eventArgs);
		if (eventArgs.To === null) return;
		this.Bound(eventArgs.To);
	}

	public Bound(value: IPropertyContent<T>) {
		this._Value = value;
		let eventArgs = new PropertyChangeEventArgs(this.Device, this.Name, this._Value, value);
		this.CallMethodsWithMetadata(Property.KeyOnChanged, eventArgs);
		this.OnChangedSubscriber?.next(eventArgs);
	}

	public Command(value: IPropertyContent<T>) {
		let eventArgs = new PropertyChangeEventArgs(this.Device, this.Name, this._Value, value);
		this.CallMethodsWithMetadata(Property.KeyOnCommand, eventArgs);
		this.OnCommandSubscriber?.next(eventArgs);
	}

	public get OnChanging(): Observable<PropertyChangeEventArgs> {
		return this.OnChangingObservable;
	}

	public get OnChanged(): Observable<PropertyChangeEventArgs> {
		return this.OnChangedObservable;
	}

	public get OnCommand(): Observable<PropertyChangeEventArgs> {
		return this.OnCommandObservable;
	}

	private CallMethodsWithMetadata(key: string, eventArgs: PropertyChangeEventArgs): void {
		this.Device.GetMethodsWithMetadata(key)
			.filter(method => method.Metadata[key] === 'Any' || method.Metadata[key] === this.Name)
			.forEach(method => method.Object[method.Name](eventArgs));
	}


	public static OnChanging(targetProperty: string = 'Any') {
		return function (device: Device<any> | DeviceExtension, property: string) {
			Reflection.SetPropertyMetadata(device, property, Property.KeyOnChanging, targetProperty);
		}
	}

	public static OnChanged(targetProperty: string = 'Any') {
		return function (device: Device<any> | DeviceExtension, property: string) {
			Reflection.SetPropertyMetadata(device, property, Property.KeyOnChanged, targetProperty);
		}
	}

	public static OnCommand(targetProperty: string = 'Any') {
		return function (device: Device<any> | DeviceExtension, property: string) {
			Reflection.SetPropertyMetadata(device, property, Property.KeyOnCommand, targetProperty);
		}
	}

	// OnChanging
	// OnChanged
	// OnCommandProcessing
	// OnCommand
}
