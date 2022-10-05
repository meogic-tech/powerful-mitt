import { EmitterPlugin } from './index';
import {
	EmitterHooks
} from '../emitter';
import { ALL_COMMAND, AsArray, CommandListener, Commands, MittCommand } from '../commands';
import { debug } from '../log';


export class BaseHook implements EmitterPlugin{

	/**
	 * TODO add eslint to rule the `name = 'BaseHook'`
	 * if do so, the rollup plugin `rollup-plugin-closure-compiler` will throw error which is Syntax Error
	 */
	name: string

	all: Commands
	hooks!: EmitterHooks;

	constructor(all: Commands) {
		this.all = all;
		this.name = 'BaseHook'
	}

	register(hooks: EmitterHooks, parent: EmitterPlugin): void {
		this.hooks = hooks
		hooks.onHook.tap(this.name, this.on.bind(this))
		hooks.emitHook.tap(this.name, this.emit.bind(this))
		hooks.offHook.tap(this.name, this.off.bind(this))
	}

	private on<P, R>(
		done: boolean,
		command: MittCommand<P, R>,
		handler: CommandListener<P, R>,
		options: {}): boolean{
		if (done){
			return true
		}
		debug('BaseHook, on')
		const handlers = this.all.get(command);
		this.addHandleInHandlers(this.all, command, handlers, handler)
		return false
	}

	protected addHandleInHandlers<P, R>(
		listeners: Commands,
		command: MittCommand<P, R>,
		handlers:  CommandListener<P, R>[] |  undefined,
		handler: CommandListener<P, R>
	): void {
		if (!handlers){
			// @ts-ignore
			listeners.set(command, [handler])
			return
		}
		if (handlers && Array.isArray(handlers)){
			handlers.push(handler)
			return
		}
		if (handlers && !Array.isArray(handlers)){
			console.warn("Don't support EventHandlerMap nesting")
			return
		}
	}

	private emit(
		done: boolean,
		command: MittCommand<unknown, unknown>,
		args: AsArray<unknown>): boolean{
		if (done){
			return true
		}
		debug('BaseHook, emit')
		let handlers = this.all!.get(command);
		if (handlers) {
			(handlers as Array<CommandListener<unknown, unknown>>)
				.slice()
				.map((handler) => {
					this.hooks.executeHook.call(command, handler, args)
					handler(...args);
				});
		}
		handlers = this.all!.get(ALL_COMMAND);
		if (handlers) {
			(handlers as Array<CommandListener<Array<unknown>, void>>)
				.slice()
				.map((handler) => {
					this.hooks.executeHook.call(command, handler, args)
					handler(command, args);
				});
		}
		return false
	}

	private off<P, R>(
		done: boolean,
		command: MittCommand<P, R>,
		handler: CommandListener<unknown, unknown> | undefined,
		options: {}): boolean{
		if (done){
			return true
		}
		debug('BaseHook, off')
		const handlers = this.all.get(command);
		if (handlers && Array.isArray(handlers)) {
			if (handler) {
				handlers.splice(handlers.indexOf(handler) >>> 0, 1);
			}
			else {
				this.all.set(command, []);
			}
		}
		return false
	}

}
