import { EmitterPlugin } from './index';
import { EmitterHooks } from '../emitter';
import { ALL_COMMAND, AsArray, CommandListener, Commands, MittCommand } from '../commands';
import { GET_COMMAND_LISTENERS_ERROR } from '../errors';
import { debug } from '../log';

type CommandNest = Map<MittCommand<unknown, unknown>, CommandNest | Array<CommandListener<unknown, unknown>>>

let cacheMap: Map<string, MittCommand<unknown, unknown>> = new Map()

export function createNestCommand<T, R>(...commands: MittCommand<unknown, unknown>[]): MittCommand<T, R> {
	const name = commands.map(c => c.name).join(':')
	if (cacheMap.has(name)) {
		// @ts-ignore
		return cacheMap.get(name)
	}
	const n = {
		name,
		commands
	}
	cacheMap.set(name, n)
	return n
}

export const clearNestCommandCache = () => {
	cacheMap = new Map()
}


/**
 * you can nest cammand
 */
export class CommandNestHook implements EmitterPlugin {

	name: string
	parent!: EmitterPlugin
	tempAll!: Commands;

	commandMap: CommandNest

	constructor() {
		this.name = 'CommandNestHook';
		this.commandMap = new Map()
	}

	register(hooks: EmitterHooks, parent: EmitterPlugin): void {
		this.parent = parent;
		hooks.onHook.tap({
			name: this.name
		}, this.on.bind(this))
		hooks.beforeEmitHook.tap({
			name: this.name,
			before: parent.name
		}, this.beforeEmit.bind(this))
		hooks.afterEmitHook.tap({
			name: this.name,
			before: parent.name
		}, this.afterEmit.bind(this))
		hooks.offHook.tap({
			name: this.name,
			before: parent.name
		}, this.off.bind(this))
	}

	private on<P, R>(
		done: boolean,
		command: MittCommand<P, R>,
		handler: CommandListener<unknown, unknown>,
		options: {}): boolean {
		debug('CommandNestHook, on')
		if (done) {
			return true
		}
		if (command.commands && command.commands.length > 0) {
			const listeners = this.getListenersByCommands(...command.commands)
			listeners.splice(0, listeners.length)
			for (const handler1 of this.parent.all!.get(command) as Array<CommandListener<unknown, unknown>>) {
				listeners.push(handler1)
			}
		}
		return false
	}

	getListenersByCommands(...commands: MittCommand<unknown, unknown>[]): Array<CommandListener<unknown, unknown>> {
		let tempCommandMap: CommandNest = this.commandMap
		let resultArray: Array<CommandListener<unknown, unknown>> | undefined
		let lastCommandIsAllCommand = false
		for (let i = 0; i < commands.length; i++) {
			if (Array.isArray(tempCommandMap)) {
				break
			}
			const command = commands[i]
			let nestOrListeners: CommandNest | CommandListener<unknown, unknown>[] | undefined
			lastCommandIsAllCommand = command === ALL_COMMAND
			if (command === ALL_COMMAND) {
				let isArray = false
				const values = Array.from(tempCommandMap.values())
				if (values.length > 0) {
					isArray = Array.isArray(values[0])
				}
				if (isArray) {
					nestOrListeners = []
					for (const value of values) {
						nestOrListeners.push(
							...(value as Array<CommandListener<unknown, unknown>>)
						)
					}
				} else {
					nestOrListeners = new Map()
					for (const [pKey, value] of Array.from(tempCommandMap.entries())) {
						const v = value as CommandNest
						for (const key of Array.from(v.keys())) {
							// key is command
							nestOrListeners.set(createNestCommand(pKey, key), v.get(key)!)
						}
					}
				}
			} else {
				nestOrListeners = tempCommandMap.get(command)
			}
			if (nestOrListeners === undefined) {
				if (i < commands.length - 1) {
					// not the last, so set nest
					nestOrListeners = new Map() as CommandNest
				} else {
					// is the last, so set listeners
					nestOrListeners = [] as Array<CommandListener<unknown, unknown>>
				}
				tempCommandMap.set(command, nestOrListeners)
			}
			if (i < commands.length - 1) {
				tempCommandMap = nestOrListeners as CommandNest
			} else if (Array.isArray(nestOrListeners)) {
				resultArray = nestOrListeners as Array<CommandListener<unknown, unknown>>
			} else if (lastCommandIsAllCommand && nestOrListeners.size > 0) {
				// current is ALL_COMMAND
				i--
				tempCommandMap = nestOrListeners as CommandNest
			}

		}
		if (resultArray) {
			return resultArray
		}
		throw GET_COMMAND_LISTENERS_ERROR
	}


	private beforeEmit(
		done: boolean,
		command: MittCommand<unknown, unknown>,
		args: AsArray<unknown>): boolean {
		if (done) {
			return true
		}
		debug('CommandNestHook, beforeEmit')
		if (command.commands && command.commands.length > 0) {
			this.tempAll = this.parent.all!
			this.parent.all = new Map()
			this.parent.all.set(command, this.getListenersByCommands(...command.commands))
			return true
		}
		return false
	}

	private afterEmit(
		done: boolean,
		command: MittCommand<unknown, unknown>,
		args: AsArray<unknown>): boolean {
		if (command.commands && command.commands.length > 0) {
			this.parent.all = this.tempAll
		}
		return true
	}


	private off<P, R>(
		done: boolean,
		type: MittCommand<P, R>,
		handler: CommandListener<unknown, unknown> | undefined,
		options: { [key: string]: any }): boolean {
		if (done) {
			return true
		}
		this.findSubCommand(this.commandMap, (array) => {
			const handlerToDelete = []
			const targetHandlers = Array.from(this.parent.all!.values())
			for (const handler of array) {
				let isFound = false
				for (const targetHandlerArray of targetHandlers) {
					for (const targetHandler of targetHandlerArray) {
						if (handler === targetHandler) {
							isFound = true
						}
					}
				}
				if (!isFound) {
					handlerToDelete.push(handler)
				}
			}
			for (const handler of handlerToDelete) {
				array.splice(array.indexOf(handler) >>> 0, 1)
			}
		})

		return false
	}

	findSubCommand(commandNest: CommandNest, callbackWhenChildIsArray: (array: Array<CommandListener<unknown, unknown>>) => void) {
		const values = Array.from(commandNest.values())
		if (values.length === 0) {
			return
		}
		if (values.length > 0) {
			for (const value of values) {
				if (Array.isArray(values[0])) {
					callbackWhenChildIsArray(value as Array<CommandListener<unknown, unknown>>)
				} else {
					this.findSubCommand(value as CommandNest, callbackWhenChildIsArray)
				}
			}
		}
	}


}
