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
			this.setCommandsToCommandMap(this.commandMap, 0, command, ...command.commands)
		}
		return false
	}

	setCommandsToCommandMap(commandMap: CommandNest, i: number, rootCommand: MittCommand<unknown, unknown>, ...commands: MittCommand<unknown, unknown>[]) {
		const command = commands[i]
		if (command === ALL_COMMAND){
			const listeners = []
			const newNestCommand = createNestCommand(...commands.slice(0, i + 1))
			if (this.parent.all){
				for (const handler1 of this.parent.all!.get(newNestCommand) as Array<CommandListener<unknown, unknown>>) {
					listeners.push(handler1)
				}
			}
			commandMap.set(command, listeners)
		} else {
			// 不是最后一个
			if (i < commands.length - 1){
				let commandNest = commandMap.get(command) as CommandNest
				if(commandNest === undefined){
					commandNest = new Map() as CommandNest
					commandMap.set(command, commandNest)
				}
				this.setCommandsToCommandMap(commandNest, i + 1, rootCommand, ...commands)
			} else if (Array.isArray(this.parent.all!.get(rootCommand))){
				const listeners = []
				for (const handler1 of this.parent.all!.get(rootCommand) as Array<CommandListener<unknown, unknown>>) {
					listeners.push(handler1)
				}
				commandMap.set(command, listeners)
				// console.log("commandMap", commandMap, 'command', command, 'commands', commands.map(c => c.name).join(','));
			}
		}

	}

	getListenersByCommands2(commandMap: CommandNest, i: number, ...commands: MittCommand<unknown, unknown>[]): Array<CommandListener<unknown, unknown>> {
		const resultArray: Array<CommandListener<unknown, unknown>> = []
		/**
		 * {
		 *     "A": [fun1, fun2]
		 * }
		 */
		const command = commands[i]
		// map or list or undefined
		if (command === ALL_COMMAND){
			// 当前所有的子命令就要递归下去
			// 比如A下面的B、C
			for (const subCommandMap of Array.from(commandMap.values())) {
				if (subCommandMap === undefined){
					// 1. 没有找到，就不处理
				} else if (Array.isArray(subCommandMap)){
					// 2. 已经找到对应的监听数组了
					resultArray.push(...subCommandMap)
				} else {
					// 3. 当前A下面还有B，根据AB直接找的话就能就能走到上面的情况1或2，然后就能返回对应的监听数组了
					/**
					 * 此时subCommandMap可能是{
					 *   { name: 'E' } => [ [Function: ADEFunc] ],
					 *   { name: 'F' } => [ [Function: ADFFunc] ]
					 * }
					 * 所以要针对这些subCommand进行递归
					 */
					for (const subCommand of Array.from(subCommandMap.keys())) {
						const subResultArray = this.getListenersByCommands2(subCommandMap, i + 1, ...[...commands.slice(0, i + 1), subCommand, ALL_COMMAND])
						resultArray.push(...subResultArray)
					}
					// console.log('commands', commands.map(c => c.name).join(','), 'command', command.name, "subCommandMap", subCommandMap)
				}
				// console.log('commands', commands.map(c => c.name).join(','), 'command', command.name, "listenerList", subCommandMap);
			}

		} else {
			const subCommandMap = commandMap.get(command)
			if (subCommandMap === undefined){
				// 1. 没有找到，就不处理
			} else if (Array.isArray(subCommandMap)){
				// 2. 已经找到对应的监听数组了
				resultArray.push(...subCommandMap)
			} else {
				// 3. 当前A下面还有B，根据AB直接找的话就能就能走到上面的情况1或2，然后就能返回对应的监听数组了
				const subResultArray = this.getListenersByCommands2(subCommandMap, i + 1, ...commands)
				resultArray.push(...subResultArray)
			}
			// console.log('commands', commands.map(c => c.name).join(','), 'command', command.name, "listenerList", subCommandMap);
		}

		return resultArray
	}

	/**
	 * @deprecated
	 * @param commands
	 */
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
					// [[function1], [function2], [function3]]
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
			// console.log('commands', commands.map(c => c.name).join(','), 'command', command.name, 'nestOrListeners', nestOrListeners)
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
				// console.log('commands', commands.map(c => c.name).join(','), 'command', command.name, 'lastCommandIsAllCommand', lastCommandIsAllCommand)
			}

		}
		if (resultArray) {
			// console.log('commands', commands.map(c => c.name), 'resultArray', resultArray)
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
			this.parent.all.set(command, this.getListenersByCommands2(this.commandMap, 0, ...command.commands))
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
		command: MittCommand<P, R>,
		handler: CommandListener<unknown, unknown> | undefined,
		options: { [key: string]: any }): boolean {
		if (done) {
			return true
		}
		debug('CommandNestHook, off')
		// 先修正全局的all里面的监听
		if (handler){
			const handlers = this.parent.all!.get(command);
			if (handlers && Array.isArray(handlers)) {
				if (handler) {
					handlers.splice(handlers.indexOf(handler) >>> 0, 1);
				}
				else {
					this.parent.all!.set(command, []);
				}
			}
		}
		// 然后根据全局的all来修正本插件的commandMap
		if (command.commands && command.commands.length > 0) {
			this.setCommandsToCommandMap(this.commandMap, 0, command, ...command.commands)
		}
		return false
	}

	findSubCommand(commandNest: CommandNest, callbackWhenChildIsArray: (array: Array<CommandListener<unknown, unknown>>) => void) {
		const values = Array.from(commandNest.values())
		if (values.length === 0) {
			return
		}
		if (values.length > 0) {
			for (const value of values) {
				if (Array.isArray(value)) {
					callbackWhenChildIsArray(value as Array<CommandListener<unknown, unknown>>)
				} else {
					this.findSubCommand(value as CommandNest, callbackWhenChildIsArray)
				}
			}
		}
	}


}
