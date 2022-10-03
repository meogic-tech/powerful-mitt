export type AsArray<T> = T extends any[] ? T : [T];

export type MittCommand<TPayload, Return> = {
	name: string,
	commands?: MittCommand<unknown, unknown>[],
};


/**
 * Type helper for extracting the payload type from a command.
 *
 * @example
 * ```ts
 * const MY_COMMAND = createCommand<SomeType>();
 *
 * // ...
 *
 * editor.registerCommand(MY_COMMAND, payload => {
 *   // Type of `payload` is inferred here. But lets say we want to extract a function to delegate to
 *   handleMyCommand(editor, payload);
 *   return true;
 * });
 *
 * function handleMyCommand(editor: TabManagerEditor, payload: CommandPayloadType<typeof MY_COMMAND>) {
 *   // `payload` is of type `SomeType`, extracted from the command.
 * }
 * ```
 */
export type CommandPayloadType<TCommand extends MittCommand<unknown, unknown>> =
	TCommand extends MittCommand<infer TPayload, unknown> ? TPayload : never;

export type CommandListener<P, R> = (...args: AsArray<P>) => R;

export type Commands = Map<MittCommand<unknown, unknown>,
	Array<CommandListener<unknown, unknown>>>;

let commandNameCache: Map<string, MittCommand<unknown, unknown>> = new Map()

/**
 * each command <b>must</b> has different name.
 * @param name
 */
export function createCommand<T, R>(name: string): MittCommand<T, R> {
	if (commandNameCache.has(name)) {
		console.warn('COMMAND_NAME_DUPLICATE_ERROR when create name')
		// @ts-ignore
		return commandNameCache.get(name)
	}
	commandNameCache.set(name, { name })
	// @ts-ignore
	return commandNameCache.get(name);
}

export const ALL_COMMAND = createCommand<Array<unknown>, void>('*')

export const clearCommandCache = () => {
	commandNameCache = new Map()
}
