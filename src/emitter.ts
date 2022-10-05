import { SyncWaterfallHook } from 'tapable';
import { AsArray, CommandListener, CommandPayloadType, Commands, MittCommand } from './commands';
import { BaseHook } from './hooks/BaseHook';
import { EmitterPlugin } from './hooks';
import { PriorityHook } from './hooks/PriorityHook';
import { KeyHook } from './hooks/KeyHook';
import { CommandNestHook } from './hooks/CommandNestHook';
import { FailEmitHook } from './hooks/FailEmitHook';

export interface EmitterHooks {
	onHook: SyncWaterfallHook<[boolean, MittCommand<unknown, unknown>,
		CommandListener<unknown, unknown>,
		{ [x: string]: any }
	]>
	beforeEmitHook: SyncWaterfallHook<[boolean, MittCommand<unknown, unknown>, AsArray<unknown>]>,
	emitHook: SyncWaterfallHook<[boolean, MittCommand<unknown, unknown>, AsArray<unknown>]>,
	executeHook: SyncWaterfallHook<[MittCommand<unknown, unknown>, CommandListener<unknown, unknown>, AsArray<unknown>]>,
	afterEmitHook: SyncWaterfallHook<[boolean, MittCommand<unknown, unknown>, AsArray<unknown>]>,
	offHook: SyncWaterfallHook<[boolean, MittCommand<unknown, unknown>,
			CommandListener<unknown, unknown> | undefined,
		{ [x: string]: any }
	]>
}

export class Emitter {

	all: Commands
	hooks: EmitterHooks
	baseHook: BaseHook


	constructor(all?: Commands) {
		this.all = all || new Map();
		this.hooks = {
			onHook: new SyncWaterfallHook(['done', 'type', 'handler', 'options']),
			beforeEmitHook: new SyncWaterfallHook(['done', 'type', 'event']),
			emitHook: new SyncWaterfallHook(['done', 'type', 'event']),
			executeHook: new SyncWaterfallHook(['command', 'handler', 'event']),
			afterEmitHook: new SyncWaterfallHook(['done', 'type', 'event']),
			offHook: new SyncWaterfallHook(['done', 'type', 'handler', 'options'])
		}
		this.baseHook = new BaseHook(this.all)
		this.use(this.baseHook)
	}

	use(plugin: EmitterPlugin) {
		plugin.register(this.hooks, this.baseHook)
	}

	/**
	 * when you
	 * @param command
	 * @param handler
	 * @param options
	 */
	on<P, R>(
		command: MittCommand<P, R>,
		handler: CommandListener<P, R>,
		options?: { [key: string]: any }
	) {
		// @ts-ignore
		this.hooks.onHook.call(false, command, handler, options || {})
	}

	emit<TCommand extends MittCommand<unknown, unknown>,
		TPayload extends CommandPayloadType<TCommand>>(
		command: TCommand,
		...args: AsArray<TPayload>
	) {
		this.hooks.beforeEmitHook.call(false, command, args)
		this.hooks.emitHook.call(false, command, args)
		this.hooks.afterEmitHook.call(false, command, args)
	}


	off<P extends Array<unknown>, R>(
		command: MittCommand<P, R>,
		handler?: CommandListener<P, R>,
		options?: { [key: string]: any }
	) {
		// @ts-ignore
		this.hooks.offHook.call(false, command, handler, options || {})
	}

}

export function createEmitter(config: {
	key?: boolean,
	priority?: boolean,
	commandNest?: boolean,
	failEmit?: boolean,
} = {}) {
	const emitter = new Emitter()
	if (config.priority) {
		emitter.use(new PriorityHook())
	}
	if (config.key) {
		emitter.use(new KeyHook())
	}
	if (config.commandNest) {
		emitter.use(new CommandNestHook())
	}
	if (config.failEmit) {

		/**
		 * <h1>when priority turns true</h1>
		 * the all Commands 's handler list order changed by it.
		 * so we will compliance it's order.
		 * <h1>when priority turns false</h1>
		 * We want the execute order
		 */
		emitter.use(new FailEmitHook(!config.priority))
	}
	return emitter
}
