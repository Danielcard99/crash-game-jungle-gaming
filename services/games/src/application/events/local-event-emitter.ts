export interface LocalEventEmitter {
  emit(event: string, payload: unknown): unknown;
}
