import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';

export function createContainer(): DependencyContainer {
  return container.createChildContainer();
}
