import { EmitterHooks } from '../emitter';
import { EmitterPlugin } from './index';
import { ALL_COMMAND, AsArray, CommandListener, MittCommand } from '../commands';
import { debug } from '../log';

/**
 * By the default, this hook will change the order of execution
 * In order to enable the later registered listeners to overwrite the earlier registered listeners, by the way returning true
 */
export class FailEmitHook implements EmitterPlugin {
	name: string
	parent!: EmitterPlugin
	reverse: boolean

	constructor(reverse = true) {
		this.reverse = reverse;
		this.name = 'FailEmitHook'
	}

	register(hooks: EmitterHooks, parent: EmitterPlugin): void {
		hooks.emitHook.tap({
			name: this.name,
			before: parent.name
		}, this.emit.bind(this))
		this.parent = parent;
	}

	private emit(
		done: boolean,
		command: MittCommand<unknown, unknown>,
		args: AsArray<unknown>): boolean{
		if (done){
			return true
		}
		debug('FailEmitHook, emit')
		let handlers = this.parent.all!.get(command);
		if (handlers) {
			if (this.reverse){
				handlers = handlers.reverse()
			}
			for (const handler of (handlers as Array<CommandListener<unknown, unknown>>)) {
				this.parent.hooks!.executeHook.call(command, handler, args)
				const result = handler(...args);
				// @ts-ignore
				if (result !== undefined && (result as Promise)!.then !== undefined){
					// console.warn('when function is async, FailEmitHook will not working')
				}
				if (result === true){
					break
				}
			}
		}
		handlers = this.parent.all!.get(ALL_COMMAND);
		if (handlers) {
			if (this.reverse){
				handlers = handlers.reverse()
			}
			for (const handler of (handlers as Array<CommandListener<Array<unknown>, unknown>>)) {
				// Here must be hooks!, otherwise closure-compiler will throw PLUGIN_ERROR when `npm run build-prod`
				this.parent.hooks!.executeHook.call(command, handler, args)
				const result = handler(command, args);
				if (result !== undefined || result !== Promise.resolve(undefined)){
					break
				}
			}
		}
		return true
	}

}
