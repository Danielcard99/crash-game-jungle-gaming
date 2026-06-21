export interface EventPublisher {
  emit(pattern: string, data: unknown): unknown;
}
