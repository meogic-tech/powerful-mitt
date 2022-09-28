import { EmitterPlugin } from './index';
import {
	EmitterHooks
} from '../emitter';
import { CommandListener, MittCommand } from '../commands';
import { debug } from '../log';


export class KeyHook implements EmitterPlugin {

	name: string

	keyOfHandlerMap: Map<string, Array<CommandListener<unknown, unknown>>>
	parent!: EmitterPlugin
	isLastOff: boolean

	constructor(isLastOff?: boolean) {
		this.keyOfHandlerMap = new Map();
		this.isLastOff = isLastOff || false
		this.name = 'KeyHook'
	}

	register(hooks: EmitterHooks, parent: EmitterPlugin): void {
		hooks.onHook.tap({
			name: this.name,
			before: parent.name
		}, this.on.bind(this))
		hooks.offHook.tap({
			name: this.name,
			before: parent.name
		}, this.off.bind(this))
		this.parent = parent;
	}

	private on<P, R>(
		done: boolean,
		command: MittCommand<P, R>,
		handler: CommandListener<P, R>,
		options: { [key: string]: any }): boolean{
		if (done) {
			return true
		}
		debug('KeyHook, on')
		if (options.key !== undefined && typeof options.key === 'string') {
			const handlers = this.keyOfHandlerMap.get(options.key)
			if (handlers) {
				// @ts-ignore
				handlers.push(handler)
			} else {
				// @ts-ignore
				this.keyOfHandlerMap.set(options.key, [handler])
			}
		}
		return false
	}

	/**
	 * type is need
	 * when options.key exist, the handlers with type will be deleted in which has specific key
	 * @param done
	 * @param all
	 * @param command
	 * @param handler
	 * @param options
	 * @private
	 */
	private off<P, R>(
		done: boolean,
		command: MittCommand<P, R>,
		handler: CommandListener<unknown, unknown> | undefined,
		options: { [key: string]: any }): boolean {
		if (done) {
			return true
		}
		debug('KeyHook, off')
		if (options.key !== undefined && typeof options.key === 'string') {
			// when options.key exist
			const handlers = this.parent.all!.get(command);
			const handlersInKey = this.keyOfHandlerMap.get(options.key)
			if (handlers && handlersInKey) {
				// delete handler in handlers which has key
				for (const h of handlersInKey) {
					handlers.splice(handlers.indexOf(h) >>> 0, 1);
				}
				return this.isLastOff
			}
		}

		return false
	}

}
