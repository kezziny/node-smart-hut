import { Observable, Subscriber } from 'rxjs';

export class Event<T>
{
    private Subscription: Subscriber<T>;
    private Observable: Observable<T> = new Observable<T>(subscriber => this.Subscription = subscriber);

    public Invoke(data: T): void
    {
        this.Subscription?.next(data);
    }

    public Subscribe(callback: (data: T) => void)
    {
        this.Observable.subscribe(callback);
    }
}