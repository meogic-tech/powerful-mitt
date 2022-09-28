import { EmitterPlugin } from './index';
import { CommandListener, MittCommand } from '../commands';
import { EmitterHooks } from '../emitter';
import { debug } from '../log';

/**
 * when a handler be set a priority by options, it will be trigger after the higher priority handler
 * recommend execute order
 * - on func executed last
 * - off func executed last
 */
export class PriorityHook implements EmitterPlugin {

	name: string
	parent!: EmitterPlugin
	priorityArray: Array<[MittCommand<unknown, unknown>, CommandListener<unknown, unknown>]>[]
	increase: boolean
	isLastOff: boolean

	constructor(increase = true, isLastOff = false) {
		this.increase = increase
		this.isLastOff = isLastOff
		this.name = 'PriorityHook'
		this.priorityArray = []
	}

	register(hooks: EmitterHooks, parent: EmitterPlugin): void {
		hooks.onHook.tap({
			name: this.name
		}, this.on.bind(this))
		hooks.offHook.tap({
			name: this.name
		}, this.off.bind(this))
		this.parent = parent;
	}

	private on<P, R>(
		done: boolean,
		command: MittCommand<P, R>,
		handler: CommandListener<unknown, unknown>,
		options: { [key: string]: any }): boolean {
		if (done) {
			return true
		}
		debug('PriorityHook, on')
		const isExistPriority = options.priority !== undefined
			&& typeof options.priority === 'number'
			&& options.priority === parseInt(options.priority.toFixed())

		// when priority exist
		let priority: number = options.priority
		if (!isExistPriority) {
			priority = 0
		}
		this.initialArray(priority)
		const listenerArray = this.priorityArray[priority]
		listenerArray.push([command, handler])
		const listenerArrayInAll = this.parent.all!.get(command)
		if (!listenerArrayInAll) {
			return false
		}
		listenerArrayInAll.splice(0, listenerArrayInAll.length)
		for (let i = this.priorityArray.length-1; i >= 0; i--) {
			const priorityArrayElement = this.priorityArray[i]
			for (const [_, handlerInArray] of priorityArrayElement) {
				listenerArrayInAll.push(handlerInArray)
			}
		}
		return false
	}

	private initialArray(index: number) {
		if (this.priorityArray.length < index + 1) {
			for (let i = this.priorityArray.length; i < index + 1; i++) {
				this.priorityArray.push([])
			}
		}
	}

	private off<P, R>(
		done: boolean,
		type: MittCommand<P, R>,
		handler: CommandListener<unknown, unknown> | undefined,
		options: { [key: string]: any }): boolean {
		debug('PriorityHook, off')
		const newPriorityArray: Array<[MittCommand<unknown, unknown>, CommandListener<unknown, unknown>]>[] = []
		for (const priorityArrayElement of this.priorityArray) {
			const newPriorityArrayElement: Array<[MittCommand<unknown, unknown>, CommandListener<unknown, unknown>]> = []
			for (const [command, handler] of priorityArrayElement) {
				if (this.parent.all!.get(command) && this.parent.all!.get(command)!.indexOf(handler) > -1){
					newPriorityArrayElement.push([command, handler])
				}
			}
			newPriorityArray.push(newPriorityArrayElement)
		}
		this.priorityArray = newPriorityArray
		return this.isLastOff
	}

}
